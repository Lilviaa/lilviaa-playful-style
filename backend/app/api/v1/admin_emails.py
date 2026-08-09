from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Request
from app.api.dependencies import require_admin
from app.services.mailer import send_customer_order_confirmation, send_owner_order_notification
from app.core.limiter import limiter, PreAuthRateLimit
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/test-email", dependencies=[Depends(PreAuthRateLimit("5/minute")), Depends(require_admin)])
@limiter.limit("5/minute")
async def send_test_email(request: Request, background_tasks: BackgroundTasks, to_email: str = None):
    """
    Test endpoint for order confirmation emails. 
    Generates a mock order payload and sends it to the provided email (or the configured OWNER_EMAIL if none provided).
    Requires Admin authentication.
    """
    
    mock_order = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat() + "Z",
        "order_source": "online",
        "payment_method": "razorpay",
        "status": "processing",
        "user_email": to_email or "Lilviaa.byutsav@gmail.com",
        "full_name": "Test Customer",
        "addresses": {
            "full_name": "Test Customer",
            "phone": "9876543210",
            "address": "123 Test Street, Mock Area",
            "city": "Tiruppur",
            "state": "Tamil Nadu",
            "zip": "641604",
            "email": to_email or "Lilviaa.byutsav@gmail.com"
        },
        "payment_transactions": [{"status": "successful"}],
        "items": [
            {
                "quantity": 2,
                "unit_price": 499.0,
                "total_price": 998.0,
                "product_variants": {
                    "size": "M",
                    "sku": "TS-MOCK-M",
                    "products": {
                        "name": "Mock T-Shirt"
                    }
                }
            },
            {
                "quantity": 1,
                "unit_price": 1299.0,
                "total_price": 1299.0,
                "product_variants": {
                    "size": "L",
                    "sku": "JS-MOCK-L",
                    "products": {
                        "name": "Mock Jacket"
                    }
                }
            }
        ],
        "subtotal": 2297.0,
        "discount_amount": 100.0,
        "shipping_amount": 50.0,
        "gst_amount": 0.0,
        "gst_percentage": 0.0,
        "total_amount": 2247.0
    }
    
    # Enqueue emails just like the real webhook does
    background_tasks.add_task(send_customer_order_confirmation, mock_order)
    background_tasks.add_task(send_owner_order_notification, mock_order)
    
    return {"status": "success", "message": "Test emails have been queued. Please check your inbox shortly."}


@router.post("/test-whatsapp", dependencies=[Depends(PreAuthRateLimit("5/minute")), Depends(require_admin)])
@limiter.limit("5/minute")
async def send_test_whatsapp(request: Request, background_tasks: BackgroundTasks, phone: str = None):
    """
    Test endpoint for WhatsApp order notifications.
    Sends both customer confirmation and owner alert templates with mock order data.
    Requires Admin authentication.
    """
    from app.services.whatsapp import (
        send_customer_order_confirmation as wa_customer,
        send_owner_order_alert as wa_owner,
    )

    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required. Provide ?phone=91XXXXXXXXXX")

    mock_order = {
        "id": str(uuid.uuid4()),
        "created_at": datetime.now().isoformat() + "Z",
        "order_source": "online",
        "payment_method": "razorpay",
        "status": "processing",
        "phone": phone,
        "full_name": "Test Customer",
        "addresses": {
            "full_name": "Test Customer",
            "phone": phone,
            "address": "123 Test Street, Mock Area",
            "city": "Tiruppur",
            "state": "Tamil Nadu",
            "zip": "641604",
        },
        "items": [
            {
                "quantity": 2,
                "unit_price": 499.0,
                "total_price": 998.0,
                "product_variants": {
                    "size": "M",
                    "sku": "TS-MOCK-M",
                    "products": {"name": "Mock T-Shirt"},
                },
            },
            {
                "quantity": 1,
                "unit_price": 1299.0,
                "total_price": 1299.0,
                "product_variants": {
                    "size": "L",
                    "sku": "JS-MOCK-L",
                    "products": {"name": "Mock Jacket"},
                },
            },
        ],
        "subtotal": 2297.0,
        "discount_amount": 100.0,
        "shipping_amount": 50.0,
        "gst_amount": 0.0,
        "gst_percentage": 0.0,
        "total_amount": 2247.0,
    }

    background_tasks.add_task(wa_customer, mock_order)
    background_tasks.add_task(wa_owner, mock_order)

    return {
        "status": "success",
        "message": f"Test WhatsApp messages have been queued for {phone}. Check your phone shortly.",
    }
