import os
import json
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from xgboost import XGBClassifier
import shap

np.random.seed(42)

def generate_synthetic_data(n_samples=2500):
    """
    Generates synthetic training dataset calibrated for North Eastern India landslide corridors
    (Assam and Meghalaya NH-44 / NH-37).
    
    Includes geotechnical temporal buildup (24h & 72h rolling precipitation) and
    spatial neighborhood correlation (avg_neighbor_risk).
    """
    # 1. Instantaneous Rainfall (mm) - Gamma distribution typical of monsoon cloudbursts
    rainfall_mm = np.random.gamma(shape=2.5, scale=32.0, size=n_samples)
    rainfall_mm = np.clip(rainfall_mm, 0.0, 350.0)

    # 2. Engineered Temporal Features:
    # 24h Rolling Rainfall: instantaneous rain + previous 24h antecedent accumulation
    antecedent_24h = np.random.gamma(shape=2.0, scale=25.0, size=n_samples)
    rolling_rainfall_24h = rainfall_mm + antecedent_24h
    rolling_rainfall_24h = np.clip(rolling_rainfall_24h, rainfall_mm, 500.0)

    # 72h Cumulative Rainfall: 24h accumulation + previous 48h prolonged monsoon soaking
    antecedent_48h = np.random.gamma(shape=3.0, scale=30.0, size=n_samples)
    rolling_rainfall_72h = rolling_rainfall_24h + antecedent_48h
    rolling_rainfall_72h = np.clip(rolling_rainfall_72h, rolling_rainfall_24h, 800.0)

    # 3. Soil Moisture (%) - Highly driven by 72h prolonged accumulation + groundwater baseline
    base_moisture = np.random.uniform(15.0, 45.0, size=n_samples)
    moisture_buildup = (rolling_rainfall_72h / 800.0) * 50.0 + (rainfall_mm / 350.0) * 15.0
    soil_moisture_pct = base_moisture + moisture_buildup + np.random.normal(0, 4.0, size=n_samples)
    soil_moisture_pct = np.clip(soil_moisture_pct, 10.0, 99.0)

    # 4. Physical Terrain Features
    slope_angle_deg = np.random.uniform(5.0, 52.0, size=n_samples)
    elevation_m = np.random.uniform(150.0, 2100.0, size=n_samples)

    # 5. Engineered Spatial Feature: avg_neighbor_risk (0 to 100)
    # Correlates with regional cloudburst extent and regional slope instability
    regional_weather_intensity = (rolling_rainfall_72h / 800.0) * 60.0 + (slope_angle_deg / 50.0) * 30.0
    avg_neighbor_risk = regional_weather_intensity + np.random.normal(0, 8.0, size=n_samples)
    avg_neighbor_risk = np.clip(avg_neighbor_risk, 5.0, 95.0)

    # 6. Geotechnical Landslide Failure Surface Function
    # Physical drivers:
    # A. Slope shear stress threshold (>26 degrees starts critical loss of cohesion)
    slope_factor = 1.0 / (1.0 + np.exp(-(slope_angle_deg - 27.0) / 4.5))

    # B. Subsurface Saturation (pore-water pressure buildup > 60%)
    moisture_factor = 1.0 / (1.0 + np.exp(-(soil_moisture_pct - 62.0) / 7.0))

    # C. Cumulative 72h soaking trigger (deep slip-plane liquefaction)
    soak_72h_factor = 1.0 / (1.0 + np.exp(-(rolling_rainfall_72h - 180.0) / 40.0))

    # D. Acute instantaneous rain trigger (>85 mm flash pulse)
    flash_rain_factor = 1.0 / (1.0 + np.exp(-(rainfall_mm - 85.0) / 25.0))

    # E. Spatial neighborhood vulnerability (regional strain on corridor)
    neighbor_factor = avg_neighbor_risk / 100.0

    # Non-linear interaction: slope failure occurs when steep slope is combined with saturated soil & prolonged soak
    critical_interaction = slope_factor * moisture_factor * (0.5 * soak_72h_factor + 0.3 * flash_rain_factor + 0.2)

    # Orographic elevation relief
    elevation_factor = 0.12 * (elevation_m / 2000.0)

    # Latent failure score with realistic stochastic noise
    noise = np.random.logistic(loc=0.0, scale=0.42, size=n_samples)
    latent_score = (
        -2.5 
        + (3.2 * critical_interaction) 
        + (1.2 * soak_72h_factor) 
        + (0.9 * flash_rain_factor) 
        + (1.1 * slope_factor) 
        + (0.8 * neighbor_factor) 
        + elevation_factor 
        + noise
    )

    prob = 1.0 / (1.0 + np.exp(-latent_score))
    landslide_occurred = (prob >= 0.50).astype(int)

    df = pd.DataFrame({
        "rainfall_mm": np.round(rainfall_mm, 2),
        "rolling_rainfall_24h": np.round(rolling_rainfall_24h, 2),
        "rolling_rainfall_72h": np.round(rolling_rainfall_72h, 2),
        "soil_moisture_pct": np.round(soil_moisture_pct, 2),
        "slope_angle_deg": np.round(slope_angle_deg, 2),
        "elevation_m": np.round(elevation_m, 2),
        "avg_neighbor_risk": np.round(avg_neighbor_risk, 2),
        "landslide_occurred": landslide_occurred
    })

    return df

