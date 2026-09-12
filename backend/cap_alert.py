import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone
import uuid

def format_as_cap_alert(
    zone: dict,
    risk_score: float,
    message: str,
    alert_id: int = None,
    sent_at: str = None
) -> str:
    """
    Converts a GiriRakshak landslide alert into an OASIS CAP v1.2 (Common Alerting Protocol)
    compliant XML message for upstream ingestion by NDMA's SACHET platform.
    
    CAP v1.2 / ITU-T X.1303 is the official open standard mandated by NDMA for all national
    and state disaster management agencies in India.
    """
    now = datetime.now(timezone.utc)
    if sent_at:
        try:
            sent_dt = datetime.fromisoformat(sent_at.replace('Z', '+00:00'))
        except Exception:
            sent_dt = now
    else:
        sent_dt = now

    sent_iso = sent_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")
    expires_dt = sent_dt + timedelta(hours=6)
    expires_iso = expires_dt.strftime("%Y-%m-%dT%H:%M:%S+05:30")

    zone_id = zone.get("id", 1)
    zone_name = zone.get("name", "North Eastern Highway Corridor")
    lat = float(zone.get("lat", 25.85))
    lon = float(zone.get("lon", 92.35))
    
    unique_id = alert_id if alert_id else str(uuid.uuid4())[:8]
    identifier = f"IN-NDMA-GIRIRAKSHAK-{sent_dt.strftime('%Y%m%d')}-{zone_id:02d}-{unique_id}"

    # Determine CAP Urgency, Severity, Certainty based on GiriRakshak Risk Score
    if risk_score >= 80:
        urgency = "Immediate"
        severity = "Extreme"
        certainty = "Observed"
        headline = f"CRITICAL LANDSLIDE EMERGENCY: Immediate Evacuation & Traffic Diversion on {zone_name}"
    elif risk_score >= 60:
        urgency = "Expected"
        severity = "Severe"
        certainty = "Likely"
        headline = f"HIGH LANDSLIDE THREAT: Traffic Slowdown and Vigilance Advised on {zone_name}"
    else:
        urgency = "Future"
        severity = "Moderate"
        certainty = "Possible"
        headline = f"MODERATE LANDSLIDE WATCH: Precautionary Monitoring Active on {zone_name}"

    # Build XML structure
    root = ET.Element("alert", xmlns="urn:oasis:names:tc:emergency:cap:1.2")
    
    ET.SubElement(root, "identifier").text = identifier
    ET.SubElement(root, "sender").text = "girirakshak-ner@ndma.gov.in"
    ET.SubElement(root, "sent").text = sent_iso
    ET.SubElement(root, "status").text = "Actual"
    ET.SubElement(root, "msgType").text = "Alert"
    ET.SubElement(root, "source").text = "GiriRakshak AI Landslide Early Warning Engine (North Eastern Region)"
    ET.SubElement(root, "scope").text = "Public"
    ET.SubElement(root, "code").text = "IPAWS-CAP-1.2"
    ET.SubElement(root, "code").text = "NDMA-SACHET-INTEGRATED"

    # Info block
    info = ET.SubElement(root, "info")
    ET.SubElement(info, "language").text = "en-IN"
    ET.SubElement(info, "category").text = "Geo"
    ET.SubElement(info, "event").text = "Landslide / Slope Failure Threat"
    
    # Standard Emergency Response Code
    response_type = ET.SubElement(info, "responseType")
    response_type.text = "Evacuate" if risk_score >= 80 else "Prepare"

    ET.SubElement(info, "urgency").text = urgency
    ET.SubElement(info, "severity").text = severity
    ET.SubElement(info, "certainty").text = certainty

    event_code = ET.SubElement(info, "eventCode")
    ET.SubElement(event_code, "valueName").text = "SAME"
    ET.SubElement(event_code, "value").text = "LSW"  # Landslide Warning

    ET.SubElement(info, "expires").text = expires_iso
    ET.SubElement(info, "senderName").text = "GiriRakshak Automated Warning Center (SDMA/NDMA Node)"
    ET.SubElement(info, "headline").text = headline
    ET.SubElement(info, "description").text = message
    
    ET.SubElement(info, "instruction").text = (
        "Immediate Action Required: (1) Divert heavy commercial vehicles to designated bypasses. "
        "(2) Clear roadside culverts of debris. (3) Evacuate all temporary hillside dwelling settlements "
        "within a 500m radius of the unstable slope cut."
    )
    
    ET.SubElement(info, "web").text = "https://giri-rakshak-rho.vercel.app/"
    ET.SubElement(info, "contact").text = "Assam State Disaster Management Authority (ASDMA): 1070 / NDMA: 1078"

    # Parameters for SACHET System Ingestion
    param_sachet = ET.SubElement(info, "parameter")
    ET.SubElement(param_sachet, "valueName").text = "PlatformIntegration"
    ET.SubElement(param_sachet, "value").text = "NDMA SACHET National Disaster Alerting Portal"

    param_score = ET.SubElement(info, "parameter")
    ET.SubElement(param_score, "valueName").text = "GiriRakshakRiskScore"
    ET.SubElement(param_score, "value").text = f"{risk_score}/100"

    param_corridor = ET.SubElement(info, "parameter")
    ET.SubElement(param_corridor, "valueName").text = "HighwayCorridor"
    ET.SubElement(param_corridor, "value").text = "NH-6 / Old NH-44 and NH-37 Corridors (Assam-Meghalaya)"

    # Area definition with geographic coordinates
    area = ET.SubElement(info, "area")
    ET.SubElement(area, "areaDesc").text = f"{zone_name}, NH-44 / NH-37 Highway Sector, North East India"
    
    # 2.5 km impact radius circle around centerpoint (lat,lon,radius_km)
    ET.SubElement(area, "circle").text = f"{lat:.4f},{lon:.4f},2.5"

    # Convert to XML string with pretty indentation
    ET.indent(root, space="  ", level=0)
    xml_str = ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
    return xml_str

if __name__ == "__main__":
    sample_zone = {
        "id": 5,
        "name": "Sonapur Tunnel Approach (NH-6)",
        "lat": 25.1158,
        "lon": 92.3685
    }
    sample_xml = format_as_cap_alert(
        zone=sample_zone,
        risk_score=94.0,
        message="Critical Landslide Hazard detected. Heavy continuous 72h rainfall has saturated slope substrata.",
        alert_id=12
    )
    print(sample_xml)
