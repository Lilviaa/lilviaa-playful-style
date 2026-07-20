from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import AppError, app_error_handler
from app.api.v1 import auth

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

# Register custom exception handler
app.add_exception_handler(AppError, app_error_handler)

# Include Routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])

@app.get("/health")
def health_check():
    return {"status": "ok", "version": app.version}
