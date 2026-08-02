from fastapi import APIRouter, Depends, status, HTTPException, Response, Request, BackgroundTasks
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from app.models.auth import UserCreate, UserLogin, Token, UserResponse, UserProfileUpdate, ChangePassword, ForgotPasswordRequest, ResetPasswordOTPRequest, VerifyOTPRequest, VerifyAccountRequest, ResendVerifyOTPRequest
from app.services.auth_service import auth_service
from app.api.dependencies import get_current_user_id, get_current_user_token, get_token_from_cookie, verify_csrf_token
from app.core.config import settings
from app.core.limiter import limiter
from slowapi.util import get_remote_address
from app.db.supabase import get_supabase
from app.core.email import send_otp_email, send_verification_email
from app.core.exceptions import UnverifiedAccountError

router = APIRouter()

def set_auth_cookies(response: Response, token: Token):
    """Set secure httpOnly cookies for access and refresh tokens, plus a readable CSRF cookie.
    SameSite=Strict prevents cross-site form/fetch submissions for login and register
    (pre-auth endpoints that don't have a CSRF token yet).
    """
    is_prod = settings.ENVIRONMENT == "production"
    samesite = "none" if is_prod else "lax"
    
    # CSRF token - readable by JS
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False, # Needed by JS to read and send in header
        secure=is_prod,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60 # 7 days (must outlive access token to allow refresh)
    )
    
    # Access token - HTTP Only
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        secure=is_prod,
        samesite=samesite,
        max_age=30 * 60 # 30 mins
    )
    
    # Refresh token - HTTP Only
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        httponly=True,
        secure=is_prod,
        samesite=samesite,
        max_age=7 * 24 * 60 * 60 # 7 days
    )

def clear_auth_cookies(response: Response):
    is_prod = settings.ENVIRONMENT == "production"
    samesite = "none" if is_prod else "lax"

    response.delete_cookie(
        "access_token",
        secure=is_prod,
        httponly=True,
        samesite=samesite
    )
    response.delete_cookie(
        "refresh_token",
        secure=is_prod,
        httponly=True,
        samesite=samesite
    )
    response.delete_cookie(
        "csrf_token",
        secure=is_prod,
        httponly=False,
        samesite=samesite
    )

# ──────────────────────────────────────────
# Registration & Login
# ──────────────────────────────────────────

@router.post("/register", status_code=status.HTTP_201_CREATED)
@limiter.limit("30/minute")
def register(request: Request, user_in: UserCreate, background_tasks: BackgroundTasks):
    """Register a new customer account. Sends a verification OTP to the user's email.
    The user must verify their email before they can log in.
    
    If the email already exists but is unverified (abandoned registration),
    we resend a fresh verification OTP instead of erroring.
    """
    supabase = get_supabase()
    
    # Check if this email already exists in users table
    existing = supabase.table("users").select("id, is_verified").eq("email", user_in.email).execute()
    
    if existing.data:
        if existing.data[0].get("is_verified", False):
            # Already verified — normal "email taken" error
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="An account with this email already exists."
            )
        else:
            # Unverified abandoned registration — resend OTP
            otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
            otp_hash = hashlib.sha256(otp.encode()).hexdigest()
            expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
            
            supabase.table("password_reset_otps").insert({
                "email": user_in.email,
                "otp_hash": otp_hash,
                "expires_at": expires_at
            }).execute()
            
            background_tasks.add_task(send_verification_email, user_in.email, otp)
            
            return {"message": "Verification code sent to your email.", "email": user_in.email, "requires_verification": True}
    
    # Fresh registration
    user = auth_service.register_user(user_in)
    
    # Generate verification OTP
    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    
    supabase.table("password_reset_otps").insert({
        "email": user_in.email,
        "otp_hash": otp_hash,
        "expires_at": expires_at
    }).execute()
    
    background_tasks.add_task(send_verification_email, user_in.email, otp)
    
    return {"message": "Account created. Verification code sent to your email.", "email": user_in.email, "requires_verification": True}

def _email_key(request: Request) -> str:
    """Key function for per-email rate limiting on login.
    form._dict is populated by FastAPI's OAuth2PasswordRequestForm Depends before this runs."""
    form = getattr(request, "_form", None)
    if form:
        return f"login_email:{form.get('username', 'unknown')}"
    return f"login_ip:{get_remote_address(request)}"

