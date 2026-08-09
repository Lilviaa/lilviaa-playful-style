from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from typing import Optional, List
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter()


class StatusUpdate(BaseModel):
    status: str

class TrackingUpdate(BaseModel):
    tracking_number: str

class CallConfirmedUpdate(BaseModel):
    call_confirmed: bool


@router.get("", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_orders(
    request: Request,
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None, alias="paymentMethod"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    supabase = get_supabase()

    query = supabase.table("orders") \
        .select("*, order_items(*, product_variants(size, sku, products(name, slug, product_images(url)))), addresses(*), payment_transactions(status, razorpay_payment_id)", count="exact") \
        .order("created_at", desc=True)

    if status and status != "all":
        query = query.eq("status", status)
    if payment_method and payment_method != "all":
        query = query.eq("payment_method", payment_method)
        
    if search:
        import uuid
        is_uuid = False
        try:
            uuid.UUID(search)
            is_uuid = True
        except ValueError:
            pass
            
        if is_uuid:
            query = query.eq("id", search)
        elif search.upper().startswith("ORD-LV-") or search.isdigit():
            numeric_str = search.upper().replace("ORD-LV-", "") if search.upper().startswith("ORD-LV-") else search
            try:
                hex_prefix = format(int(numeric_str), 'x').zfill(6)
                all_ids_res = supabase.table("orders").select("id").execute()
                matching_ids = [row["id"] for row in all_ids_res.data if row["id"].startswith(hex_prefix)]
                if matching_ids:
                    query = query.in_("id", matching_ids)
                else:
                    # If no order ID matches this number, fallback to searching by phone/name
                    query = query.or_(f"shipping_address->>full_name.ilike.%{search}%,shipping_address->>phone.ilike.%{search}%")
            except ValueError:
                query = query.or_(f"shipping_address->>full_name.ilike.%{search}%,shipping_address->>phone.ilike.%{search}%")
        else:
            # Search by customer name or phone instead of ID
            query = query.or_(f"shipping_address->>full_name.ilike.%{search}%,shipping_address->>phone.ilike.%{search}%")

    start_idx = (page - 1) * limit
    end_idx = start_idx + limit - 1
    
    query = query.range(start_idx, end_idx)

    res = query.execute()
    orders = res.data or []
    total_count = res.count or 0

    # Transform to match frontend Order interface
    result = []
    for o in orders:
        addr = o.get("addresses") or {}
        items_raw = o.get("order_items") or []
        txns = o.get("payment_transactions") or []

        # Determine payment status from transactions
        payment_status = "pending"
        for tx in txns:
            if tx.get("status") == "successful":
                payment_status = "paid"
                break
            elif tx.get("status") == "failed":
                payment_status = "failed"

        # Build items
        items = []
        for oi in items_raw:
            variant = oi.get("product_variants") or {}
            product = variant.get("products") or {}
            images = product.get("product_images") or []
            image_url = images[0].get("url") if images and isinstance(images, list) and len(images) > 0 else ""
            
            items.append({
                "id": oi["id"],
                "order_id": oi["order_id"],
                "product_id": variant.get("product_id", ""),
                "variant_id": oi["product_variant_id"],
                "product_name_snapshot": product.get("name", "Unknown"),
                "product_image_snapshot": image_url,
                "size": variant.get("size", ""),
                "sku": variant.get("sku", ""),
                "quantity": oi["quantity"],
                "price_at_purchase": float(oi["unit_price"]),
            })

        addr_snap = o.get("shipping_address") or {}
        
        order_obj = {
            "id": o["id"],
            "customer_id": o.get("user_id"),
            "status": o["status"],
            "payment_method": o["payment_method"],
            "payment_status": payment_status,
            "subtotal": float(o["total_amount"]) - float(o.get("shipping_amount", 0)) + float(o.get("discount_amount", 0)),
            "discount": float(o.get("discount_amount", 0)),
            "shipping_fee": float(o.get("shipping_amount", 0)),
            "total": float(o["total_amount"]),
            "shipping_address": {
                "fullName": addr_snap.get("full_name") or addr.get("full_name", ""),
                "email": addr_snap.get("email") or "",
                "phone": addr_snap.get("phone") or addr.get("phone", ""),
                "address": addr_snap.get("address") or addr.get("address", ""),
                "city": addr_snap.get("city") or addr.get("city", ""),
                "state": addr_snap.get("state") or addr.get("state", ""),
                "zip": addr_snap.get("zip") or addr.get("zip", ""),
            },
            "tracking_number": o.get("tracking_number"),
            "call_confirmed": o.get("call_confirmed", False),
            "created_at": o["created_at"],
            "items": items,
        }

        result.append(order_obj)

    return {
        "orders": result,
        "total": total_count,
        "page": page,
        "limit": limit
    }


@router.patch("/{order_id}/status", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_order_status(order_id: str, body: StatusUpdate, request: Request):
    supabase = get_supabase()

    # Verify order exists
    order_res = supabase.table("orders").select("id, status, payment_method, call_confirmed").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)

    order = order_res.data[0]

    # COD orders must be call-confirmed before packing
    if body.status == "packed" and order["payment_method"] == "cod" and not order.get("call_confirmed", False):
        raise AppError("COD orders require call confirmation before packing.", status_code=400)

    supabase.table("orders").update({"status": body.status}).eq("id", order_id).execute()
    return {"id": order_id, "status": body.status}


@router.patch("/{order_id}/tracking", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_tracking(order_id: str, body: TrackingUpdate, request: Request):
    supabase = get_supabase()
    order_res = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)

    supabase.table("orders").update({"tracking_number": body.tracking_number}).eq("id", order_id).execute()
    return {"id": order_id, "tracking_number": body.tracking_number}


@router.patch("/{order_id}/call-confirmed", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_call_confirmed(order_id: str, body: CallConfirmedUpdate, request: Request):
    supabase = get_supabase()
    order_res = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)

    supabase.table("orders").update({"call_confirmed": body.call_confirmed}).eq("id", order_id).execute()
    return {"id": order_id, "call_confirmed": body.call_confirmed}


# ---------------------------------------------------------------------------
# Shiprocket Integration Endpoints
# ---------------------------------------------------------------------------

@router.post("/{order_id}/push-shiprocket", dependencies=[Depends(PreAuthRateLimit("20/minute")), Depends(require_admin)])
@limiter.limit("20/minute", key_func=get_admin_id)
async def push_order_to_shiprocket(order_id: str, request: Request):
    """Manually push an order to Shiprocket to create a custom adhoc order."""
    from app.services.shiprocket import create_custom_order
    supabase = get_supabase()
    
    # 1. Fetch Order Details
    order_res = supabase.table("orders").select(
        "*, order_items(*, product_variants(sku, products(name)))", 
        "addresses(*)"
    ).eq("id", order_id).execute()
    
    if not order_res.data:
        raise AppError("Order not found", 404)
        
    order = order_res.data[0]
    
    if order.get("shiprocket_order_id"):
        raise AppError("Order has already been pushed to Shiprocket", 400)
        
    address = order.get("addresses")
    if not address:
        # Fallback to embedded shipping address (for guests)
        address = order.get("shipping_address")
        if not address:
            raise AppError("Order is missing shipping address", 400)
            
    # 2. Build Shiprocket Payload
    items = []
    for item in order.get("order_items", []):
        variant = item.get("product_variants", {})
        product = variant.get("products", {})
        items.append({
            "name": product.get("name", "Product"),
            "sku": variant.get("sku", f"SKU-{item['product_variant_id']}"),
            "units": item["quantity"],
            "selling_price": float(item["unit_price"]),
            "discount": 0,
            "tax": 0,
            "hsn": ""
        })
        
    # Split name into first/last name
    full_name = address.get("full_name", "Customer")
    name_parts = full_name.split(" ", 1)
    first_name = name_parts[0] or "Customer"
    last_name = name_parts[1] if len(name_parts) > 1 and name_parts[1].strip() else "Lilviaa"
        
    addr_text = address.get("address", "No Address")
    city = address.get("city", "City")
    pincode = address.get("zip", "000000")
    state = address.get("state", "State")
    phone = address.get("phone", "0000000000")
    email = address.get("email") or "customer@lilviaa.com"
        
    payload = {
        "order_id": order_id,
        "order_date": order["created_at"],
        "billing_customer_name": first_name,
        "billing_last_name": last_name,
        "billing_address": addr_text,
        "billing_city": city,
        "billing_pincode": pincode,
        "billing_state": state,
        "billing_country": "India",
        "billing_email": email,
        "billing_phone": phone,
        "shipping_is_billing": True,
        "shipping_customer_name": first_name,
        "shipping_last_name": last_name,
        "shipping_address": addr_text,
        "shipping_city": city,
        "shipping_pincode": pincode,
        "shipping_state": state,
        "shipping_country": "India",
        "shipping_email": email,
        "shipping_phone": phone,
        "order_items": items,
        "payment_method": "Prepaid" if order.get("payment_method") != "cod" else "COD",
        "sub_total": float(order["total_amount"]),
        "length": 10,  # Default box dimensions
        "breadth": 10,
        "height": 5,
        "weight": 0.5  # Default 0.5 KG
    }
    
    # 3. Call Shiprocket API
    res_data = await create_custom_order(payload)
    
    # 4. Save Shiprocket IDs to Database
    sr_order_id = res_data.get("order_id")
    sr_shipment_id = res_data.get("shipment_id")
    
    if not sr_order_id or not sr_shipment_id:
        raise AppError("Invalid response from Shiprocket. Missing order_id or shipment_id.", 500)
        
    supabase.table("orders").update({
        "shiprocket_order_id": sr_order_id,
        "shiprocket_shipment_id": sr_shipment_id,
        "tracking_status": "NEW"
    }).eq("id", order_id).execute()
    
    return {"message": "Order pushed successfully", "shiprocket_order_id": sr_order_id}


@router.post("/{order_id}/generate-awb", dependencies=[Depends(PreAuthRateLimit("20/minute")), Depends(require_admin)])
@limiter.limit("20/minute", key_func=get_admin_id)
async def generate_order_awb(order_id: str, request: Request):
    """Manually generate AWB/assign courier for an order pushed to Shiprocket."""
    from app.services.shiprocket import generate_awb
    supabase = get_supabase()
    
    order_res = supabase.table("orders").select("shiprocket_shipment_id, awb_code").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", 404)
        
    order = order_res.data[0]
    shipment_id = order.get("shiprocket_shipment_id")
    
    if not shipment_id:
        raise AppError("Order has not been pushed to Shiprocket yet.", 400)
    if order.get("awb_code"):
        raise AppError("AWB already generated for this order.", 400)
        
    res_data = await generate_awb(shipment_id)
    
    response_payload = res_data.get("response", {})
    data_payload = response_payload.get("data", {})
    awb_code = data_payload.get("awb_code") or response_payload.get("awb_code") or res_data.get("awb_code")
    courier_name = data_payload.get("courier_name") or response_payload.get("courier_name") or res_data.get("courier_name")
    
    if not awb_code:
        raise AppError(f"Shiprocket did not return AWB. Full response: {res_data}", 500)
        
    # Update DB
    supabase.table("orders").update({
        "awb_code": awb_code,
        "courier_name": courier_name,
        "tracking_status": "AWB_GENERATED"
    }).eq("id", order_id).execute()
    
    return {"message": "AWB generated successfully", "awb_code": awb_code, "courier": courier_name}


@router.post("/{order_id}/refresh-tracking", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
async def refresh_tracking_status(order_id: str, request: Request):
    """Fetches latest tracking from Shiprocket based on TTL."""
    from app.services.shiprocket import track_awb
    from datetime import datetime, timezone, timedelta
    
    supabase = get_supabase()
    order_res = supabase.table("orders").select("awb_code, tracking_last_updated, tracking_status, tracking_history").eq("id", order_id).execute()
    
    if not order_res.data:
        raise AppError("Order not found", 404)
        
    order = order_res.data[0]
    awb = order.get("awb_code")
    
    if not awb:
        raise AppError("No AWB code generated for this order yet.", 400)
        
    # TTL Check: 1 hour
    last_updated = order.get("tracking_last_updated")
    if last_updated:
        # Assuming last_updated is ISO format
        try:
            last_dt = datetime.fromisoformat(last_updated.replace("Z", "+00:00"))
            if datetime.now(timezone.utc) < last_dt + timedelta(hours=1):
                return {
                    "message": "Tracking returned from cache", 
                    "status": order.get("tracking_status"), 
                    "history": order.get("tracking_history")
                }
        except:
            pass
            
    # Fetch Live
    res_data = await track_awb(awb)
    
    # Process tracking response
    tracking_data = res_data.get("tracking_data", {})
    if not tracking_data:
        # Handle cases where Shiprocket returns tracking differently
        tracking_data = res_data.get(awb, {}).get("tracking_data", {})
        
    status = tracking_data.get("shipment_status") or tracking_data.get("track_status", "UNKNOWN")
    history = tracking_data.get("shipment_track_activities") or tracking_data.get("shipment_track") or []
    
    now = datetime.now(timezone.utc).isoformat()
    
    supabase.table("orders").update({
        "tracking_status": status,
        "tracking_history": history,
        "tracking_last_updated": now
    }).eq("id", order_id).execute()
    
    return {"message": "Tracking updated from Shiprocket", "status": status, "history": history}
