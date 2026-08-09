import os
import logging
from fastapi import APIRouter, Request, Response, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/webhook")
async def verify_webhook(request: Request):
    """
    Meta WhatsApp webhook verification (challenge-response).

    Meta sends:
      GET /api/v1/whatsapp/webhook?hub.mode=subscribe
          &hub.verify_token=<token>&hub.challenge=<challenge>

    We must return hub.challenge as plain text if the token matches.
    """
    params = request.query_params
    mode = params.get("hub.mode")
    token = params.get("hub.verify_token")
    challenge = params.get("hub.challenge")

    expected_token = os.environ.get("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "")

    if mode == "subscribe" and token == expected_token:
        logger.info("WhatsApp webhook verified successfully.")
        return Response(content=challenge, media_type="text/plain", status_code=200)

    logger.warning(f"WhatsApp webhook verification failed. mode={mode}, token_match={token == expected_token}")
    raise HTTPException(status_code=403, detail="Verification failed")


@router.post("/webhook")
async def receive_webhook(request: Request):
    """
    Receive incoming WhatsApp webhook events from Meta.

    For now we just log the payload and return 200.
    Real handling (delivery receipts, message replies) can be added later.
    """
    try:
        body = await request.json()
        logger.info(f"WhatsApp webhook received: {body}")
    except Exception as e:
        logger.warning(f"WhatsApp webhook received non-JSON body: {str(e)}")

    return Response(status_code=200)
