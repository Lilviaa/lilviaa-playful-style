from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks, Response
from app.api.dependencies import get_current_user_token
from typing import List, Dict, Any
from app.models.order import OrderCreate, OrderResponse
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_user_id
from app.services.mailer import send_customer_order_confirmation, send_owner_order_notification
from app.services.whatsapp import (
    send_customer_order_confirmation as wa_send_customer_confirmation,
    send_owner_order_alert as wa_send_owner_alert,
)
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

def enqueue_notifications(background_tasks, created_order):
    """Send both email and WhatsApp notifications as background tasks."""
    # Email notifications
    background_tasks.add_task(send_customer_order_confirmation, created_order)
    background_tasks.add_task(send_owner_order_notification, created_order)
    # WhatsApp notifications
    background_tasks.add_task(wa_send_customer_confirmation, created_order)
    background_tasks.add_task(wa_send_owner_alert, created_order)

@router.post("", status_code=status.HTTP_201_CREATED, dependencies=[Depends(PreAuthRateLimit("10/minute"))])
@limiter.limit("5/minute", key_func=get_user_id)
def create_order(order: OrderCreate, request: Request, background_tasks: BackgroundTasks):
    """Create a new order, validate stock, and deduct stock atomically."""
    supabase = get_supabase()
    
    # 1. Check user auth gracefully
    user_id = None
    user_email = None
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            import firebase_admin.auth as firebase_auth
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email', '')
            user_data = supabase.table("users").select("id").eq("email", email).execute()
            if user_data.data:
                user_id = user_data.data[0]["id"]
                user_email = email
        except Exception:
            pass
    elif request.cookies.get("access_token"):
        token = request.cookies.get("access_token")
        try:
            fresh = get_fresh_supabase()
            user_response = fresh.auth.get_user(token)
            if user_response and user_response.user:
                user_id = str(user_response.user.id)
                user_email = user_response.user.email
        except Exception:
            pass

    # 2. Shipping Address Logic
    shipping_address_id = order.shipping_address_id
    if not shipping_address_id and user_id and order.full_name:
        try:
            # Check if an identical address already exists
            existing_addrs = supabase.table("addresses").select("id, is_default").eq("user_id", user_id)\
                .eq("full_name", order.full_name)\
                .eq("phone", order.phone)\
                .eq("address", order.address)\
                .eq("city", order.city)\
                .eq("state", order.state)\
                .eq("zip", order.zip).execute()
            
            if existing_addrs.data:
                shipping_address_id = existing_addrs.data[0]["id"]
                if order.save_as_default and not existing_addrs.data[0].get("is_default"):
                    supabase.table("addresses").update({"is_default": False}).eq("user_id", user_id).execute()
                    supabase.table("addresses").update({"is_default": True}).eq("id", shipping_address_id).execute()
            else:
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
        
    variants_res = supabase.table("product_variants").select("id, stock, reserved_stock, price_override, products(id, category_id, base_price, sale_price, sale_start, sale_end)").in_("id", variant_ids).execute()
    variant_map = {v["id"]: v for v in variants_res.data}
    
    now = datetime.now(timezone.utc)
    calculated_subtotal = 0.0
    enriched_items = []

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
        item_total = true_unit_price * item.quantity
        calculated_subtotal += item_total
        
        enriched_items.append({
            "product_id": prod.get("id"),
            "category_id": prod.get("category_id"),
            "total_price": item_total
        })
        
    coupon_id = None
    discount_amount = 0.0

    if order.coupon_code:
        validation = _validate_coupon_logic(order.coupon_code, calculated_subtotal, user_id, supabase, enriched_items)
        if not validation.get("valid"):
            raise AppError(validation.get("message", "Invalid coupon"), status_code=400)
        
        discount_amount = validation.get("discountAmount", 0)
        coupon_id = validation.get("coupon_id")
        
    # Fetch Company Settings
    settings_res = supabase.table("company_settings").select("*").limit(1).execute()
    settings = settings_res.data[0] if settings_res.data else {}
    
    enable_gst = settings.get("enable_gst", False)
    gst_percentage = float(settings.get("gst_percentage") or 0.0)
    home_state = settings.get("home_state", "Tamil Nadu")
    shipping_charge_home = float(settings.get("shipping_charge_home") or 0.0)
    shipping_charge_other = float(settings.get("shipping_charge_other") or 0.0)
    enable_free_shipping = settings.get("enable_free_shipping", False)
    free_shipping_above = float(settings.get("free_shipping_above") or 0.0)

    taxable_amount = max(0.0, calculated_subtotal - discount_amount)
    
    coupon_free_shipping = False
    if order.coupon_code and 'validation' in locals() and validation.get("freeShipping"):
        coupon_free_shipping = True

    if coupon_free_shipping or (enable_free_shipping and calculated_subtotal >= free_shipping_above):
        shipping_amount = 0.0
    else:
        cust_state = (order.state or "").strip().lower()
        if cust_state == home_state.strip().lower():
            shipping_amount = shipping_charge_home
        else:
            shipping_amount = shipping_charge_other

    if enable_gst:
        gst_amount = (taxable_amount * gst_percentage) / 100.0
    else:
        gst_amount = 0.0
        gst_percentage = 0.0
        
    # Round to nearest integer to match UI display (which drops decimals) and prevent paise-level floating point drift
    calculated_total = round(taxable_amount + shipping_amount + gst_amount)

    shipping_snapshot = {
        "full_name": order.full_name or "",
        "phone": order.phone or "",
        "address": order.address or "",
        "city": order.city or "",
        "state": order.state or "",
        "zip": order.zip or ""
    }

    # 4. Create the Order and reserve/deduct stock atomically via RPC
    rpc_args = {
        "p_user_id": user_id,
        "p_status": "pending",
        "p_total_amount": float(calculated_total),
        "p_subtotal": float(calculated_subtotal),
        "p_taxable_amount": float(taxable_amount),
        "p_gst_percentage": float(gst_percentage),
        "p_gst_amount": float(gst_amount),
        "p_shipping_amount": float(shipping_amount),
        "p_payment_method": order.payment_method,
        "p_shipping_address_id": shipping_address_id,
        "p_shipping_address": shipping_snapshot,
        "p_coupon_id": coupon_id,
        "p_coupon_code": order.coupon_code,
        "p_discount_amount": float(discount_amount),
        "p_items": [{
            "product_variant_id": item.product_variant_id,
            "quantity": item.quantity,
            "unit_price": float(item.unit_price),
            "total_price": float(item.quantity * item.unit_price)
        } for item in order.items]
    }

    try:
        rpc_res = supabase.rpc("create_online_order", rpc_args).execute()
        order_id = rpc_res.data["id"]
    except Exception as e:
        error_msg = str(e)
        if "Insufficient stock" in error_msg:
            raise AppError("One or more items in your cart just went out of stock.", status_code=400)
        raise AppError(f"Failed to create order: {error_msg}")

    # 5. Fetch the newly created order for the response and email
    try:
        order_res = supabase.table("orders").select("*, items:order_items(*)").eq("id", order_id).execute()
        created_order = order_res.data[0]
        order_items_data = created_order.get("items", [])
    except Exception as e:
        raise AppError(f"Order created but failed to fetch details: {str(e)}")

    # For COD, order is considered confirmed immediately. Send emails in the background.
    if order.payment_method == "cod":
        enqueue_notifications(background_tasks, created_order)

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

