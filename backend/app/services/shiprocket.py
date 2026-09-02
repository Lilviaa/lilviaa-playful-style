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

async def _request(method: str, endpoint: str, json_data: dict = None, params: dict = None) -> Dict[str, Any]:
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
        if params:
            request_params["params"] = params
            
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
                msg = err_json.get("message", "Unknown error")
                validation_errors = err_json.get("errors", {})
                if validation_errors:
                    error_details = f"{msg} Details: {validation_errors}"
                else:
                    error_details = msg or err_json
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

async def generate_awb(shipment_id) -> Dict[str, Any]:
    """
    Generates an AWB and assigns a courier for a given shipment_id.
    shipment_id can be int or BIGINT from Postgres.
    """
    return await _request("POST", "/courier/assign/awb", {"shipment_id": int(shipment_id)})

async def track_awb(awb_code: str) -> Dict[str, Any]:
    """
    Tracks a shipment by its AWB code.
    """
    return await _request("GET", f"/courier/track/awb/{awb_code}")

async def get_serviceability(pickup_pincode: str, delivery_pincode: str, weight: float, cod: int = 0) -> Dict[str, Any]:
    """
    Get available couriers for a given route and weight.
    Now uses _request() helper for automatic 401 token retry.
    """
    return await _request("GET", "/courier/serviceability/", params={
        "pickup_postcode": pickup_pincode,
        "delivery_postcode": delivery_pincode,
        "weight": weight,
        "cod": cod
    })


