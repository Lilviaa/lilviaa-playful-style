import os
os.environ["HTTPX_NO_HTTP2"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
# hello!
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.api.v1 import addresses, categories, products, admin_products, orders, cart, firebase_auth
from app.api.v1 import admin_dashboard, admin_orders, admin_customers, admin_coupons
from app.core.firebase import init_firebase

init_firebase()

app = FastAPI(
    title="Lilviaa E-Commerce API",
    description="Backend API for Lilviaa E-Commerce",
    version="1.0.0",
)

@app.on_event("startup")
async def start_background_tasks():
    import asyncio
    asyncio.create_task(release_expired_stock_loop())

async def release_expired_stock_loop():
    from app.db.supabase import get_supabase
    from app.api.v1.orders import get_razorpay_client
    import asyncio
    import logging
    logger = logging.getLogger(__name__)
    while True:
        try:
            # Delay first to give the app time to boot fully
            await asyncio.sleep(60)
            supabase = get_supabase()

            # ── Safety-net: check Razorpay before cancelling ──
            # Fetch all pending orders older than 15 minutes that have a
            # payment_transactions row (i.e. Razorpay orders).
            try:
                pending_res = supabase.table("orders")\
                    .select("id")\
                    .eq("status", "pending")\
                    .lt("created_at", (
                        __import__("datetime").datetime.now(
                            __import__("datetime").timezone.utc
                        ) - __import__("datetime").timedelta(minutes=15)
                    ).isoformat())\
                    .execute()

                if pending_res.data:
                    rzp = get_razorpay_client()
                    for order_row in pending_res.data:
                        oid = order_row["id"]
                        try:
                            # Look up the razorpay_order_id for this order
                            tx_res = supabase.table("payment_transactions")\
                                .select("razorpay_order_id")\
                                .eq("order_id", oid)\
                                .eq("status", "pending")\
                                .limit(1)\
                                .execute()
                            if not tx_res.data:
                                continue
                            rz_order_id = tx_res.data[0].get("razorpay_order_id")
                            if not rz_order_id or not rzp:
                                continue

                            # Ask Razorpay if any payment was captured
                            payments = rzp.order.payments(rz_order_id)
                            captured = next(
                                (p for p in payments.get("items", [])
                                 if p.get("status") == "captured"),
                                None,
                            )
                            if captured:
                                # Payment WAS captured! Confirm the order
                                logger.info(
                                    f"Cron: Razorpay payment {captured['id']} "
                                    f"captured for order {oid}. Confirming."
                                )
                                rpc_res = supabase.rpc(
                                    "confirm_razorpay_payment",
                                    {
                                        "p_razorpay_order_id": rz_order_id,
                                        "p_razorpay_payment_id": captured["id"],
                                    },
                                ).execute()
                                rpc_data = rpc_res.data
                                if rpc_data and rpc_data.get("success") and not rpc_data.get("idempotent"):
                                    method = captured.get("method")
                                    if method:
                                        supabase.table("orders").update(
                                            {"payment_method": method}
                                        ).eq("id", oid).execute()
                                    logger.info(f"Cron: Order {oid} confirmed via Razorpay check.")
                        except Exception as inner_e:
                            logger.warning(
                                f"Cron: Failed Razorpay check for order {oid}: {inner_e}"
                            )
            except Exception as check_e:
                logger.warning(f"Cron: Pre-cancel Razorpay check failed: {check_e}")

            # Now cancel any orders that are STILL pending after our checks
            supabase.rpc("release_expired_stock_reservations").execute()
        except Exception as e:
            logging.error(f"Failed to run stock release cron: {str(e)}")

# Set up CORS


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request
from app.core.limiter import limiter

def custom_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    # Scrub headers (like X-RateLimit-Reset) to prevent timing attacks
    return JSONResponse(
        {"detail": "Too Many Requests"},
        status_code=429
    )

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, custom_rate_limit_handler)
app.add_middleware(SlowAPIMiddleware)

