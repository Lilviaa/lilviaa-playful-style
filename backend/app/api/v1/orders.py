from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from app.api.dependencies import get_current_user_token
from typing import List, Dict, Any
from app.models.order import OrderCreate, OrderResponse
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError
from app.core.email import send_order_confirmation_email
import uuid
import os
import razorpay
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

router = APIRouter()

def get_razorpay_client():
    import os
    key_id = os.environ.get("RAZORPAY_KEY_ID")
    key_secret = os.environ.get("RAZORPAY_KEY_SECRET")
    
    # Check if they are still placeholders
    if not key_id or key_id == "your_razorpay_key_id":
        return None
    if not key_secret or key_secret == "your_razorpay_key_secret":
        return None
        
    return razorpay.Client(auth=(key_id, key_secret))

class VerifyPaymentRequest(BaseModel):
    order_id: str
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_order(order: OrderCreate, request: Request, background_tasks: BackgroundTasks):
    """Create a new order, validate stock, and deduct stock."""
    supabase = get_supabase()
    
    # 1. Check user auth
    user_id = None
    user_email = None
    token = request.cookies.get("access_token")
    if token:
        try:
            fresh = get_fresh_supabase()
            user_response = fresh.auth.get_user(token)
            if user_response and user_response.user:
                user_id = user_response.user.id
                user_email = user_response.user.email
        except Exception:
            pass

    # 2. Shipping Address Logic
    shipping_address_id = order.shipping_address_id
    if not shipping_address_id and user_id and order.full_name:
        try:
            if order.save_as_default:
                supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
                
            addr_res = supabase.table("addresses").insert({
                "user_id": user_id,
                "full_name": order.full_name,
                "phone": order.phone,
                "address": order.address,
                "city": order.city,
                "state": order.state,
                "zip": order.zip,
                "is_default": order.save_as_default
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
        
    coupon_id = None
    discount_amount = 0.0

    if order.coupon_code:
        validation = _validate_coupon_logic(order.coupon_code, calculated_subtotal, user_id, supabase)
        if not validation.get("valid"):
            raise AppError(validation.get("message", "Invalid coupon"), status_code=400)
        
        discount_amount = validation.get("discountAmount", 0)
        coupon_id = validation.get("coupon_id")
        
        shipping_amount = 0 if validation.get("freeShipping") else (0 if calculated_subtotal >= 3000 else 79)
    else:
        shipping_amount = 0 if calculated_subtotal >= 3000 else 79

    calculated_total = calculated_subtotal + shipping_amount - discount_amount
    calculated_total = max(0.0, calculated_total)

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
        "order_source": "online",
        "coupon_id": coupon_id,
        "discount_amount": discount_amount,
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
        
        if coupon_id:
            supabase.table("coupon_usages").insert({
                "coupon_id": coupon_id,
                "user_id": user_id,
                "order_id": order_id,
                "discount_applied": discount_amount
            }).execute()
            
    except Exception as e:
        supabase.table("orders").delete().eq("id", order_id).execute()
        raise AppError(f"Failed to create order items: {str(e)}")

    if is_cod:
        if user_email:
            background_tasks.add_task(send_order_confirmation_email, user_email, created_order, order_items_data)
        return created_order

    # 6. Razorpay Flow
    rzp = get_razorpay_client()
    if not rzp:
        raise AppError("Razorpay is not configured on the server.", status_code=500)

    amount_in_paise = int(calculated_total * 100)
    
    # Receipt max length is 40 chars in Razorpay
    short_order_id = str(order_id).replace("-", "")[:30]
    
    rzp_order_data = {
        "amount": amount_in_paise,
        "currency": "INR",
        "receipt": f"rcpt_{short_order_id}",
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
        "key_id": os.environ.get("RAZORPAY_KEY_ID")
    }

@router.post("/verify-payment")
def verify_payment(req: VerifyPaymentRequest, background_tasks: BackgroundTasks):
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

    # Get user email
    user_email = None
    order_res = supabase.table("orders").select("user_id, total_amount").eq("id", order_id).execute()
    if order_res.data and order_res.data[0].get("user_id"):
        u_id = order_res.data[0]["user_id"]
        user_res = supabase.table("users").select("email").eq("id", u_id).execute()
        if user_res.data:
            user_email = user_res.data[0]["email"]
        
        # Send email
        if user_email:
            items_res2 = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
            background_tasks.add_task(send_order_confirmation_email, user_email, {"id": order_id, "total_amount": order_res.data[0]["total_amount"]}, items_res2.data)

    return {"success": True}

@router.post("/{order_id}/retry-payment")
def retry_payment(order_id: str, user: dict = Depends(get_current_user_token)):
    supabase = get_supabase()
    user_id = user["sub"]

    # 1. Fetch order and verify ownership/state
    order_res = supabase.table("orders").select("*, order_items(*)").eq("id", order_id).execute()
    if not order_res.data:
        raise AppError("Order not found", status_code=404)
    
    order = order_res.data[0]
    if order["user_id"] != user_id:
        raise AppError("Forbidden", status_code=403)
        
    if order["status"] not in ["pending", "cancelled"]:
        raise AppError(f"Cannot retry payment for order in '{order['status']}' state.", status_code=400)
        
    if order["payment_method"] != "razorpay":
        raise AppError("Retry is only applicable for Razorpay orders", status_code=400)

    # 2. Rate limiting check (max 5 retries)
    # We count how many failed/pending transactions exist for this order_id
    tx_count_res = supabase.table("payment_transactions").select("id", count="exact").eq("order_id", order_id).execute()
    if (tx_count_res.count or 0) >= 5:
        raise AppError("Maximum retry limit exceeded for this order. Please create a new order.", status_code=429)

    # 3. Check stock availability for all items and re-reserve
    items = order["order_items"]
    now = datetime.now(timezone.utc)
    hold_expiry = now + timedelta(minutes=15)
    
    # We must do this carefully. Since they could be out of stock, check all first.
    variant_updates = []
    for item in items:
        var_id = item["product_variant_id"]
        qty = item["quantity"]
        v_res = supabase.table("product_variants").select("stock, reserved_stock, products(name)").eq("id", var_id).execute()
        if not v_res.data:
            raise AppError("A product in this order no longer exists", status_code=400)
            
        variant = v_res.data[0]
        available = variant["stock"] - variant.get("reserved_stock", 0)
        pname = variant.get("products", {}).get("name", "Item")
        
        # If the order was cancelled, the webhook already released the stock.
        # If the order is pending but expired, the CRON releases the stock.
        # So we just check if current available stock >= qty.
        if available < qty:
            raise AppError(f"Sorry, '{pname}' is no longer available in the requested quantity.", status_code=400)
            
        variant_updates.append({
            "id": var_id,
            "new_reserved": variant.get("reserved_stock", 0) + qty
        })

    # Apply reservations
    for update in variant_updates:
        supabase.table("product_variants").update({
            "reserved_stock": update["new_reserved"],
            "reservation_expires_at": hold_expiry.isoformat()
        }).eq("id", update["id"]).execute()

    # 4. Create new Razorpay order
    rzp_client = get_razorpay_client()
    if not rzp_client:
        # Revert reservations if Razorpay is unconfigured
        for update in variant_updates:
            v_res = supabase.table("product_variants").select("reserved_stock").eq("id", update["id"]).execute()
            if v_res.data:
                supabase.table("product_variants").update({
                    "reserved_stock": max(0, v_res.data[0].get("reserved_stock", 0) - item["quantity"])
                }).eq("id", update["id"]).execute()
        raise AppError("Razorpay is not configured", status_code=500)

    amount_paise = int(float(order["total_amount"]) * 100)
    rzp_order = rzp_client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "receipt": f"retry_{order_id[:8]}"
    })
    new_rzp_order_id = rzp_order["id"]

    # 5. Save new transaction row
    supabase.table("payment_transactions").insert({
        "order_id": order_id,
        "razorpay_order_id": new_rzp_order_id,
        "status": "pending",
        "amount": float(order["total_amount"])
    }).execute()
    
    # 6. Revert order status to pending if it was cancelled
    if order["status"] == "cancelled":
        supabase.table("orders").update({"status": "pending"}).eq("id", order_id).execute()

    return {
        "id": order_id,
        "razorpay_order_id": new_rzp_order_id,
        "amount": amount_paise,
        "currency": "INR",
        "key_id": os.environ.get("RAZORPAY_KEY_ID")
    }


