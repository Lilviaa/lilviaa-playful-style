from fastapi import APIRouter, Depends, status, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
import secrets
from app.models.auth import UserCreate, UserLogin, Token, UserResponse, UserProfileUpdate, ChangePassword
from app.services.auth_service import auth_service
from app.api.dependencies import get_current_user_id, get_current_user_token, get_token_from_cookie, verify_csrf_token
from app.core.config import settings
from app.core.limiter import limiter
from slowapi.util import get_remote_address

router = APIRouter()

def set_auth_cookies(response: Response, token: Token):
    """Set secure httpOnly cookies for access and refresh tokens, plus a readable CSRF cookie.
    SameSite=Strict prevents cross-site form/fetch submissions for login and register
    (pre-auth endpoints that don't have a CSRF token yet).
    """
    is_prod = settings.ENVIRONMENT == "production"
    samesite = "strict"
    
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
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    response.delete_cookie("csrf_token")

# ──────────────────────────────────────────
# Registration & Login
# ──────────────────────────────────────────

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
@limiter.limit("3/minute")
def register(request: Request, user_in: UserCreate, response: Response):
    """Register a new customer and immediately issue a session.
    
    MVP shortcut: email_confirm is set to True (auto-confirmed) so users can log in
    right away without clicking a verification link. This means anyone can register
    with an email they don't own. This is an intentional, documented trade-off for
    the MVP phase — real email verification must be implemented before production launch.
    TODO: set email_confirm=False + send confirmation email before enabling real users.
    """
    user = auth_service.register_user(user_in)
    token = auth_service.login_user(UserLogin(email=user_in.email, password=user_in.password))
    set_auth_cookies(response, token)
    return user

def _email_key(request: Request) -> str:
    """Key function for per-email rate limiting on login.
    form._dict is populated by FastAPI's OAuth2PasswordRequestForm Depends before this runs."""
    form = getattr(request, "_form", None)
    if form:
        return f"login_email:{form.get('username', 'unknown')}"
    return f"login_ip:{get_remote_address(request)}"

@router.post("/login")
@limiter.limit("5/minute")                          # Layer 1: per IP
@limiter.limit("5/minute", key_func=_email_key)    # Layer 2: per email address
def login(request: Request, response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
    """Login with email and password, setting secure httpOnly cookies."""
    try:
        credentials = UserLogin(email=form_data.username, password=form_data.password)
    except ValidationError:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The 'username' field must be a valid email address."
        )
    token = auth_service.login_user(credentials)
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
# OAuth Stubs
# ──────────────────────────────────────────

@router.get("/oauth/google")
def google_oauth_stub():
    """Stub for Google OAuth2 login redirect."""
    return {"message": "Google OAuth2 flow to be implemented with Supabase Auth URL"}
