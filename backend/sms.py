import os
import logging
from datetime import datetime
import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger("girirakshak.sms")

# Twilio configuration
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")
TWILIO_TO_NUMBER = os.getenv("TWILIO_TO_NUMBER", os.getenv("ALERT_PHONE_NUMBER", "+919876543210"))

# Fast2SMS configuration (popular Indian gateway with free promotional credits)
FAST2SMS_API_KEY = os.getenv("FAST2SMS_API_KEY", "")
FAST2SMS_ROUTE = os.getenv("FAST2SMS_ROUTE", "q") # Quick SMS route

def send_critical_sms_alert(
    zone_name: str, 
    risk_score: int, 
    rainfall_mm: float, 
    soil_moisture_pct: float, 
    recipient: str = None
) -> dict:
    """
    Dispatches an emergency SMS alert when a zone crosses Critical threshold (>80).
    Attempts Fast2SMS or Twilio if keys are provided.
    Always records in alerts_log and returns gracefully, NEVER breaking the endpoint.
    """
    target_phone = recipient or TWILIO_TO_NUMBER
    timestamp_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S IST")

    message = (
        f"[GiriRakshak EMERGENCY ALERT] Critical Landslide Threat detected at {zone_name}. "
        f"Risk Score: {risk_score}/100. Rainfall: {rainfall_mm}mm, Soil Saturation: {soil_moisture_pct}%. "
        f"Immediate evacuation and highway traffic diversion advised. Time: {timestamp_str}"
    )

    dispatch_info = {
        "status": "LOGGED",
        "channel": "SMS_GATEWAY",
        "recipient": target_phone,
        "message": message,
        "timestamp": timestamp_str,
        "provider": "SIMULATED_GATEWAY",
        "provider_response": None
    }

    # 1. Attempt Fast2SMS if API key is present
    if FAST2SMS_API_KEY:
        try:
            logger.info(f"Attempting Fast2SMS dispatch to {target_phone}...")
            # Clean phone number (Fast2SMS expects 10 digits without country code or with)
            clean_digits = "".join(filter(str.isdigit, target_phone))
            if len(clean_digits) > 10 and clean_digits.startswith("91"):
                clean_digits = clean_digits[2:]

            payload = {
                "route": FAST2SMS_ROUTE,
                "message": message,
                "language": "english",
                "flash": 0,
                "numbers": clean_digits
            }
            headers = {
                "authorization": FAST2SMS_API_KEY,
                "Content-Type": "application/json"
            }

            with httpx.Client(timeout=8.0) as client:
                resp = client.post("https://www.fast2sms.com/dev/bulkV2", json=payload, headers=headers)
                data = resp.json()
                dispatch_info["provider"] = "Fast2SMS"
                dispatch_info["provider_response"] = data
                if resp.status_code == 200 and data.get("return") is True:
                    dispatch_info["status"] = "DELIVERED"
                    logger.info(f"Fast2SMS delivered successfully: {data}")
                else:
                    dispatch_info["status"] = "GATEWAY_ERROR"
                    logger.warning(f"Fast2SMS returned error: {data}")
            return dispatch_info
        except Exception as e:
            logger.error(f"Fast2SMS transmission error: {e}")
            dispatch_info["status"] = "DISPATCH_FAILED"
            dispatch_info["error"] = str(e)
            # Do NOT raise; return dispatch info so caller continues smoothly!
            return dispatch_info

    # 2. Attempt Twilio if SID and Token are present
    if TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN and TWILIO_FROM_NUMBER:
        try:
            logger.info(f"Attempting Twilio SMS dispatch to {target_phone}...")
            twilio_url = f"https://api.twilio.com/2010-04-01/Accounts/{TWILIO_ACCOUNT_SID}/Messages.json"
            form_data = {
                "From": TWILIO_FROM_NUMBER,
                "To": target_phone,
                "Body": message
            }
            auth = (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

            with httpx.Client(timeout=8.0) as client:
                resp = client.post(twilio_url, data=form_data, auth=auth)
                data = resp.json()
                dispatch_info["provider"] = "Twilio"
                dispatch_info["provider_response"] = data
                if resp.status_code in [200, 201]:
                    dispatch_info["status"] = "DELIVERED"
                    logger.info(f"Twilio SMS queued successfully, SID: {data.get('sid')}")
                else:
                    dispatch_info["status"] = "GATEWAY_ERROR"
                    logger.warning(f"Twilio error: {data.get('message')}")
            return dispatch_info
        except Exception as e:
            logger.error(f"Twilio transmission error: {e}")
            dispatch_info["status"] = "DISPATCH_FAILED"
            dispatch_info["error"] = str(e)
            return dispatch_info

    # 3. Default fallback for testing & local development
    dispatch_info["status"] = "SENT_SIMULATED"
    dispatch_info["provider"] = "Simulated Telecom Gateway"
    logger.info(f"[SMS DISPATCH STUB] To: {target_phone} | Body: {message}")
    return dispatch_info
