import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from database import supabase
from ml.predictor import predict_risk
from sms import send_critical_sms_alert

app = FastAPI(
    title="GiriRakshak AI Landslide Warning API",
    description="Early warning and explainable AI system for India's North Eastern Region (Smart India Hackathon).",
    version="1.1.0"
)

# Enable CORS for all origins (ideal for hackathon frontend & offline sync)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Spatial & Temporal Helper Functions ---

def compute_3nn_neighbor_risk(target_zone: dict, all_zones: list) -> float:
    """Calculates the average current_risk_score of the 3 nearest zones using Euclidean distance on (lat, lon)."""
    distances = []
    t_lat, t_lon = float(target_zone["lat"]), float(target_zone["lon"])
    for z in all_zones:
        if z["id"] == target_zone["id"]:
            continue
        z_lat, z_lon = float(z["lat"]), float(z["lon"])
        dist = (z_lat - t_lat)**2 + (z_lon - t_lon)**2
        distances.append((dist, float(z.get("current_risk_score") or 25.0)))
    
    distances.sort(key=lambda x: x[0])
    nearest_3 = distances[:3]
    if not nearest_3:
        return 30.0
    return round(sum(d[1] for d in nearest_3) / len(nearest_3), 1)

def compute_rolling_rainfall(zone_id: int, current_rainfall: float) -> tuple[float, float]:
    """
    Computes rolling_rainfall_24h and rolling_rainfall_72h from risk_history records.
    If historical records exist, aggregates antecedent precipitation.
    """
    try:
        history_res = (
            supabase.table("risk_history")
            .select("rainfall_mm, timestamp")
            .eq("zone_id", zone_id)
            .order("timestamp", desc=True)
            .limit(10)
            .execute()
        )
        records = history_res.data or []
        past_readings = [float(r.get("rainfall_mm", 0.0)) for r in records if r.get("rainfall_mm") is not None]
        if past_readings:
            # 24h accumulation includes current + previous readings (last 3 intervals)
            r24 = current_rainfall + sum(past_readings[:3]) * 0.35
            # 72h cumulative includes past readings over longer window
            r72 = r24 + sum(past_readings[:8]) * 0.55
        else:
            r24 = current_rainfall * 1.35
            r72 = current_rainfall * 2.15
        return round(max(current_rainfall, r24), 1), round(max(r24, r72), 1)
    except Exception:
        return round(current_rainfall * 1.35, 1), round(current_rainfall * 2.15, 1)

# --- Pydantic Schemas ---

class PredictRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=500, description="Instantaneous rainfall in millimeters")
    soil_moisture_pct: float = Field(..., ge=0, le=100, description="Soil saturation percentage")
    slope_angle_deg: float = Field(..., ge=0, le=90, description="Terrain slope angle in degrees")
    elevation_m: float = Field(..., ge=0, le=8000, description="Elevation above sea level in meters")
    rolling_rainfall_24h: Optional[float] = Field(None, ge=0, le=1000, description="24h cumulative rainfall (mm)")
    rolling_rainfall_72h: Optional[float] = Field(None, ge=0, le=2000, description="72h cumulative rainfall (mm)")
    avg_neighbor_risk: Optional[float] = Field(None, ge=0, le=100, description="Average risk score of 3 nearest zones")

class SimulateRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=500, description="Simulated rainfall in millimeters")
    soil_moisture_pct: float = Field(..., ge=0, le=100, description="Simulated soil saturation percentage")

class HazardReportCreate(BaseModel):
    zone_id: Optional[int] = Field(None, description="Associated zone ID if matched")
    reporter_name: str = Field(..., description="Citizen or officer name")
    description: str = Field(..., description="Details of slope movement, crack, or debris")
    photo_url: Optional[str] = Field(None, description="Optional photo URL or base64 placeholder")
    lat: float = Field(..., description="Latitude of hazard")
    lon: float = Field(..., description="Longitude of hazard")
    synced: Optional[bool] = Field(True, description="Sync status from offline client")

class SendTestAlertRequest(BaseModel):
    zone_id: Optional[int] = Field(5, description="Target zone ID for alert")
    phone_number: Optional[str] = Field("+91-9876543210", description="Recipient phone number")

# --- API Endpoints ---

