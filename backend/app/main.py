import os
import hmac
os.environ["HTTPX_NO_HTTP2"] = "1"

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv()
# hello!
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.api.v1 import addresses, categories, products, admin_products, orders, webhooks, cart, firebase_auth
from app.api.v1 import admin_dashboard, admin_orders, admin_customers, admin_coupons
from app.core.firebase import init_firebase

init_firebase()

app = FastAPI(
    title="Lilviaa E-Commerce API",
    description="Backend API for Lilviaa E-Commerce",
    version="1.0.0",
)

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

# ---------------------------------------------------------------------------
# Proxy Secret Enforcement Middleware
# ---------------------------------------------------------------------------
# Enforces that ALL traffic to the backend has passed through our Vercel edge
# proxy. The Vercel Project-Level Routing Rule injects X-Proxy-Secret with a
# shared secret. Any request missing or presenting a wrong value is rejected
# with 403 before any other logic (rate limiting, auth, DB) runs.
#
# When PROXY_SECRET is empty (local dev), this check is bypassed entirely so
# developers can hit the backend directly without configuring the header.
# ---------------------------------------------------------------------------
@app.middleware("http")
async def enforce_proxy_secret(request: Request, call_next):
    secret = settings.PROXY_SECRET
    if not secret:
        # PROXY_SECRET not configured — local dev passthrough
        return await call_next(request)

    incoming = request.headers.get("X-Proxy-Secret", "")
    # hmac.compare_digest is timing-safe — prevents timing-oracle attacks that
    # could allow an attacker to brute-force the secret character by character.
    if not hmac.compare_digest(incoming, secret):
        return JSONResponse({"detail": "Forbidden"}, status_code=403)

    return await call_next(request)
# ---------------------------------------------------------------------------

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

# Include Routers
from app.api.v1 import addresses, categories, products, admin_products, orders, webhooks, cart, banners, reviews, cms
from app.api.v1 import admin_dashboard, admin_orders, admin_customers, admin_coupons, admin_banners, admin_reviews, admin_cms

# (I will just add them below the others)
app.include_router(firebase_auth.router, prefix="/api/v1/firebase_auth", tags=["Firebase Auth"])
app.include_router(addresses.router, prefix="/api/v1/addresses", tags=["Addresses"])
app.include_router(cart.router, prefix="/api/v1/cart", tags=["Cart"])
app.include_router(categories.router, prefix="/api/v1/categories", tags=["Categories"])
app.include_router(products.router, prefix="/api/v1/products", tags=["Products"])
app.include_router(admin_products.router, prefix="/api/v1/admin/products", tags=["Admin Products"])
app.include_router(orders.router, prefix="/api/v1/orders", tags=["Orders"])
app.include_router(webhooks.router, prefix="/api/v1/webhooks", tags=["Webhooks"])
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

@app.get("/health")
def health_check():
    return {"status": "ok", "version": app.version}
