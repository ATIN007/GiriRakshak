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

def predict_risk(rainfall_mm: float, soil_moisture_pct: float, slope_angle_deg: float, elevation_m: float) -> dict:
    """
    Takes physical landslide trigger parameters and computes:
      - risk_score: int (0-100)
      - risk_level: str ('Low' <30, 'Moderate' 30-60, 'High' 60-80, 'Critical' >80)
      - shap_breakdown: dict mapping feature name to normalized attribution weight (0.0 to 1.0)
    """
    artifact = _get_artifact()
    model = artifact["model"]
    explainer = artifact["explainer"]
    features = artifact["features"]

    input_df = pd.DataFrame([{
        "rainfall_mm": float(rainfall_mm),
        "soil_moisture_pct": float(soil_moisture_pct),
        "slope_angle_deg": float(slope_angle_deg),
        "elevation_m": float(elevation_m)
    }])[features]

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
    # TreeExplainer returns shap values for each class; for binary classification, index 1 is landslide=1
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
        "rainfall_mm": "rainfall",
        "soil_moisture_pct": "soil_moisture",
        "slope_angle_deg": "slope",
        "elevation_m": "elevation"
    }

    shap_breakdown = {
        feature_keys.get(feat, feat): round(float(normalized_shap[i]), 2)
        for i, feat in enumerate(features)
    }

    # Ensure weights sum nicely to ~1.0
    total = sum(shap_breakdown.values())
    if total > 0:
        # Minor adjustment to ensure rounded values cleanly reflect contributions
        first_key = list(shap_breakdown.keys())[0]
        shap_breakdown[first_key] = round(shap_breakdown[first_key] + (1.0 - total), 2)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "shap_breakdown": shap_breakdown
    }

if __name__ == "__main__":
    # Test cases across diverse hazard scenarios
    test_cases = [
        {"name": "Gentle slope, dry conditions", "params": (10.0, 25.0, 8.0, 300.0)},
        {"name": "Moderate rain, intermediate slope", "params": (65.0, 55.0, 22.0, 700.0)},
        {"name": "Steep slope, high soil moisture", "params": (110.0, 78.0, 34.0, 1200.0)},
        {"name": "Extreme monsoon downpour, saturated cliff", "params": (240.0, 95.0, 44.0, 1600.0)}
    ]

    print("\n--- Testing predict_risk() wrapper ---")
    for tc in test_cases:
        res = predict_risk(*tc["params"])
        print(f"\nScenario: {tc['name']}")
        print(f"Inputs: {tc['params']}")
        print(f"Output: {res}")