class ValidateCouponRequest(BaseModel):
    code: str
    cart_total: float
    user_id: str | None = None

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response

@router.get("/me")
def get_my_orders(response: Response, user: dict = Depends(get_current_user_token)):
    # Prevent browser caching of order history across users
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    
    supabase = get_supabase()
    user_id = user["sub"]
    
    res = supabase.table("orders") \
        .select("*, order_items(*, product_variants(*, products(*)))") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .execute()
        
    return res.data

def _validate_coupon_logic(code: str, cart_total: float, user_id: str | None, supabase) -> dict:
    # Find coupon by code
    coupon_res = supabase.table("coupons") \
        .select("*") \
        .eq("code", code.upper().strip()) \
        .execute()

    if not coupon_res.data:
        return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "Coupon not found."}

    coupon = coupon_res.data[0]

    # Check active
    if not coupon["active"]:
        return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "This coupon is not active."}

    # Check dates
    now = datetime.now(timezone.utc)
    start = datetime.fromisoformat(coupon["start_date"].replace("Z", "+00:00"))
    end = datetime.fromisoformat(coupon["end_date"].replace("Z", "+00:00"))

    if now > end:
        return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "This coupon has expired."}
    if now < start:
        return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "This coupon is not yet valid."}

    # Check min cart value
    if cart_total < float(coupon["min_cart_value"]):
        return {
            "valid": False, "discountAmount": 0, "freeShipping": False,
            "message": f"Minimum cart value of ₹{int(coupon['min_cart_value'])} required."
        }

    # Check total usage limit
    if coupon["usage_limit_total"] is not None:
        usage_count_res = supabase.table("coupon_usages") \
            .select("id", count="exact") \
            .eq("coupon_id", coupon["id"]) \
            .execute()
        if (usage_count_res.count or 0) >= coupon["usage_limit_total"]:
            return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "This coupon has reached its usage limit."}

    # Check per-customer usage limit
    if coupon["usage_limit_per_customer"] is not None and user_id:
        user_usage_res = supabase.table("coupon_usages") \
            .select("id", count="exact") \
            .eq("coupon_id", coupon["id"]) \
            .eq("user_id", user_id) \
            .execute()
        if (user_usage_res.count or 0) >= coupon["usage_limit_per_customer"]:
            return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "You have already used this coupon the maximum number of times."}

    # Calculate discount
    discount_amount = 0.0
    free_shipping = False

    if coupon["type"] == "flat":
        discount_amount = min(float(coupon["value"]), cart_total)
    elif coupon["type"] == "percent":
        discount_amount = (cart_total * float(coupon["value"])) / 100
        if coupon["max_discount_cap"] is not None:
            discount_amount = min(discount_amount, float(coupon["max_discount_cap"]))
    elif coupon["type"] == "free_shipping":
        free_shipping = True
        discount_amount = 0

    discount_amount = round(discount_amount)

    msg = f"Coupon applied! You saved ₹{discount_amount}" if discount_amount > 0 else "Coupon applied!"
    if free_shipping:
        msg += " + free shipping"

    return {
        "valid": True,
        "discountAmount": discount_amount,
        "freeShipping": free_shipping,
        "message": msg,
        "coupon_id": coupon["id"],
    }


@router.post("/validate-coupon")
def validate_coupon(req: ValidateCouponRequest):
    """Validate a coupon code and return the discount amount."""
    supabase = get_supabase()
    return _validate_coupon_logic(req.code, req.cart_total, req.user_id, supabase)
