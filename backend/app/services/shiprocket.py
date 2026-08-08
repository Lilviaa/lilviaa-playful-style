import os
import httpx
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.core.exceptions import AppError

SHIPROCKET_API_BASE = "https://apiv2.shiprocket.in/v1/external"

# In-memory cache for the token
_cached_token = None
_token_expiry = None

async def _get_token() -> str:
    """Fetches a new Shiprocket JWT token or returns the cached one."""
    global _cached_token, _token_expiry
    
    # Return cached token if valid
    if _cached_token and _token_expiry and datetime.now() < _token_expiry:
        return _cached_token

    email = os.environ.get("SHIPROCKET_API_EMAIL")
    password = os.environ.get("SHIPROCKET_API_PASSWORD")
    
    if not email or not password or password == "YOUR_PASSWORD_HERE":
        raise AppError("Shiprocket API credentials not configured", 500)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SHIPROCKET_API_BASE}/auth/login",
                json={"email": email, "password": password}
            )
            response.raise_for_status()
            data = response.json()
            
            _cached_token = data.get("token")
            # Shiprocket token is valid for 10 days, we'll cache for 9 days to be safe
            _token_expiry = datetime.now() + timedelta(days=9)
            return _cached_token
        except httpx.HTTPStatusError as e:
            raise AppError(f"Shiprocket Authentication Failed: {e.response.text}", 401)
        except Exception as e:
            raise AppError(f"Shiprocket Connection Error: {str(e)}", 500)

async def _request(method: str, endpoint: str, json_data: dict = None) -> Dict[str, Any]:
    """Helper to make authenticated requests to Shiprocket API with auto-retry on 401."""
    token = await _get_token()
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    
    async with httpx.AsyncClient() as client:
        request_params = {
            "method": method,
            "url": f"{SHIPROCKET_API_BASE}{endpoint}",
            "headers": headers
        }
        if json_data:
            request_params["json"] = json_data
            
        try:
            response = await client.request(**request_params)
            
            # If token expired, clear cache and retry once
            if response.status_code == 401:
                global _cached_token, _token_expiry
                _cached_token = None
                _token_expiry = None
                token = await _get_token()
                request_params["headers"]["Authorization"] = f"Bearer {token}"
                response = await client.request(**request_params)
            
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            error_details = e.response.text
            try:
                err_json = e.response.json()
                error_details = err_json.get("message") or err_json
            except:
                pass
            raise AppError(f"Shiprocket API Error: {error_details}", 400)
        except Exception as e:
            raise AppError(f"Shiprocket Connection Error: {str(e)}", 500)

async def create_custom_order(order_payload: dict) -> Dict[str, Any]:
    """
    Creates a custom (adhoc) order in Shiprocket.
    Requires order_id, address, and items in the payload.
    """
    return await _request("POST", "/orders/create/adhoc", order_payload)

async def generate_awb(shipment_id: int) -> Dict[str, Any]:
    """
    Generates an AWB and assigns a courier for a given shipment_id.
    """
    return await _request("POST", "/courier/assign/awb", {"shipment_id": shipment_id})

async def track_awb(awb_code: str) -> Dict[str, Any]:
    """
    Tracks a shipment by its AWB code.
    """
    return await _request("GET", f"/courier/track/awb/{awb_code}")
