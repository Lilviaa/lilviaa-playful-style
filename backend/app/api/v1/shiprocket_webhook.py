import os
import logging
from fastapi import APIRouter, Request, Response, BackgroundTasks
from app.db.supabase import get_supabase
from app.services.whatsapp import send_order_status_update, send_order_delivered

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/webhook")
async def shiprocket_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receive webhook events from Shiprocket for tracking status updates.
    Expects x-api-key header matching SHIPROCKET_WEBHOOK_SECRET.
    """
    secret = os.environ.get("SHIPROCKET_WEBHOOK_SECRET")
    
    # Optional Auth Check (Only if secret is configured in env)
    if secret:
        api_key = request.headers.get("x-api-key")
        if api_key != secret:
            logger.warning("Shiprocket webhook auth failed")
            return Response(status_code=401)
            
    try:
        payload = await request.json()
        logger.info(f"Shiprocket webhook received: {payload}")
    except Exception as e:
        logger.error(f"Shiprocket webhook non-JSON body: {str(e)}")
        return Response(status_code=400)
        
    awb = payload.get("awb")
    current_status = payload.get("current_status")
    
    if not awb or not current_status:
        # Some webhooks might be for other events (like return/RTO), ignore if missing AWB/status
        return Response(status_code=200)
        
    supabase = get_supabase()
    
    # Fetch the order by AWB
    order_res = supabase.table("orders").select("*").eq("awb_code", awb).execute()
    if not order_res.data:
        logger.warning(f"Shiprocket webhook AWB {awb} not found in DB")
        return Response(status_code=200)
        
    order = order_res.data[0]
    old_status = order.get("tracking_status")
    
    # If the status is actually changing to a new state
    if current_status != old_status:
        # Determine if we should send WhatsApp
        status_upper = current_status.upper()
        
        if status_upper in ["SHIPPED", "OUT FOR DELIVERY"]:
            etd = payload.get("etd", "")
            if etd:
                # Format ETD nicely if it's a datetime string, else just pass it
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(etd.replace("Z", "+00:00"))
                    etd = dt.strftime("%A, %d %B %Y")
                except Exception:
                    pass
            background_tasks.add_task(send_order_status_update, order, current_status, etd)
            
        elif status_upper == "DELIVERED":
            background_tasks.add_task(send_order_delivered, order)
            
        # Update the database to reflect the new status and prevent duplicates
        try:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            
            # Update tracking history if possible
            history = order.get("tracking_history") or []
            if isinstance(history, list):
                history.append({
                    "activity": f"Webhook Update: {current_status}",
                    "date": now,
                    "location": payload.get("current_location", "")
                })
                
            supabase.table("orders").update({
                "tracking_status": current_status,
                "tracking_history": history,
                "tracking_last_updated": now
            }).eq("id", order.get("id")).execute()
            
        except Exception as e:
            logger.error(f"Failed to update tracking status from Shiprocket webhook: {str(e)}")

    return Response(status_code=200)
