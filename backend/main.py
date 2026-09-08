import os
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
    version="1.0.0"
)

# Enable CORS for all origins (ideal for hackathon frontend & offline sync)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---

class PredictRequest(BaseModel):
    rainfall_mm: float = Field(..., ge=0, le=500, description="Rainfall in millimeters")
    soil_moisture_pct: float = Field(..., ge=0, le=100, description="Soil saturation percentage")
    slope_angle_deg: float = Field(..., ge=0, le=90, description="Terrain slope angle in degrees")
    elevation_m: float = Field(..., ge=0, le=8000, description="Elevation above sea level in meters")

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
        "region": "North Eastern Region (Assam & Meghalaya corridors)",
        "docs_url": "/docs"
    }

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
    Run raw parameters through the trained ML model.
    Returns:
      - risk_score: 0-100
      - risk_level: Low, Moderate, High, Critical
      - shap_breakdown: Real SHAP-computed feature attribution breakdown
    """
    try:
        result = predict_risk(
            rainfall_mm=request.rainfall_mm,
            soil_moisture_pct=request.soil_moisture_pct,
            slope_angle_deg=request.slope_angle_deg,
            elevation_m=request.elevation_m
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@app.post("/zones/{zone_id}/simulate", tags=["AI Engine & Simulation"])
def simulate_zone_readings(zone_id: int, request: SimulateRequest):
    """
    HACKATHON DEMO ENDPOINT:
    Pushes simulated rainfall and soil moisture into a zone, re-evaluates risk with SHAP,
    updates the zone in Supabase, logs to risk_history, and dispatches SMS if Critical (>80).
    """
    try:
        # 1. Fetch current zone terrain properties
        zone_res = supabase.table("zones").select("*").eq("id", zone_id).execute()
        if not zone_res.data:
            raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")
        
        zone = zone_res.data[0]

        # 2. Run prediction using the zone's fixed terrain slope & elevation
        prediction = predict_risk(
            rainfall_mm=request.rainfall_mm,
            soil_moisture_pct=request.soil_moisture_pct,
            slope_angle_deg=zone["slope_angle_deg"],
            elevation_m=zone["elevation_m"]
        )

        risk_score = prediction["risk_score"]
        risk_level = prediction["risk_level"]
        shap_breakdown = prediction["shap_breakdown"]
        now_iso = datetime.utcnow().isoformat()

        # 3. Update the zone in Supabase
        update_data = {
            "current_rainfall_mm": request.rainfall_mm,
            "current_soil_moisture_pct": request.soil_moisture_pct,
            "current_risk_score": risk_score,
            "risk_level": risk_level,
            "last_updated": now_iso
        }
        supabase.table("zones").update(update_data).eq("id", zone_id).execute()

        # 4. Insert new log in risk_history
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

        # 5. If Critical (>80), log alert and fire SMS dispatch
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
                "soil_moisture_pct": request.soil_moisture_pct
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
        res = supabase.table("hazard_reports").insert(report_data).execute()
        return {"success": True, "data": res.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")

@app.get("/hazard-reports", tags=["Offline Field Reports"])
def get_hazard_reports():
    """Retrieve all citizen and officer ground hazard reports."""
    try:
        res = supabase.table("hazard_reports").select("*").order("created_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/alerts", tags=["Alerts"])
def get_alerts():
    """Fetch the audit log of all emergency alerts dispatched."""
    try:
        res = supabase.table("alerts_log").select("*, zones(name)").order("sent_at", desc=True).execute()
        return res.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/alerts/send-test", tags=["Alerts"])
def send_test_alert(req: SendTestAlertRequest):
    """Test the SMS dissemination channel manually."""
    try:
        zone_name = "Upper Shillong Sector 4"
        if req.zone_id:
            z = supabase.table("zones").select("name").eq("id", req.zone_id).execute()
            if z.data:
                zone_name = z.data[0]["name"]

        dispatch = send_critical_sms_alert(
            zone_name=zone_name,
            risk_score=92,
            rainfall_mm=180.0,
            soil_moisture_pct=91.0,
            recipient=req.phone_number or "+91-XXXXXXXXXX"
        )

        alert_entry = {
            "zone_id": req.zone_id or 1,
            "risk_score": 92.0,
            "message": dispatch["message"],
            "channel": "SMS_TEST",
            "sent_at": datetime.utcnow().isoformat()
        }
        supabase.table("alerts_log").insert(alert_entry).execute()

        return {"success": True, "dispatch": dispatch}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dispatch test alert: {str(e)}")