async def automate_shiprocket_fulfillment(order_id: str):
    """
    Background task: pushes an order to Shiprocket and generates an AWB.
    Shiprocket's dashboard Courier Priority rules select the best courier automatically.
    
    This function is called as a background task after payment confirmation.
    It must NEVER raise — all errors are caught and logged to the DB.
    """
    import asyncio
    await asyncio.sleep(3) # Wait for database transaction to fully settle
    
    from app.db.supabase import get_supabase
    import logging
    
    logger = logging.getLogger(__name__)
    supabase = get_supabase()
    
    try:
        # 1. Fetch order with items and address
        order_res = supabase.table("orders").select(
            "*, items:order_items(*, product_variants(*, products(*))), addresses(*), users(email)"
        ).eq("id", order_id).execute()
        
        if not order_res.data:
            logger.error(f"Order {order_id} not found for Shiprocket fulfillment.")
            return
            
        order = order_res.data[0]
        
        # Don't re-push if already pushed
        if order.get("shiprocket_order_id"):
            logger.info(f"Order {order_id} already pushed to Shiprocket.")
            return
            
        # 2. Build payload
        address = order.get("addresses") or order.get("shipping_address") or {}
        items = order.get("items") or []
        user = order.get("users") or {}
        
        order_items = []
        for item in items:
            product = item.get("product_variants", {}).get("products", {})
            variant = item.get("product_variants", {})
            name = product.get("name", "Product")
            if variant.get("size"):
                name += f" ({variant.get('size')})"
                
            # Shiprocket requires a non-empty SKU
            sku = variant.get("sku")
            if not sku:
                sku = f"SKU-{item.get('id', '0')[:8]}"
                
            order_items.append({
                "name": name[:50], # Shiprocket name limit
                "sku": sku[:50],
                "units": item.get("quantity", 1),
                "selling_price": str(item.get("unit_price", 0)),
                "discount": "0",
                "tax": "0",
                "hsn": ""
            })
            
        # Default weight: 0.5kg per item (kids clothing)
        total_weight = sum(0.5 * item.get("quantity", 1) for item in items)
        
        full_name = address.get("full_name") or "Customer"
        
        # Sanitize phone number (Shiprocket strictly expects exactly 10 digits)
        raw_phone = address.get("phone") or "9999999999"
        clean_phone = ''.join(filter(str.isdigit, str(raw_phone)))
        if len(clean_phone) >= 10:
            clean_phone = clean_phone[-10:]
        else:
            clean_phone = clean_phone.rjust(10, '0')
        
        order_payload = {
            "order_id": order.get("display_id") or order_id,
            "order_date": datetime.now().strftime("%Y-%m-%d %H:%M"),
            "pickup_location": "Home",
            "billing_customer_name": address.get("first_name") or full_name.split()[0],
            "billing_last_name": address.get("last_name") or (" ".join(full_name.split()[1:]) if len(full_name.split()) > 1 else ""),
            "billing_address": address.get("address_line1") or address.get("address") or "",
            "billing_address_2": address.get("address_line2") or "",
            "billing_city": address.get("city") or "",
            "billing_pincode": address.get("postal_code") or address.get("zip") or "",
            "billing_state": address.get("state", ""),
            "billing_country": address.get("country", "India"),
            "billing_email": address.get("email") or user.get("email") or getattr(order, "email", "customer@lilviaa.com"),
            "billing_phone": clean_phone,
            "shipping_is_billing": True,
            "order_items": order_items,
            "payment_method": "Prepaid" if order.get("payment_method") != "cod" else "COD",
            "sub_total": float(order.get("total_amount", 0)),
            "length": 10,
            "breadth": 10,
            "height": 10,
            "weight": total_weight
        }
        
        # 3. Push order to Shiprocket
        logger.info(f"Pushing order {order_id} to Shiprocket...")
        create_res = await create_custom_order(order_payload)
        
        shiprocket_order_id = create_res.get("order_id")
        shiprocket_shipment_id = create_res.get("shipment_id")
        
        if not shiprocket_shipment_id:
            error_msg = f"Shiprocket did not return a shipment ID: {create_res}"
            logger.error(error_msg)
            supabase.table("orders").update({
                "shiprocket_error": error_msg,
                "tracking_status": "PUSH_FAILED"
            }).eq("id", order_id).execute()
            return
            
        # Check if Shiprocket auto-assigned an AWB in the creation response
        auto_awb = create_res.get("awb_code")
        auto_courier = create_res.get("courier_name")
        
        if auto_awb:
            # Shiprocket already generated the AWB! Save it immediately.
            supabase.table("orders").update({
                "shiprocket_order_id": shiprocket_order_id,
                "shiprocket_shipment_id": shiprocket_shipment_id,
                "awb_code": auto_awb,
                "courier_name": auto_courier,
                "tracking_status": "AWB_GENERATED",
                "shiprocket_error": None
            }).eq("id", order_id).execute()
            logger.info(f"Order {order_id} auto-assigned AWB {auto_awb} by Shiprocket.")
            return

        # Update DB with Shiprocket IDs before attempting explicit AWB generation
        supabase.table("orders").update({
            "shiprocket_order_id": shiprocket_order_id,
            "shiprocket_shipment_id": shiprocket_shipment_id,
            "tracking_status": "PROCESSING",
            "shiprocket_error": None
        }).eq("id", order_id).execute()
        
        # 4. Auto-generate AWB (Shiprocket picks the courier based on dashboard rules)
        logger.info(f"Generating AWB for order {order_id}...")
        awb_res = await generate_awb(shiprocket_shipment_id)
        
        response_payload = awb_res.get("response", {})
        data_payload = response_payload.get("data", {})
        
        awb_code = data_payload.get("awb_code") or response_payload.get("awb_code") or awb_res.get("awb_code")
        courier_name = data_payload.get("courier_name") or response_payload.get("courier_name") or awb_res.get("courier_name")
        
        if awb_code:
            supabase.table("orders").update({
                "awb_code": awb_code,
                "courier_name": courier_name,
                "tracking_status": "AWB_GENERATED"
            }).eq("id", order_id).execute()
            logger.info(f"Order {order_id} → AWB: {awb_code}, Courier: {courier_name}")
        else:
            logger.warning(f"AWB generation returned no code for {order_id}: {awb_res}")
            error_details = awb_res.get("response", {}).get("data", {}).get("message") or str(awb_res)
            supabase.table("orders").update({
                "shiprocket_error": f"AWB Generation Failed: {error_details}",
                "tracking_status": "AWB_FAILED"
            }).eq("id", order_id).execute()
            
    except Exception as e:
        logger.error(f"Shiprocket fulfillment failed for {order_id}: {str(e)}")
        # Save error to DB so admin panel can display it
        try:
            supabase.table("orders").update({
                "shiprocket_error": str(e)
            }).eq("id", order_id).execute()
        except Exception:
            logger.error(f"Failed to save shiprocket_error for {order_id}")
