from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List, Dict, Any
from app.models.order import OrderCreate, OrderResponse
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError
import uuid
import os
import razorpay
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

router = APIRouter()

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")

def get_razorpay_client():
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return None
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/", status_code=status.HTTP_201_CREATED)
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

    # 2. Shipping Address Logic
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

    # 3. Validate stock & Recalculate Prices
    variant_ids = [item.product_variant_id for item in order.items]
    if not variant_ids:
        raise AppError("Order must contain at least one item", status_code=400)
        
    variants_res = supabase.table("product_variants").select("id, stock, reserved_stock, price_override, products(base_price, sale_price, sale_start, sale_end)").in_("id", variant_ids).execute()
    variant_map = {v["id"]: v for v in variants_res.data}
    
    now = datetime.now(timezone.utc)
    calculated_subtotal = 0.0

    for item in order.items:
        v_data = variant_map.get(item.product_variant_id)
        if not v_data:
            raise AppError(f"Variant {item.product_variant_id} not found", status_code=400)
        
        # Calculate available stock
        available = v_data["stock"] - v_data.get("reserved_stock", 0)
        if item.quantity > available:
            raise AppError(f"Insufficient stock. Only {available} left.", status_code=400)

        # Calculate Price
        prod = v_data.get("products", {})
        base_price = float(prod.get("base_price") or 0)
        sale_price = prod.get("sale_price")
        
        is_sale_active = False
        if sale_price is not None and float(sale_price) > 0:
            is_sale_active = True
            sale_start_str = prod.get("sale_start")
            sale_end_str = prod.get("sale_end")
            if sale_start_str:
                sale_start = datetime.fromisoformat(sale_start_str.replace("Z", "+00:00"))
                if now < sale_start:
                    is_sale_active = False
            if sale_end_str:
                sale_end = datetime.fromisoformat(sale_end_str.replace("Z", "+00:00"))
                if now > sale_end:
                    is_sale_active = False
        
        price_override = v_data.get("price_override")
        
        # Recalculate true unit price based on variant override and sale multiplier
        if price_override is not None:
            if is_sale_active and base_price > 0:
                discount_multiplier = float(sale_price) / base_price
                true_unit_price = int(float(price_override) * discount_multiplier)
            else:
                true_unit_price = float(price_override)
        else:
            true_unit_price = float(sale_price) if is_sale_active else base_price

        item.unit_price = true_unit_price
        calculated_subtotal += (true_unit_price * item.quantity)
        
    shipping_amount = 0 if calculated_subtotal >= 999 else 79
    calculated_total = calculated_subtotal + shipping_amount

    if abs(calculated_total - order.total_amount) > 1.0:
        raise AppError(f"Price mismatch: Server calculated ₹{calculated_total}, but frontend sent ₹{order.total_amount}. Please refresh the cart.", status_code=400)
            
    is_cod = (order.payment_method == "cod")

    # 4. Create the Order
    order_data = {
        "user_id": user_id,
        "status": "processing" if is_cod else "pending", 
        "total_amount": calculated_total,
        "shipping_amount": shipping_amount,
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
        
    # 5. Create Order Items & Manage Stock
    order_items_data = []
    reserved_until = (now + timedelta(minutes=15)).isoformat()

    for item in order.items:
        total_price = item.quantity * item.unit_price
        order_items_data.append({
            "order_id": order_id,
            "product_variant_id": item.product_variant_id,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_price": total_price
        })
        
        v_data = variant_map[item.product_variant_id]
        if is_cod:
            new_stock = v_data["stock"] - item.quantity
            supabase.table("product_variants").update({"stock": new_stock}).eq("id", item.product_variant_id).execute()
        else:
            new_reserved = v_data.get("reserved_stock", 0) + item.quantity
            supabase.table("product_variants").update({
                "reserved_stock": new_reserved,
                "reserved_until": reserved_until
            }).eq("id", item.product_variant_id).execute()
        
    try:
        items_res = supabase.table("order_items").insert(order_items_data).execute()
        created_order["items"] = items_res.data
    except Exception as e:
        supabase.table("orders").delete().eq("id", order_id).execute()
        raise AppError(f"Failed to create order items: {str(e)}")

    if is_cod:
        return created_order

    # 6. Razorpay Flow
    rzp = get_razorpay_client()
    if not rzp:
        raise AppError("Razorpay is not configured on the server.", status_code=500)

    amount_in_paise = int(calculated_total * 100)
    rzp_order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"receipt_{order_id}",
        "notes": {
            "order_id": str(order_id)
        }
    }
    try:
        rzp_order = rzp.order.create(data=rzp_order_data)
        razorpay_order_id = rzp_order.get("id")
    except Exception as e:
        supabase.table("orders").delete().eq("id", order_id).execute()
        raise AppError(f"Failed to create Razorpay order: {str(e)}", status_code=500)

    # Log payment transaction
    supabase.table("payment_transactions").insert({
        "order_id": order_id,
        "razorpay_order_id": razorpay_order_id,
        "status": "pending",
        "amount": calculated_total
    }).execute()

    return {
        **created_order,
        "razorpay_order_id": razorpay_order_id,
        "amount": amount_in_paise,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID
    }

@router.post("/verify-payment")
def verify_payment(req: VerifyPaymentRequest):
    """Verify Razorpay signature and confirm order."""
    rzp = get_razorpay_client()
    if not rzp:
        raise AppError("Razorpay not configured")
    
    supabase = get_supabase()

    # 1. Verify signature
    try:
        rzp.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
    except Exception as e:
        raise AppError("Payment verification failed", status_code=400)

    # 2. Get Transaction
    tx_res = supabase.table("payment_transactions").select("*").eq("razorpay_order_id", req.razorpay_order_id).execute()
    if not tx_res.data:
        raise AppError("Transaction not found", status_code=404)
    tx = tx_res.data[0]

    if tx["status"] == "successful":
        return {"success": True, "message": "Already verified"}

    # 3. Update Transaction
    supabase.table("payment_transactions").update({
        "status": "successful",
        "razorpay_payment_id": req.razorpay_payment_id
    }).eq("id", tx["id"]).execute()

    # 4. Update Order
    order_id = tx["order_id"]
    supabase.table("orders").update({"status": "processing"}).eq("id", order_id).execute()

    # 5. Convert reserved stock to deducted stock
    items_res = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    for item in items_res.data:
        var_id = item["product_variant_id"]
        qty = item["quantity"]
        
        v_res = supabase.table("product_variants").select("stock, reserved_stock").eq("id", var_id).execute()
        if v_res.data:
            current_stock = v_res.data[0]["stock"]
            current_reserved = v_res.data[0].get("reserved_stock", 0)
            
            supabase.table("product_variants").update({
                "stock": max(0, current_stock - qty),
                "reserved_stock": max(0, current_reserved - qty)
            }).eq("id", var_id).execute()

    return {"success": True}
