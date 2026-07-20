from fastapi import APIRouter, Depends, status, HTTPException, Response, Request
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import ValidationError
import secrets
from app.models.auth import UserCreate, UserLogin, Token, UserResponse, UserProfileUpdate, ChangePassword
from app.services.auth_service import auth_service
from app.api.dependencies import get_current_user_id, get_current_user_token, get_token_from_cookie

router = APIRouter()

def set_auth_cookies(response: Response, token: Token):
    """Set secure httpOnly cookies for access and refresh tokens, plus a readable CSRF cookie."""
    # CSRF token - readable by JS
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        httponly=False, # Needed by JS to read and send in header
        secure=False,   # Set True in prod
        samesite="lax",
        max_age=30 * 60 # 30 mins
    )
    
    # Access token - HTTP Only
    response.set_cookie(
        key="access_token",
        value=token.access_token,
        httponly=True,
        secure=False,   # Set True in prod (HTTPS)
        samesite="lax",
        max_age=30 * 60 # 30 mins
    )
    
    # Refresh token - HTTP Only
    response.set_cookie(
        key="refresh_token",
        value=token.refresh_token,
        httponly=True,
        secure=False,   # Set True in prod
        samesite="lax",
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
def register(user_in: UserCreate, response: Response):
    """Register a new customer and log them in immediately."""
    user = auth_service.register_user(user_in)
    # Log them in automatically
    token = auth_service.login_user(UserLogin(email=user_in.email, password=user_in.password))
    set_auth_cookies(response, token)
    return user

@router.post("/login")
def login(response: Response, form_data: OAuth2PasswordRequestForm = Depends()):
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
def refresh_token(request: Request, response: Response):
    """Refresh the access token using the refresh_token cookie."""
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No refresh token provided")
    
    token = auth_service.refresh_token(refresh_token)
    set_auth_cookies(response, token)
    return {"message": "Token refreshed"}

@router.post("/logout")
def logout(response: Response, token: str = Depends(get_token_from_cookie)):
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
    """Update current user's profile. Send only the fields you want to change."""
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