@router.post("/verify-payment", dependencies=[Depends(PreAuthRateLimit("10/minute"))])
@limiter.limit("5/minute", key_func=get_user_id)
def verify_payment(req: VerifyPaymentRequest, request: Request, background_tasks: BackgroundTasks):
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

    # 2. Fetch actual payment method from Razorpay BEFORE the RPC
    # (important for localhost testing where webhooks don't arrive)
    captured_method = None
    try:
        payment = rzp.payment.fetch(req.razorpay_payment_id)
        captured_method = payment.get("method")
    except Exception:
        pass

    # 3. Atomically confirm the payment via a single DB transaction (RPC).
    #    This handles: row-locking (race condition prevention), idempotency
    #    guard, transaction status update, order status update, and stock
    #    deduction — all in one atomic Postgres transaction.
    #    On failure it writes to payment_audit_log and re-raises.
    try:
        rpc_res = supabase.rpc("confirm_razorpay_payment", {
            "p_razorpay_order_id": req.razorpay_order_id,
            "p_razorpay_payment_id": req.razorpay_payment_id,
        }).execute()
    except Exception as e:
        raise AppError(f"Payment confirmation failed: {str(e)}", status_code=500)

    rpc_data = rpc_res.data
    if not rpc_data or not rpc_data.get("success"):
        raise AppError("Payment confirmation returned unexpected result", status_code=500)

    # Idempotent hit — already confirmed, no emails/fulfillment needed again
    if rpc_data.get("idempotent"):
        return {"success": True, "message": "Already verified"}

    order_id = rpc_data["order_id"]

    # 4. Update the payment_method on the order if we fetched it from Razorpay
    #    (the RPC only sets status, not payment_method, since that requires the
    #    live Razorpay API call that happens in Python)
    if captured_method:
        supabase.table("orders").update({
            "payment_method": captured_method
        }).eq("id", order_id).execute()

    # 5. Fire post-confirmation side effects (emails + Shiprocket)
    full_order_res = supabase.table("orders").select(
        "*, items:order_items(*, product_variants(*, products(*))), addresses(*)"
    ).eq("id", order_id).execute()
    if full_order_res.data:
        created_order = full_order_res.data[0]
        if created_order.get("user_id"):
            user_res = supabase.table("users").select("email").eq("id", created_order["user_id"]).execute()
            if user_res.data and user_res.data[0].get("email"):
                created_order["user_email"] = user_res.data[0]["email"]

        enqueue_notifications(background_tasks, created_order)

    try:
        from app.services.shiprocket import automate_shiprocket_fulfillment
        background_tasks.add_task(automate_shiprocket_fulfillment, order_id)
    except ImportError:
        import logging
        logging.getLogger(__name__).warning(f"automate_shiprocket_fulfillment not found in shiprocket.py. Skipping automation for order {order_id}")
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"Failed to enqueue Shiprocket automation for {order_id}: {str(e)}")

    return {"success": True}