def train_and_benchmark():
    os.makedirs("d:/GiriRakshak/backend/ml", exist_ok=True)

    print("Generating 2,500 synthetic rows of landslide terrain data with temporal and spatial features...")
    df = generate_synthetic_data(2500)
    dataset_path = "d:/GiriRakshak/backend/ml/synthetic_data.csv"
    df.to_csv(dataset_path, index=False)
    print(f"Dataset saved to {dataset_path}")
    print(f"Landslide incidence rate: {df['landslide_occurred'].mean()*100:.1f}%\n")

    features = [
        "rainfall_mm",
        "rolling_rainfall_24h",
        "rolling_rainfall_72h",
        "soil_moisture_pct",
        "slope_angle_deg",
        "elevation_m",
        "avg_neighbor_risk"
    ]
    
    X = df[features]
    y = df["landslide_occurred"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )

    print("Benchmarking 3 candidate models on identical test split:")
    print("1. Logistic Regression (Interpretable baseline)")
    print("2. Random Forest (Ensemble bagging)")
    print("3. XGBoost (Gradient boosting)")
    print("-" * 65)

    # 1. Logistic Regression Baseline
    lr = LogisticRegression(max_iter=1500, random_state=42)
    lr.fit(X_train, y_train)
    y_pred_lr = lr.predict(X_test)
    metrics_lr = {
        "accuracy": round(float(accuracy_score(y_test, y_pred_lr)), 4),
        "precision": round(float(precision_score(y_test, y_pred_lr)), 4),
        "recall": round(float(recall_score(y_test, y_pred_lr)), 4),
        "f1": round(float(f1_score(y_test, y_pred_lr)), 4)
    }

    # 2. Random Forest Classifier
    rf = RandomForestClassifier(n_estimators=160, max_depth=9, min_samples_split=4, random_state=42)
    rf.fit(X_train, y_train)
    y_pred_rf = rf.predict(X_test)
    metrics_rf = {
        "accuracy": round(float(accuracy_score(y_test, y_pred_rf)), 4),
        "precision": round(float(precision_score(y_test, y_pred_rf)), 4),
        "recall": round(float(recall_score(y_test, y_pred_rf)), 4),
        "f1": round(float(f1_score(y_test, y_pred_rf)), 4)
    }

    # 3. XGBoost Classifier
    xgb = XGBClassifier(n_estimators=130, max_depth=5, learning_rate=0.07, eval_metric="logloss", random_state=42)
    xgb.fit(X_train, y_train)
    y_pred_xgb = xgb.predict(X_test)
    metrics_xgb = {
        "accuracy": round(float(accuracy_score(y_test, y_pred_xgb)), 4),
        "precision": round(float(precision_score(y_test, y_pred_xgb)), 4),
        "recall": round(float(recall_score(y_test, y_pred_xgb)), 4),
        "f1": round(float(f1_score(y_test, y_pred_xgb)), 4)
    }

    benchmark = {
        "models": {
            "Logistic Regression": {
                "name": "Logistic Regression",
                "type": "Linear Baseline",
                "description": "Linear probabilistic classifier with L2 regularization. High interpretability, but struggles with non-linear soil-moisture-slope interaction thresholds.",
                "metrics": metrics_lr
            },
            "Random Forest": {
                "name": "Random Forest",
                "type": "Ensemble Bagging",
                "description": "Forest of 160 decision trees. Strong resilience to noisy field sensor feeds and robust capture of slope-moisture threshold cliffs.",
                "metrics": metrics_rf
            },
            "XGBoost": {
                "name": "XGBoost",
                "type": "Gradient Boosting",
                "description": "Sequentially boosted shallow trees optimizing log-loss. Exceptional performance on complex interaction surfaces with minimal variance.",
                "metrics": metrics_xgb
            }
        },
        "features": features,
        "sample_count": len(df),
        "test_split": 0.25
    }

    # Determine winner based on F1 score (critical for rare hazard event prediction)
    candidates = [
        ("Logistic Regression", lr, metrics_lr),
        ("Random Forest", rf, metrics_rf),
        ("XGBoost", xgb, metrics_xgb)
    ]
    candidates.sort(key=lambda c: c[2]["f1"], reverse=True)

    winner_name, winner_model, winner_metrics = candidates[0]
    benchmark["winner"] = winner_name
    benchmark["winner_reason"] = (
        f"{winner_name} achieved the highest F1-Score ({winner_metrics['f1']:.4f}) on the holdout test set, "
        f"striking the optimal balance between disaster detection recall ({winner_metrics['recall']*100:.1f}%) "
        f"and false-alarm prevention precision ({winner_metrics['precision']*100:.1f}%)."
    )

    print("\n================== 3-MODEL BENCHMARK RESULTS ==================")
    print(f"{'Metric':<12} | {'Logistic Reg.':<15} | {'Random Forest':<15} | {'XGBoost':<15}")
    print("-" * 65)
    for m in ["accuracy", "precision", "recall", "f1"]:
        print(f"{m.capitalize():<12} | {metrics_lr[m]:<15.4f} | {metrics_rf[m]:<15.4f} | {metrics_xgb[m]:<15.4f}")
    print("-" * 65)
    print(f"Champion Selected: {winner_name} (F1 = {winner_metrics['f1']:.4f})")
    print(f"Reason: {benchmark['winner_reason']}\n")

    # Save benchmark metrics to JSON for the frontend UI
    comparison_path = "d:/GiriRakshak/backend/ml/model_comparison.json"
    with open(comparison_path, "w") as f:
        json.dump(benchmark, f, indent=2)
    print(f"Model comparison saved to {comparison_path}")

    # Build SHAP TreeExplainer for the chosen champion model
    print(f"Configuring SHAP Explainer for {winner_name}...")
    if winner_name in ["Random Forest", "XGBoost"]:
        explainer = shap.TreeExplainer(winner_model)
    else:
        explainer = shap.LinearExplainer(winner_model, X_train)

    # Save model artifact bundle
    model_artifact = {
        "model": winner_model,
        "model_name": winner_name,
        "features": features,
        "metrics": winner_metrics,
        "benchmark": benchmark,
        "explainer": explainer
    }

    model_path = "d:/GiriRakshak/backend/ml/model.pkl"
    with open(model_path, "wb") as f:
        pickle.dump(model_artifact, f)

    print(f"Champion model bundle successfully saved to {model_path}!")

if __name__ == "__main__":
    train_and_benchmark()
