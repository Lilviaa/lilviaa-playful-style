from fastapi import Depends, Request, HTTPException, status
from app.core.exceptions import UnauthorizedError, ForbiddenError
from app.db.supabase import get_supabase, get_fresh_supabase

async def get_token_from_cookie(request: Request) -> str:
    """Extract access token from httpOnly cookie only. No header fallback — cookies are
    the only accepted mechanism to prevent XSS-based token theft."""
    token = request.cookies.get("access_token")
    if not token:
        raise UnauthorizedError("Not authenticated")
    return token

async def verify_csrf_token(request: Request):
    """
    Verify the CSRF token from headers matches the one in the cookie.
    Required for state-changing requests (POST, PUT, PATCH, DELETE).
    """
    if request.method in ["GET", "HEAD", "OPTIONS"]:
        return
        
    cookie_token = request.cookies.get("csrf_token")
    header_token = request.headers.get("X-CSRF-Token")
    
    if not cookie_token or not header_token or cookie_token != header_token:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="CSRF token validation failed"
        )

import firebase_admin.auth as firebase_auth

async def get_current_user_token(
    request: Request,
    _=Depends(verify_csrf_token)
) -> dict:
    """Validate the Firebase JWT from header, fallback to Supabase JWT from cookie."""
    
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            decoded_token = firebase_auth.verify_id_token(token)
            firebase_uid = decoded_token['uid']
            email = decoded_token.get('email', '')
            
            admin = get_supabase()
            user_data = admin.table("users").select("id, role").eq("email", email).execute()
            if user_data.data:
                return {
                    "sub": user_data.data[0]["id"],
                    "firebase_uid": firebase_uid,
                    "email": email,
                    "role": user_data.data[0].get("role", "customer"),
                    "token": token
                }
            else:
                return {
                    "sub": firebase_uid,
                    "firebase_uid": firebase_uid,
                    "email": email,
                    "role": "customer",
                    "token": token
                }
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"Token verification or DB query failed: {e}")
            raise UnauthorizedError(f"Firebase token invalid: {e}")
    else:
        # Fallback to Supabase cookie
        token = await get_token_from_cookie(request)
        try:
            fresh = get_fresh_supabase()
            user_response = fresh.auth.get_user(token)
            
            if not user_response or not user_response.user:
                raise UnauthorizedError("Could not validate credentials")
            
            user = user_response.user
            user_id = str(user.id)
            
            admin = get_supabase()
            user_data = admin.table("users").select("role").eq("id", user_id).single().execute()
            role = user_data.data.get("role", "customer") if user_data.data else "customer"
            
            return {
                "sub": user_id,
                "email": user.email,
                "role": role,
                "token": token
            }
        except UnauthorizedError:
            raise
        except Exception:
            raise UnauthorizedError("Could not validate credentials")

async def get_current_user_id(payload: dict = Depends(get_current_user_token)) -> str:
    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedError("User ID not found in token")
    return user_id

def require_role(allowed_roles: list[str]):
    async def role_checker(payload: dict = Depends(get_current_user_token)):
        role = payload.get("role")
        if role not in allowed_roles:
            raise ForbiddenError("Not enough permissions")
        return payload
    return role_checker

require_admin = require_role(["admin", "owner"])
require_owner = require_role(["owner"])
