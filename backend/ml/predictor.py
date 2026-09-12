import os
import pickle
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# Load model bundle once at module level
_artifact = None

def _get_artifact():
    global _artifact
    if _artifact is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model artifact not found at {MODEL_PATH}. Run train_model.py first.")
        with open(MODEL_PATH, "rb") as f:
            _artifact = pickle.load(f)
    return _artifact

def predict_risk(
    rainfall_mm: float,
    soil_moisture_pct: float,
    slope_angle_deg: float,
    elevation_m: float,
    rolling_rainfall_24h: float = None,
    rolling_rainfall_72h: float = None,
    avg_neighbor_risk: float = None
) -> dict:
    """
    Takes physical, temporal, and spatial landslide trigger parameters and computes:
      - risk_score: int (0-100)
      - risk_level: str ('Low' <30, 'Moderate' 30-60, 'High' 60-80, 'Critical' >80)
      - shap_breakdown: dict mapping feature name to normalized attribution weight (0.0 to 1.0)
    """
    artifact = _get_artifact()
    model = artifact["model"]
    explainer = artifact["explainer"]
    features = artifact["features"]

    # Compute sensible fallbacks if temporal or spatial features are not explicitly supplied
    rf = float(rainfall_mm)
    r24 = float(rolling_rainfall_24h) if rolling_rainfall_24h is not None else max(rf, round(rf * 1.35, 1))
    r72 = float(rolling_rainfall_72h) if rolling_rainfall_72h is not None else max(r24, round(rf * 2.1, 1))
    n_risk = float(avg_neighbor_risk) if avg_neighbor_risk is not None else 35.0

    input_dict = {
        "rainfall_mm": rf,
        "rolling_rainfall_24h": r24,
        "rolling_rainfall_72h": r72,
        "soil_moisture_pct": float(soil_moisture_pct),
        "slope_angle_deg": float(slope_angle_deg),
        "elevation_m": float(elevation_m),
        "avg_neighbor_risk": float(n_risk)
    }

    input_df = pd.DataFrame([input_dict])[features]

    # Predict probability of landslide occurrence (class 1)
    proba = float(model.predict_proba(input_df)[0][1])
    risk_score = int(np.clip(round(proba * 100), 0, 100))

    # Determine risk level per contract
    if risk_score < 30:
        risk_level = "Low"
    elif risk_score < 60:
        risk_level = "Moderate"
    elif risk_score <= 80:
        risk_level = "High"
    else:
        risk_level = "Critical"

    # Compute real SHAP feature attribution
    shap_raw = explainer.shap_values(input_df)
    
    if isinstance(shap_raw, list):
        # Multi-class format list: [class_0_shap, class_1_shap]
        class_shap = shap_raw[1][0]
    elif len(shap_raw.shape) == 3:
        # Array format (1, num_features, num_classes)
        class_shap = shap_raw[0, :, 1]
    else:
        # Single output format (1, num_features)
        class_shap = shap_raw[0]

    # Convert to positive attribution weights representing relative feature influence
    abs_shap = np.abs(class_shap)
    sum_abs = np.sum(abs_shap)

    if sum_abs > 1e-6:
        normalized_shap = abs_shap / sum_abs
    else:
        normalized_shap = np.ones(len(features)) / len(features)

    # Clean feature names for official dashboard display
    feature_keys = {
        "rainfall_mm": "instant_rainfall",
        "rolling_rainfall_24h": "rolling_24h",
        "rolling_rainfall_72h": "rolling_72h",
        "soil_moisture_pct": "soil_moisture",
        "slope_angle_deg": "slope",
        "elevation_m": "elevation",
        "avg_neighbor_risk": "neighbor_risk"
    }

    shap_breakdown = {
        feature_keys.get(feat, feat): round(float(normalized_shap[i]), 2)
        for i, feat in enumerate(features)
    }

    # Normalize weights so sum is cleanly 1.0
    total = sum(shap_breakdown.values())
    if total > 0:
        first_key = list(shap_breakdown.keys())[0]
        shap_breakdown[first_key] = round(shap_breakdown[first_key] + (1.0 - total), 2)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "shap_breakdown": shap_breakdown,
        "engineered_inputs": {
            "rolling_rainfall_24h": r24,
            "rolling_rainfall_72h": r72,
            "avg_neighbor_risk": n_risk
        }
    }

if __name__ == "__main__":
    print("\n--- Testing 7-feature predict_risk() wrapper ---")
    test_res = predict_risk(
        rainfall_mm=120.0,
        soil_moisture_pct=82.0,
        slope_angle_deg=34.0,
        elevation_m=1100.0,
        rolling_rainfall_24h=190.0,
        rolling_rainfall_72h=310.0,
        avg_neighbor_risk=72.0
    )
    print("Test Result:", test_res)