# Register custom exception handler
app.add_exception_handler(AppError, app_error_handler)

import traceback
from fastapi.responses import JSONResponse
import asyncio

@app.exception_handler(Exception)
async def global_unhandled_exception_handler(request: Request, exc: Exception):
    """
    Catches all unhandled 500 errors, logs them, and emails the admin.
    """
    from app.core.email import _send_email
    from app.core.config import settings
    import logging

    error_msg = f"{type(exc).__name__}: {str(exc)}"
    tb_str = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
    
    # 1. Log to console for Render
    logging.error(f"UNHANDLED EXCEPTION: {error_msg}\n{tb_str}")
    
    # 2. Fire and forget an email alert to the admin
    admin_email = settings.SMTP_FROM_EMAIL or "lilviaa.project@gmail.com" # fallback to sender email
    subject = f"🔴 URGENT: Production Bug on Lilviaa - {error_msg}"
    html = f"""
    <html>
      <body style="font-family: monospace; padding: 20px; background: #fff0f0; color: #333;">
        <h2 style="color: #d32f2f;">Lilviaa Production Error</h2>
        <p><strong>URL:</strong> {request.method} {request.url}</p>
        <p><strong>Error:</strong> {error_msg}</p>
        <hr>
        <pre style="background: #f4f4f4; padding: 10px; overflow-x: auto;">{tb_str}</pre>
      </body>
    </html>
    """
    
    # Run in background to avoid delaying the 500 response
    asyncio.create_task(asyncio.to_thread(_send_email, admin_email, subject, html))
    
    # 3. Return standard 500 error to user
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected error occurred. Our team has been notified."}
    )


# Include Routers
from app.api.v1 import addresses, categories, products, admin_products, orders, cart, banners, reviews, cms
from app.api.v1 import admin_dashboard, admin_orders, admin_customers, admin_coupons, admin_banners, admin_reviews, admin_cms, admin_emails
from app.api.v1 import whatsapp_webhook, shiprocket_webhook, contact, wishlists, shipping, webhooks

# (I will just add them below the others)
app.include_router(firebase_auth.router, prefix="/api/v1/firebase_auth", tags=["Firebase Auth"])
app.include_router(addresses.router, prefix="/api/v1/addresses", tags=["Addresses"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(wishlists.router, prefix="/api/v1/wishlists", tags=["Wishlist"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(admin_products.router, prefix="/api/v1/admin/products", tags=["Admin Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(banners.router, prefix="/api/v1/banners", tags=["Banners"])
app.include_router(reviews.router, prefix="/api/v1/reviews", tags=["Reviews"])
app.include_router(cms.router, prefix="/api/v1/cms", tags=["CMS"])
app.include_router(admin_dashboard.router, prefix="/api/v1/admin/dashboard", tags=["Admin Dashboard"])
app.include_router(admin_orders.router, prefix="/api/v1/admin/orders", tags=["Admin Orders"])
app.include_router(admin_customers.router, prefix="/api/v1/admin/customers", tags=["Admin Customers"])
app.include_router(admin_coupons.router, prefix="/api/v1/admin/coupons", tags=["Admin Coupons"])
app.include_router(admin_banners.router, prefix="/api/v1/admin/banners", tags=["Admin Banners"])
app.include_router(admin_reviews.router, prefix="/api/v1/admin/reviews", tags=["Admin Reviews"])
app.include_router(admin_cms.router, prefix="/api/v1/admin/cms", tags=["Admin CMS"])
app.include_router(admin_emails.router, prefix="/api/v1/admin/emails", tags=["Admin Emails"])
app.include_router(whatsapp_webhook.router, prefix="/api/v1/whatsapp", tags=["WhatsApp Webhook"])
app.include_router(shiprocket_webhook.router, prefix="/api/v1/logistics", tags=["Logistics Webhook"])
app.include_router(contact.router, prefix="/api/v1/contact", tags=["Contact"])
app.include_router(shipping.router, prefix="/api/v1/shipping", tags=["Shipping"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": app.version}
