from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from app.models.order import OrderCreate, OrderResponse
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError
import uuid

router = APIRouter()

@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, request: Request):
    """Create a new order, validate stock, and deduct stock."""
    supabase = get_supabase()
    
    # 1. Check user auth
    user_id = None
    token = request.cookies.get("access_token")
    if token:
        try:
            fresh = get_fresh_supabase()
            user_response = fresh.auth.get_user(token)
            if user_response and user_response.user:
                user_id = user_response.user.id
        except Exception:
            pass

    # For now, require auth to create an address (as schema requires user_id).
    # If guest checkout is allowed in future, schema for addresses needs user_id nullable,
    # or we don't save address in addresses table. For MVP, we'll try to save if user exists.
    shipping_address_id = order.shipping_address_id
    if not shipping_address_id and user_id and order.full_name:
        try:
            addr_res = supabase.table("addresses").insert({
                "user_id": user_id,
                "full_name": order.full_name,
                "phone": order.phone,
                "address": order.address,
                "city": order.city,
                "state": order.state,
                "zip": order.zip,
                "is_default": False
            }).execute()
            if addr_res.data:
                shipping_address_id = addr_res.data[0]["id"]
        except Exception as e:
            print("Failed to save address:", e)

    # 2. Validate stock for all items
    variant_ids = [item.product_variant_id for item in order.items]
    if not variant_ids:
        raise AppError("Order must contain at least one item", status_code=400)
        
    variants_res = supabase.table("product_variants").select("id, stock").in_("id", variant_ids).execute()
    stock_map = {v["id"]: v["stock"] for v in variants_res.data}
    
    for item in order.items:
        available = stock_map.get(item.product_variant_id, 0)
        if item.quantity > available:
            raise AppError(f"Insufficient stock for one or more items. Only {available} left.", status_code=400)
            
    # 3. Create the Order
    order_data = {
        "user_id": user_id,
        "status": "pending",  # Payment not integrated yet
        "total_amount": order.total_amount,
        "shipping_amount": order.shipping_amount,
        "payment_method": order.payment_method,
        "shipping_address_id": shipping_address_id,
        "order_source": "online"
    }
    
    try:
        order_res = supabase.table("orders").insert(order_data).execute()
        created_order = order_res.data[0]
        order_id = created_order["id"]
    except Exception as e:
        raise AppError(f"Failed to create order: {str(e)}")
        
    # 4. Create Order Items & Deduct Stock
    order_items_data = []
    for item in order.items:
        total_price = item.quantity * item.unit_price
        order_items_data.append({
            "order_id": order_id,
            "product_variant_id": item.product_variant_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": total_price
        })
        
        # Deduct stock
        # In a highly concurrent env, this should be an RPC call to avoid race conditions.
        # But for MVP, simple update is fine.
        new_stock = stock_map[item.product_variant_id] - item.quantity
        supabase.table("product_variants").update({"stock": new_stock}).eq("id", item.product_variant_id).execute()
        
    try:
        items_res = supabase.table("order_items").insert(order_items_data).execute()
        created_order["items"] = items_res.data
    except Exception as e:
        # Rollback order if items fail
        supabase.table("orders").delete().eq("id", order_id).execute()
        raise AppError(f"Failed to create order items: {str(e)}")
        
    return created_order