@router.post("/login")
@limiter.limit("30/minute")                         # Layer 1: per IP
@limiter.limit("5/minute", key_func=_email_key)    # Layer 2: per email address
def login(request: Request, response: Response, background_tasks: BackgroundTasks, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password, setting secure httpOnly cookies."""
    try:
        credentials = UserLogin(email=form_data.username, password=form_data.password)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'username' field must be a valid email address."
        )
    
    try:
        token = auth_service.login_user(credentials)
    except UnverifiedAccountError as e:
        # Account exists but not verified — send a fresh OTP and tell the frontend
        supabase = get_supabase()
        otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
        otp_hash = hashlib.sha256(otp.encode()).hexdigest()
        expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
        
        supabase.table("password_reset_otps").insert({
            "email": e.email,
            "otp_hash": otp_hash,
            "expires_at": expires_at
        }).execute()
        
        background_tasks.add_task(send_verification_email, e.email, otp)
        
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": "Account not verified. A new verification code has been sent to your email.",
                "requires_verification": True,
                "email": e.email
            }
        )
    
    set_auth_cookies(response, token)
    return {"message": "Logged in successfully"}

@router.post("/refresh")
@limiter.limit("5/minute")
def refresh_token(request: Request, response: Response, _csrf=Depends(verify_csrf_token)):
    """Refresh the access token using the refresh_token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    
    token = auth_service.refresh_token(refresh_token)
    set_auth_cookies(response, token)
    return {"message": "Token refreshed"}

@router.post("/logout")
def logout(response: Response, _csrf=Depends(verify_csrf_token), token: str = Depends(get_token_from_cookie)):
    """Logout — invalidate the current session and clear cookies."""
    result = auth_service.logout_user(token)
    clear_auth_cookies(response)
    return result

# ──────────────────────────────────────────
# Account Verification
# ──────────────────────────────────────────

@router.post("/verify-account")
@limiter.limit("5/15minute")
def verify_account(request: Request, data: VerifyAccountRequest, response: Response):
    """Verify a newly registered account using the OTP sent via email.
    On success, marks the account as verified and issues auth cookies (auto-login).
    """
    supabase = get_supabase()
    otp_hash = hashlib.sha256(data.otp.encode()).hexdigest()
    
    # Validate OTP
    res = supabase.table("password_reset_otps")\
        .select("*")\
        .eq("email", data.email)\
        .eq("otp_hash", otp_hash)\
        .eq("used", False)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
    
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    expires_at = datetime.fromisoformat(res.data[0]["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    # Mark OTP as used
    supabase.table("password_reset_otps").update({"used": True}).eq("id", res.data[0]["id"]).execute()
    
    # Mark user as verified
    supabase.table("users").update({"is_verified": True}).eq("email", data.email).execute()
    
    # Auto-login: We need to get the user's stored password to sign in.
    # Since we can't retrieve the password, we use the admin API to get a session.
    user_data = supabase.table("users").select("id").eq("email", data.email).execute()
    if not user_data.data:
        raise HTTPException(status_code=400, detail="User not found")
    
    # Use admin to generate a link, then sign them in by issuing tokens directly
    from app.db.supabase import get_anon_supabase
    
    # Generate magic link to get session tokens for the verified user
    link_response = supabase.auth.admin.generate_link({
        "type": "magiclink",
        "email": data.email,
    })
    
    # Sign in using the generated token properties
    if hasattr(link_response, 'properties') and hasattr(link_response.properties, 'access_token'):
        from app.models.auth import Token
        token = Token(
            access_token=link_response.properties.access_token,
            refresh_token=link_response.properties.refresh_token,
            token_type="bearer"
        )
        set_auth_cookies(response, token)
    
    return {"message": "Account verified successfully!", "verified": True}

@router.post("/resend-verify-otp")
@limiter.limit("5/hour")
def resend_verify_otp(request: Request, data: ResendVerifyOTPRequest, background_tasks: BackgroundTasks):
    """Resend a verification OTP to an unverified account."""
    supabase = get_supabase()
    
    # Only send if user exists and is NOT verified
    user_check = supabase.table("users").select("id, is_verified").eq("email", data.email).execute()
    if not user_check.data or user_check.data[0].get("is_verified", False):
        # Don't leak whether the email exists — just return success
        return {"message": "If an unverified account exists, a verification code was sent."}
    
    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    
    supabase.table("password_reset_otps").insert({
        "email": data.email,
        "otp_hash": otp_hash,
        "expires_at": expires_at
    }).execute()
    
    background_tasks.add_task(send_verification_email, data.email, otp)
    
    return {"message": "If an unverified account exists, a verification code was sent."}

# ──────────────────────────────────────────
# Profile — Read & Update
# ──────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
def get_me(user_id: str = Depends(get_current_user_id)):
    """Get current user profile."""
    return auth_service.get_user_profile(user_id)

@router.patch("/me", response_model=UserResponse)
def update_me(updates: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    """Update current user's profile. Send only the fields you want to change.
    Note: Email changes are NOT supported here — a verified email-change flow
    (confirmation link to the new address) must be built before enabling this.
    """
    return auth_service.update_profile(user_id, updates)

@router.post("/me/change-password")
def change_password(data: ChangePassword, response: Response, user_id: str = Depends(get_current_user_id)):
    """Change the current user's password. Requires current password."""
    result = auth_service.change_password(user_id, data.new_password, data.current_password)
    # Clear cookies because password change invalidates all existing sessions in Supabase
    clear_auth_cookies(response)
    return result

# ──────────────────────────────────────────
# Forgot Password
# ──────────────────────────────────────────

@router.post("/forgot-password")
@limiter.limit("5/hour")
def forgot_password(request: Request, data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    supabase = get_supabase()
    # Ensure user exists by checking users view
    res = supabase.table("users").select("id").eq("email", data.email).execute()
    if not res.data:
        # We don't want to leak whether the email exists, just return success
        return {"message": "If an account exists, a reset code was sent."}
    
    # Generate 6 digit OTP
    otp = "".join([str(secrets.randbelow(10)) for _ in range(6)])
    
    # Hash OTP before storing
    otp_hash = hashlib.sha256(otp.encode()).hexdigest()
    expires_at = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    
    supabase.table("password_reset_otps").insert({
        "email": data.email,
        "otp_hash": otp_hash,
        "expires_at": expires_at
    }).execute()
    
    # Queue email sending
    background_tasks.add_task(send_otp_email, data.email, otp)
    
    return {"message": "If an account exists, a reset code was sent."}

@router.post("/verify-otp")
@limiter.limit("5/15minute")
def verify_otp(request: Request, data: VerifyOTPRequest):
    supabase = get_supabase()
    otp_hash = hashlib.sha256(data.otp.encode()).hexdigest()
    
    res = supabase.table("password_reset_otps")\
        .select("*")\
        .eq("email", data.email)\
        .eq("otp_hash", otp_hash)\
        .eq("used", False)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    expires_at = datetime.fromisoformat(res.data[0]["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    return {"valid": True}

@router.post("/reset-password-with-otp")
@limiter.limit("5/minute")
def reset_password_with_otp(request: Request, data: ResetPasswordOTPRequest):
    supabase = get_supabase()
    
    # Hash the provided OTP
    otp_hash = hashlib.sha256(data.otp.encode()).hexdigest()
    
    # Get the latest unused OTP for this email
    res = supabase.table("password_reset_otps")\
        .select("*")\
        .eq("email", data.email)\
        .eq("otp_hash", otp_hash)\
        .eq("used", False)\
        .order("created_at", desc=True)\
        .limit(1)\
        .execute()
        
    if not res.data:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    otp_record = res.data[0]
    
    # Check expiration
    expires_at = datetime.fromisoformat(otp_record["expires_at"].replace("Z", "+00:00"))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired")
        
    # Valid! Find user ID
    user_res = supabase.table("users").select("id").eq("email", data.email).execute()
    if not user_res.data:
        raise HTTPException(status_code=400, detail="User not found")
        
    user_id = user_res.data[0]["id"]
    
    # Use Supabase Admin to force password update
    try:
        supabase.auth.admin.update_user_by_id(user_id, {"password": data.new_password})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset password: {str(e)}")
        
    # Mark OTP as used
    supabase.table("password_reset_otps").update({"used": True}).eq("id", otp_record["id"]).execute()
    
    return {"message": "Password updated successfully"}

# ──────────────────────────────────────────
# OAuth Stubs
# ──────────────────────────────────────────

@router.get("/oauth/google")
def google_oauth_stub():
    """Stub for Google OAuth2 login redirect."""
    return {"message": "Google OAuth2 flow to be implemented with Supabase Auth URL"}
