from fastapi import APIRouter, Request, Header, HTTPException, Depends, BackgroundTasks
import os
import hmac
import hashlib
import json
import logging
from app.db.supabase import get_supabase
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit
from app.api.v1.orders import enqueue_notifications

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/razorpay", dependencies=[Depends(PreAuthRateLimit("200/minute"))])
@limiter.limit("200/minute")
async def razorpay_webhook(
    request: Request, 
    background_tasks: BackgroundTasks, 
    x_razorpay_signature: str = Header(None)
):
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET")

    if not webhook_secret or webhook_secret == "your_razorpay_webhook_secret":
        logger.error("Razorpay webhook received but secret is not configured in ENV.")
        raise HTTPException(status_code=500, detail="Webhook secret not configured")
        
    if not x_razorpay_signature:
        raise HTTPException(status_code=400, detail="Missing signature")

    payload = await request.body()
    
    # Verify signature
    try:
        generated_signature = hmac.new(
            webhook_secret.encode('utf-8'),
            payload,
            hashlib.sha256
        ).hexdigest()
    except Exception as e:
        logger.error(f"Failed to generate HMAC signature: {str(e)}")
        raise HTTPException(status_code=500, detail="Signature generation failed")

    if generated_signature != x_razorpay_signature:
        logger.warning("Razorpay webhook signature mismatch.")
        raise HTTPException(status_code=400, detail="Invalid signature")

    try:
        data = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON payload")

    event = data.get("event")
    if not event:
        return {"status": "ignored", "reason": "No event type specified"}

    supabase = get_supabase()

    if event == "payment.captured" or event == "order.paid":
        payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        razorpay_payment_id = payment_entity.get("id")
        captured_method = payment_entity.get("method")

        if not razorpay_order_id or not razorpay_payment_id:
            logger.warning(f"Webhook {event} missing order_id or payment_id")
            return {"status": "ignored", "reason": "Missing identifiers in payload"}

        # Use our atomic Postgres RPC to confirm the payment safely
        try:
            rpc_res = supabase.rpc("confirm_razorpay_payment", {
                "p_razorpay_order_id": razorpay_order_id,
                "p_razorpay_payment_id": razorpay_payment_id,
            }).execute()
        except Exception as e:
            logger.error(f"Webhook payment confirmation RPC failed: {str(e)}")
            raise HTTPException(status_code=500, detail="RPC failed")

        rpc_data = rpc_res.data
        if not rpc_data or not rpc_data.get("success"):
            logger.error("Webhook payment confirmation RPC returned failure.")
            raise HTTPException(status_code=500, detail="Confirmation failed")

        # Idempotent hit — already confirmed by frontend, no side-effects needed again
        if rpc_data.get("idempotent"):
            return {"status": "already_processed", "message": "Already verified"}

        order_id = rpc_data.get("order_id")

        if captured_method:
            supabase.table("orders").update({
                "payment_method": captured_method
            }).eq("id", order_id).execute()

        # Fire post-confirmation side effects (emails + Shiprocket)
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
        except Exception as e:
            logger.error(f"Failed to enqueue Shiprocket automation for {order_id} in webhook: {str(e)}")

        return {"status": "ok", "message": "Payment confirmed via webhook"}

    elif event == "payment.failed":
        # We do NOT cancel the order here because the user might just retry paying from the same modal!
        # If they fully abandon the page, the 15-minute cron job will cancel the order safely.
        # All we do is log the failed attempt into the payment_transactions table for auditing.
        payment_entity = data.get("payload", {}).get("payment", {}).get("entity", {})
        razorpay_order_id = payment_entity.get("order_id")
        error_desc = payment_entity.get("error_description", "Payment failed")

        if razorpay_order_id:
            logger.info(f"Received payment.failed for {razorpay_order_id}. Error: {error_desc}")
            tx_res = supabase.table("payment_transactions").select("id").eq("razorpay_order_id", razorpay_order_id).eq("status", "pending").execute()
            if tx_res.data:
                # Log the failure reason onto the transaction row without killing the whole order
                supabase.table("payment_transactions").update({
                    "error_details": error_desc
                }).eq("id", tx_res.data[0]["id"]).execute()
                
        return {"status": "ok", "message": "Failed attempt logged"}

    return {"status": "ignored", "reason": "Event type not handled"}