@app.get("/", tags=["General"])
def root():
    return {
        "service": "GiriRakshak API",
        "status": "online",
        "version": "1.1.0",
        "region": "North Eastern Region (Assam & Meghalaya corridors)",
        "features_supported": [
            "rainfall_mm", "rolling_rainfall_24h", "rolling_rainfall_72h",
            "soil_moisture_pct", "slope_angle_deg", "elevation_m", "avg_neighbor_risk"
        ],
        "docs_url": "/docs"
    }

@app.get("/model/benchmark", tags=["AI Engine"])
def get_model_benchmark():
    """Returns side-by-side performance metrics for Logistic Regression, Random Forest, and XGBoost."""
    comparison_file = os.path.join(os.path.dirname(__file__), "ml", "model_comparison.json")
    if os.path.exists(comparison_file):
        with open(comparison_file, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Benchmark metrics file not found. Run train_model.py first.")

@app.get("/zones", tags=["Zones"])
def get_zones():
    """Fetch all monitored landslide risk zones."""
    try:
        response = supabase.table("zones").select("*").order("id").execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/zones/{zone_id}", tags=["Zones"])
def get_zone_by_id(zone_id: int):
    """Fetch detailed telemetry, terrain metrics, and recent history for a specific zone."""
    try:
        zone_res = supabase.table("zones").select("*").eq("id", zone_id).execute()
        if not zone_res.data:
            raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
        
        zone = zone_res.data[0]

        # Fetch recent risk history for sparklines & trends
        history_res = (
            supabase.table("risk_history")
            .select("*")
            .eq("zone_id", zone_id)
            .order("timestamp", desc=True)
            .limit(10)
            .execute()
        )
        zone["history"] = history_res.data

        return zone
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/predict", tags=["AI Engine"])
def predict(request: PredictRequest):
    """
    Run physical, temporal, and spatial parameters through the trained ML model.
    Returns:
      - risk_score: 0-100
      - risk_level: Low, Moderate, High, Critical
      - shap_breakdown: Real SHAP-computed feature attribution breakdown across 7 features
      - engineered_inputs: Derived temporal & spatial feature values
    """
    try:
        result = predict_risk(
            rainfall_mm=request.rainfall_mm,
            soil_moisture_pct=request.soil_moisture_pct,
            slope_angle_deg=request.slope_angle_deg,
            elevation_m=request.elevation_m,
            rolling_rainfall_24h=request.rolling_rainfall_24h,
            rolling_rainfall_72h=request.rolling_rainfall_72h,
            avg_neighbor_risk=request.avg_neighbor_risk
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/zones/{zone_id}/simulate", tags=["AI Engine & Simulation"])
def simulate_zone_readings(zone_id: int, request: SimulateRequest):
    """
    HACKATHON DEMO ENDPOINT:
    Pushes simulated rainfall and soil moisture into a zone,
    dynamically computes temporal rolling rainfall (24h/72h) and 3-NN spatial neighbor risk,
    re-evaluates risk with SHAP, updates the zone in Supabase, logs to risk_history,
    and dispatches SMS if Critical (>80).
    """
    try:
        # 1. Fetch all zones to compute 3-NN spatial correlation
        all_zones_res = supabase.table("zones").select("*").execute()
        all_zones = all_zones_res.data or []
        
        target_zone_matches = [z for z in all_zones if z["id"] == zone_id]
        if not target_zone_matches:
            raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
        
        zone = target_zone_matches[0]

        # 2. Compute spatial 3-nearest-neighbor average risk
        avg_neighbor_risk = compute_3nn_neighbor_risk(zone, all_zones)

        # 3. Compute temporal rolling rainfall (24h & 72h)
        rolling_24h, rolling_72h = compute_rolling_rainfall(zone_id, request.rainfall_mm)

        # 4. Run prediction using the zone's fixed terrain + engineered temporal & spatial features
        prediction = predict_risk(
            rainfall_mm=request.rainfall_mm,
            soil_moisture_pct=request.soil_moisture_pct,
            slope_angle_deg=zone["slope_angle_deg"],
            elevation_m=zone["elevation_m"],
            rolling_rainfall_24h=rolling_24h,
            rolling_rainfall_72h=rolling_72h,
            avg_neighbor_risk=avg_neighbor_risk
        )

        risk_score = prediction["risk_score"]
        risk_level = prediction["risk_level"]
        shap_breakdown = prediction["shap_breakdown"]
        now_iso = datetime.utcnow().isoformat()

        # 5. Update the zone in Supabase
        update_data = {
            "current_rainfall_mm": request.rainfall_mm,
            "current_soil_moisture_pct": request.soil_moisture_pct,
            "current_risk_score": risk_score,
            "risk_level": risk_level,
            "last_updated": now_iso
        }
        supabase.table("zones").update(update_data).eq("id", zone_id).execute()

        # 6. Insert new log in risk_history
        history_entry = {
            "zone_id": zone_id,
            "timestamp": now_iso,
            "risk_score": risk_score,
            "rainfall_mm": request.rainfall_mm,
            "soil_moisture_pct": request.soil_moisture_pct,
            "slope_angle_deg": zone["slope_angle_deg"],
            "shap_breakdown": shap_breakdown
        }
        supabase.table("risk_history").insert(history_entry).execute()

        # 7. If Critical (>80), log alert and fire SMS dispatch
        alert_result = None
        if risk_level == "Critical":
            alert_dispatch = send_critical_sms_alert(
                zone_name=zone["name"],
                risk_score=risk_score,
                rainfall_mm=request.rainfall_mm,
                soil_moisture_pct=request.soil_moisture_pct
            )

            alert_entry = {
                "zone_id": zone_id,
                "risk_score": risk_score,
                "message": alert_dispatch["message"],
                "channel": alert_dispatch["channel"],
                "sent_at": now_iso
            }
            supabase.table("alerts_log").insert(alert_entry).execute()
            alert_result = alert_dispatch

        return {
            "success": True,
            "zone_id": zone_id,
            "zone_name": zone["name"],
            "new_readings": {
                "rainfall_mm": request.rainfall_mm,
                "soil_moisture_pct": request.soil_moisture_pct,
                "rolling_rainfall_24h": rolling_24h,
                "rolling_rainfall_72h": rolling_72h,
                "avg_neighbor_risk": avg_neighbor_risk
            },
            "prediction": prediction,
            "alert_dispatched": alert_result is not None,
            "alert_details": alert_result
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")

@app.post("/hazard-reports", tags=["Offline Field Reports"])
def create_hazard_report(report: HazardReportCreate):
    """
    Submits a hazard observation (ground cracks, mud seep, rocks).
    Designed to receive reports queued locally when officers/citizens were offline.
    """
    try:
        report_data = {
            "zone_id": report.zone_id,
            "reporter_name": report.reporter_name,
            "description": report.description,
            "photo_url": report.photo_url,
            "lat": report.lat,
            "lon": report.lon,
            "synced": True,
            "created_at": datetime.utcnow().isoformat()
        }
        response = supabase.table("hazard_reports").insert(report_data).execute()
        return {
            "success": True,
            "message": "Hazard report recorded successfully",
            "data": response.data[0] if response.data else report_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save hazard report: {str(e)}")

@app.get("/hazard-reports", tags=["Offline Field Reports"])
def get_hazard_reports():
    """Fetch all submitted hazard reports, newest first."""
    try:
        response = supabase.table("hazard_reports").select("*").order("created_at", desc=True).execute()
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")

@app.get("/alerts", tags=["Alerts & SMS"])
def get_alerts():
    """Fetch alert dispatch audit log, newest first."""
    try:
        response = (
            supabase.table("alerts_log")
            .select("*, zones(name)")
            .order("sent_at", desc=True)
            .execute()
        )
        return response.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")

@app.post("/alerts/test", tags=["Alerts & SMS"])
def send_test_alert(payload: SendTestAlertRequest):
    """Trigger manual test alert to verify SMS gateway setup."""
    try:
        zone_id = payload.zone_id or 5
        zone_res = supabase.table("zones").select("name").eq("id", zone_id).execute()
        zone_name = zone_res.data[0]["name"] if zone_res.data else "NH-44 Corridor Sector"

        result = send_critical_sms_alert(
            zone_name=zone_name,
            risk_score=92,
            rainfall_mm=210.0,
            soil_moisture_pct=88.5,
            phone_number=payload.phone_number
        )

        now_iso = datetime.utcnow().isoformat()
        alert_entry = {
            "zone_id": zone_id,
            "risk_score": 92,
            "message": result["message"],
            "channel": result["channel"],
            "sent_at": now_iso
        }
        supabase.table("alerts_log").insert(alert_entry).execute()

        return {"success": True, "dispatch_info": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Test alert failed: {str(e)}")