@router.post("/{order_id}/retry-payment", dependencies=[Depends(PreAuthRateLimit("10/minute"))])
@limiter.limit("5/minute", key_func=get_user_id)
def retry_payment(order_id: str, request: Request, user: dict = Depends(get_current_user_token)):
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
    items: List[Dict[str, Any]] | None = None


@router.get("/me", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def get_my_orders(response: Response, request: Request, user: dict = Depends(get_current_user_token)):
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

@router.get("/{order_id}", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def get_order_by_id(order_id: str, request: Request, user: dict = Depends(get_current_user_token)):
    supabase = get_supabase()
    
    # Check if admin/owner or the owner of the order
    role = user.get("user_metadata", {}).get("role", "customer")
    
    res = supabase.table("orders") \
        .select("*, addresses(*), payment_transactions(*), order_items(*, product_variants(*, products(*)))") \
        .eq("id", order_id) \
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=404, detail="Order not found")
        
    order = res.data[0]
    
    # Non-admins can only see their own orders
    if role == "customer" and order.get("user_id") != user.get("sub"):
        raise HTTPException(status_code=403, detail="Not authorized to view this order")
        
    # Also fetch the user profile manually since it joins on user_id, not directly linked from order
    if order.get("user_id"):
        prof_res = supabase.table("user_profiles").select("*").eq("user_id", order.get("user_id")).execute()
        if prof_res.data:
            order["user_profile"] = prof_res.data[0]
            
    return order

def _validate_coupon_logic(code: str, cart_total: float, user_id: str | None, supabase, enriched_items: list[dict] = None) -> dict:
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

    # Check min cart value against the FULL cart total
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

    # Calculate scoped subtotal
    scope = coupon.get("scope", "store_wide")
    scope_ids = coupon.get("scope_ids") or []
    
    if scope == "store_wide":
        scoped_subtotal = cart_total
    else:
        scoped_subtotal = 0.0
        if enriched_items:
            for item in enriched_items:
                if scope == "product" and item.get("product_id") in scope_ids:
                    scoped_subtotal += item.get("total_price", 0)
                elif scope == "category" and item.get("category_id") in scope_ids:
                    scoped_subtotal += item.get("total_price", 0)
        
        if scoped_subtotal == 0:
            return {"valid": False, "discountAmount": 0, "freeShipping": False, "message": "This coupon doesn't apply to any items in your cart."}

    # Calculate discount
    discount_amount = 0.0
    free_shipping = False

    if coupon["type"] == "flat":
        discount_amount = min(float(coupon["value"]), scoped_subtotal)
    elif coupon["type"] == "percent":
        discount_amount = (scoped_subtotal * float(coupon["value"])) / 100
        if coupon["max_discount_cap"] is not None and float(coupon["max_discount_cap"]) > 0:
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


@router.post("/validate-coupon", dependencies=[Depends(PreAuthRateLimit("10/minute"))])
@limiter.limit("5/minute", key_func=get_user_id)
def validate_coupon(req: ValidateCouponRequest, request: Request):
    """Validate a coupon code and return the discount amount."""
    supabase = get_supabase()
    
    enriched_items = []
    calculated_subtotal = 0.0
    now = datetime.now(timezone.utc)

    if req.items:
        variant_ids = [it.get("product_variant_id") for it in req.items if it.get("product_variant_id")]
        if variant_ids:
            variants_res = supabase.table("product_variants").select("*, products(*)").in_("id", variant_ids).execute()
            variant_map = {v["id"]: v for v in variants_res.data}
            
            for it in req.items:
                vid = it.get("product_variant_id")
                qty = float(it.get("quantity") or 1)
                
                v_data = variant_map.get(vid)
                if not v_data:
                    continue
                
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
                
                if price_override is not None:
                    if is_sale_active and base_price > 0:
                        discount_multiplier = float(sale_price) / base_price
                        true_unit_price = int(float(price_override) * discount_multiplier)
                    else:
                        true_unit_price = float(price_override)
                else:
                    true_unit_price = float(sale_price) if is_sale_active else base_price

                item_total = true_unit_price * qty
                calculated_subtotal += item_total
                
                enriched_items.append({
                    "product_id": prod.get("id"),
                    "category_id": prod.get("category_id"),
                    "total_price": item_total
                })
                
    # Use calculated_subtotal if we parsed items, else fallback to req.cart_total
    final_cart_total = calculated_subtotal if req.items else req.cart_total
    return _validate_coupon_logic(req.code, final_cart_total, req.user_id, supabase, enriched_items)


@router.post("/{order_id}/refresh-tracking", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("10/minute", key_func=get_user_id)
async def refresh_tracking_status_customer(order_id: str, request: Request, background_tasks: BackgroundTasks, user: dict = Depends(get_current_user_token)):
    """Fetches latest tracking from Shiprocket for a customer's order based on TTL."""
    from app.services.shiprocket import track_awb
    from datetime import datetime, timezone, timedelta
    
    supabase = get_supabase()
    user_id = user["sub"]
    order_res = supabase.table("orders").select("user_id, awb_code, tracking_last_updated, tracking_status, tracking_history").eq("id", order_id).execute()
    
    if not order_res.data:
        raise AppError("Order not found", 404)
        
    order = order_res.data[0]
    
    if order.get("user_id") != user_id:
        raise AppError("Unauthorized", 403)
        
    awb = order.get("awb_code")
    if not awb:
        raise AppError("No tracking available for this order yet.", 400)
        
    # TTL Check: 1 hour
    last_updated = order.get("tracking_last_updated")
    if last_updated:
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
        tracking_data = res_data.get(awb, {}).get("tracking_data", {})
        
    status = tracking_data.get("shipment_status") or tracking_data.get("track_status", "UNKNOWN")
    history = tracking_data.get("shipment_track_activities") or tracking_data.get("shipment_track") or []
    
    now = datetime.now(timezone.utc).isoformat()
    
    old_status = order.get("tracking_status")
    
    if status != old_status:
        status_upper = status.upper()
        if status_upper in ["SHIPPED", "OUT FOR DELIVERY"]:
            etd = tracking_data.get("etd", "")
            if etd:
                try:
                    dt = datetime.fromisoformat(etd.replace("Z", "+00:00"))
                    etd = dt.strftime("%A, %d %B %Y")
                except Exception:
                    pass
            from app.services.whatsapp import send_order_status_update
            full_order_res = supabase.table("orders").select("*, addresses(*)").eq("id", order_id).execute()
            if full_order_res.data:
                background_tasks.add_task(send_order_status_update, full_order_res.data[0], status, etd)
                
        elif status_upper == "DELIVERED":
            from app.services.whatsapp import send_order_delivered
            full_order_res = supabase.table("orders").select("*, addresses(*)").eq("id", order_id).execute()
            if full_order_res.data:
                background_tasks.add_task(send_order_delivered, full_order_res.data[0])
    
    supabase.table("orders").update({
        "tracking_status": status,
        "tracking_history": history,
        "tracking_last_updated": now
    }).eq("id", order_id).execute()
    
    return {"message": "Tracking updated from Shiprocket", "status": status, "history": history}
