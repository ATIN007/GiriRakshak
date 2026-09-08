import os
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
import shap

np.random.seed(42)

def generate_synthetic_data(n_samples=2000):
    """
    Generates 2,000 synthetic rows calibrated for North Eastern India landslide terrain:
    - rainfall_mm: 0 to 350 mm
    - soil_moisture_pct: 10% to 98%
    - slope_angle_deg: 5 to 55 degrees
    - elevation_m: 100 to 2200 meters
    
    Non-linear geotechnical relationship with realistic noise.
    """
    # 1. Feature distributions typical of Assam & Meghalaya monsoon corridors
    rainfall_mm = np.random.gamma(shape=2.5, scale=35.0, size=n_samples)
    rainfall_mm = np.clip(rainfall_mm, 0.0, 350.0)

    # Soil moisture correlates with rainfall but with independent variation (groundwater/soil type)
    base_moisture = np.random.uniform(15.0, 60.0, size=n_samples)
    soil_moisture_pct = base_moisture + (rainfall_mm / 350.0) * 40.0 + np.random.normal(0, 5.0, size=n_samples)
    soil_moisture_pct = np.clip(soil_moisture_pct, 10.0, 98.0)

    slope_angle_deg = np.random.uniform(5.0, 50.0, size=n_samples)
    elevation_m = np.random.uniform(150.0, 2000.0, size=n_samples)

    # 2. Non-linear Landslide Susceptibility Index (LSI)
    # Geotechnical drivers:
    # - Slope threshold: steep slopes (>28 deg) dramatically reduce shear resistance
    slope_factor = 1.0 / (1.0 + np.exp(-(slope_angle_deg - 28.0) / 5.0))

    # - Saturation factor: soil moisture > 65% triggers pore-water pressure buildup
    moisture_factor = 1.0 / (1.0 + np.exp(-(soil_moisture_pct - 65.0) / 8.0))

    # - Heavy rainfall shock: acute triggers (>100mm)
    rain_factor = 1.0 / (1.0 + np.exp(-(rainfall_mm - 90.0) / 25.0))

    # Non-linear interaction: acute trigger occurs when steep slope AND saturated soil combine
    interaction_trigger = slope_factor * moisture_factor * (0.6 * rain_factor + 0.4)

    # Orographic elevation relief contribution (higher elevations in NE hills experience steeper weathered cuts)
    elevation_factor = 0.15 * (elevation_m / 2000.0)

    # Latent log-odds with realistic stochastic noise (simulating unmeasured rock fissures, vegetation cover)
    noise = np.random.logistic(loc=0.0, scale=0.45, size=n_samples)
    latent_score = -2.2 + (2.8 * interaction_trigger) + (1.5 * rain_factor) + (1.2 * slope_factor) + elevation_factor + noise

    # Logistic probability
    prob = 1.0 / (1.0 + np.exp(-latent_score))
    landslide_occurred = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "rainfall_mm": np.round(rainfall_mm, 2),
        "soil_moisture_pct": np.round(soil_moisture_pct, 2),
        "slope_angle_deg": np.round(slope_angle_deg, 2),
        "elevation_m": np.round(elevation_m, 2),
        "landslide_occurred": landslide_occurred
    })

    return df

def train_and_evaluate():
    os.makedirs("d:/GiriRakshak/backend/ml", exist_ok=True)

    print("Generating 2,000 synthetic rows of landslide data...")
    df = generate_synthetic_data(2000)
    dataset_path = "d:/GiriRakshak/backend/ml/synthetic_data.csv"
    df.to_csv(dataset_path, index=False)
    print(f"Dataset saved to {dataset_path}")
    print(f"Class distribution:\n{df['landslide_occurred'].value_counts(normalize=True)}")

    features = ["rainfall_mm", "soil_moisture_pct", "slope_angle_deg", "elevation_m"]
    X = df[features]
    y = df["landslide_occurred"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42, stratify=y)

    print("\n--- Training Random Forest Classifier ---")
    rf = RandomForestClassifier(n_estimators=150, max_depth=8, min_samples_split=4, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    y_prob_rf = rf.predict_proba(X_test)[:, 1]

    metrics_rf = {
        "accuracy": accuracy_score(y_test, y_pred_rf),
        "precision": precision_score(y_test, y_pred_rf),
        "recall": recall_score(y_test, y_pred_rf),
        "f1": f1_score(y_test, y_pred_rf)
    }

    print("\n--- Training XGBoost Classifier ---")
    xgb = XGBClassifier(n_estimators=120, max_depth=5, learning_rate=0.08, eval_metric="logloss", random_state=42)
    xgb.fit(X_train, y_train)
    y_pred_xgb = xgb.predict(X_test)
    y_prob_xgb = xgb.predict_proba(X_test)[:, 1]

    metrics_xgb = {
        "accuracy": accuracy_score(y_test, y_pred_xgb),
        "precision": precision_score(y_test, y_pred_xgb),
        "recall": recall_score(y_test, y_pred_xgb),
        "f1": f1_score(y_test, y_pred_xgb)
    }

    print("\n================ MODEL EVALUATION SUMMARY ================")
    print(f"{'Metric':<12} | {'Random Forest':<15} | {'XGBoost':<15}")
    print("-" * 46)
    for m in ["accuracy", "precision", "recall", "f1"]:
        print(f"{m.capitalize():<12} | {metrics_rf[m]:.4f}          | {metrics_xgb[m]:.4f}")

    # Select best model based on F1 score (balanced precision & recall)
    if metrics_xgb["f1"] >= metrics_rf["f1"]:
        chosen_model_name = "XGBoost"
        chosen_model = xgb
        chosen_metrics = metrics_xgb
    else:
        chosen_model_name = "Random Forest"
        chosen_model = rf
        chosen_metrics = metrics_rf

    print(f"\nSelected Model: {chosen_model_name} (F1 Score: {chosen_metrics['f1']:.4f})")

    print("\nBuilding SHAP TreeExplainer for real feature attributions...")
    explainer = shap.TreeExplainer(chosen_model)

    # Save model artifact bundle
    model_artifact = {
        "model": chosen_model,
        "model_name": chosen_model_name,
        "features": features,
        "metrics": chosen_metrics,
        "explainer": explainer
    }

    model_path = "d:/GiriRakshak/backend/ml/model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_artifact, f)

    print(f"Model and SHAP explainer successfully saved to {model_path}!")

if __name__ == "__main__":
    train_and_evaluate()
