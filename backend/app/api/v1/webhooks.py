from fastapi import APIRouter, Request, Header, HTTPException
import os
import hmac
import hashlib
import json
from app.db.supabase import get_supabase
from app.core.exceptions import AppError

router = APIRouter()

RAZORPAY_WEBHOOK_SECRET = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

@router.post("/razorpay")
async def razorpay_webhook(request: Request, x_razorpay_signature: str = Header(None)):
    if not RAZORPAY_WEBHOOK_SECRET:
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload = await request.body()
    
    # Verify signature
    generated_signature = hmac.new(
        RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
        payload,
        hashlib.sha256
    ).hexdigest()

    if generated_signature != x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        data = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = data.get("event")
    if not event:
        return {"status": "ignored"}

    supabase = get_supabase()

    if event == "payment.captured":
        payment_entity = data["payload"]["payment"]["entity"]
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")

        if not razorpay_order_id:
            return {"status": "ignored", "reason": "No order_id in payment.captured payload"}

        # Get transaction
        tx_res = supabase.table("payment_transactions").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
        if not tx_res.data:
            return {"status": "ignored", "reason": "Transaction not found"}
        tx = tx_res.data[0]

        if tx["status"] == "successful":
            return {"status": "already_processed"}

        # Update transaction
        supabase.table("payment_transactions").update({
            "status": "successful",
            "razorpay_payment_id": razorpay_payment_id
        }).eq("id", tx["id"]).execute()

        order_id = tx["order_id"]
        # Convert reservation to actual deduction
        # First check order status to avoid double processing
        order_res = supabase.table("orders").select("status").eq("id", order_id).execute()
        if order_res.data and order_res.data[0]["status"] == "pending":
            supabase.table("orders").update({"status": "processing"}).eq("id", order_id).execute()
            
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

    elif event == "payment.failed":
        payment_entity = data["payload"]["payment"]["entity"]
        razorpay_order_id = payment_entity.get("order_id")
        
        if razorpay_order_id:
            tx_res = supabase.table("payment_transactions").select("*").eq("razorpay_order_id", razorpay_order_id).execute()
            if tx_res.data:
                tx = tx_res.data[0]
                if tx["status"] == "pending":
                    supabase.table("payment_transactions").update({
                        "status": "failed",
                        "error_details": payment_entity.get("error_description", "Payment failed")
                    }).eq("id", tx["id"]).execute()
                    
                    order_id = tx["order_id"]
                    order_res = supabase.table("orders").select("status").eq("id", order_id).execute()
                    if order_res.data and order_res.data[0]["status"] == "pending":
                        supabase.table("orders").update({"status": "cancelled"}).eq("id", order_id).execute()
                        
                        # Release reserved stock
                        items_res = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
                        for item in items_res.data:
                            var_id = item["product_variant_id"]
                            qty = item["quantity"]
                            v_res = supabase.table("product_variants").select("reserved_stock").eq("id", var_id).execute()
                            if v_res.data:
                                current_reserved = v_res.data[0].get("reserved_stock", 0)
                                supabase.table("product_variants").update({
                                    "reserved_stock": max(0, current_reserved - qty)
                                }).eq("id", var_id).execute()

    return {"status": "ok"}
