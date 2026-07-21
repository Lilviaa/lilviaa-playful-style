from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.api.v1 import auth, addresses

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

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Register custom exception handler
app.add_exception_handler(AppError, app_error_handler)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(addresses.router, prefix="/api/v1/addresses", tags=["Addresses"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": app.version}
