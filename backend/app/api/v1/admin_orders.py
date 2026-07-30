from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from typing import Optional, List
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from app.core.exceptions import AppError

router = APIRouter(dependencies=[Depends(require_admin)])


class StatusUpdate(BaseModel):
    status: str

class TrackingUpdate(BaseModel):
    tracking_number: str

class CallConfirmedUpdate(BaseModel):
    call_confirmed: bool


@router.get("/")
def list_orders(
    status: Optional[str] = Query(None),
    payment_method: Optional[str] = Query(None, alias="paymentMethod"),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100)
):
    supabase = get_supabase()

    query = supabase.table("orders") \
        .select("*, order_items(*, product_variants(size, color, sku, products(name, slug))), addresses(*), payment_transactions(status, razorpay_payment_id)", count="exact") \
        .order("created_at", desc=True)

    if status and status != "all":
        query = query.eq("status", status)
    if payment_method and payment_method != "all":
        query = query.eq("payment_method", payment_method)
        
    if search:
        # Assuming ID or phone can be searched via DB if possible, but PostgREST doesn't support easy OR across foreign tables
        # For a truly large DB, we'd use a dedicated RPC. For now, doing an ilike on id directly
        query = query.ilike("id", f"%{search}%")

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
            items.append({
                "id": oi["id"],
                "order_id": oi["order_id"],
                "product_id": variant.get("product_id", ""),
                "variant_id": oi["product_variant_id"],
                "product_name_snapshot": product.get("name", "Unknown"),
                "size": variant.get("size", ""),
                "color": variant.get("color", ""),
                "quantity": oi["quantity"],
                "price_at_purchase": float(oi["unit_price"]),
            })

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
                "fullName": addr.get("full_name", ""),
                "email": "",
                "phone": addr.get("phone", ""),
                "address": addr.get("address", ""),
                "city": addr.get("city", ""),
                "state": addr.get("state", ""),
                "zip": addr.get("zip", ""),
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


@router.patch("/{order_id}/status")
def update_order_status(order_id: str, body: StatusUpdate):
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


@router.patch("/{order_id}/tracking")
def update_tracking(order_id: str, body: TrackingUpdate):
    supabase = get_supabase()
    order_res = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)

    supabase.table("orders").update({"tracking_number": body.tracking_number}).eq("id", order_id).execute()
    return {"id": order_id, "tracking_number": body.tracking_number}


@router.patch("/{order_id}/call-confirmed")
def update_call_confirmed(order_id: str, body: CallConfirmedUpdate):
    supabase = get_supabase()
    order_res = supabase.table("orders").select("id").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)

    supabase.table("orders").update({"call_confirmed": body.call_confirmed}).eq("id", order_id).execute()
    return {"id": order_id, "call_confirmed": body.call_confirmed}
