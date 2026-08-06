from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

def get_trusted_ip(request: Request) -> str:
    """Securely extracts the real IP, prioritizing trusted proxies."""
    # Render, Vercel, and Cloudflare typically use X-Forwarded-For or similar.
    # Take the right-most IP if X-Forwarded-For is a list (standard practice for edge proxies).
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[-1].strip()
    
    # Fallback to default
    return get_remote_address(request)

def get_user_id(request: Request) -> str:
    """Extracts authenticated user ID, falls back to IP if anonymous."""
    user = getattr(request.state, "user", None)
    if user and isinstance(user, dict) and "sub" in user:
        return f"user:{user['sub']}"
    return f"ip:{get_trusted_ip(request)}"

def get_admin_id(request: Request) -> str:
    """Extracts admin ID, falls back to IP if anonymous."""
    user = getattr(request.state, "user", None)
    if user and isinstance(user, dict) and "sub" in user and user.get("role") in ["admin", "owner"]:
        return f"admin:{user['sub']}"
    return f"ip:{get_trusted_ip(request)}"

# Single shared Limiter instance
limiter = Limiter(key_func=get_trusted_ip)

class PreAuthRateLimit:
    """
    A FastAPI Dependency that forces a rate limit check BEFORE any other dependencies
    (like authentication/DB checks) execute.
    """
    def __init__(self, limit: str, key_func=get_trusted_ip):
        self.limit = limit
        self.key_func = key_func

    def __call__(self, request: Request):
        try:
            # We temporarily override the limiter's key_func for this specific check
            original_key_func = limiter._key_func
            limiter._key_func = self.key_func
            
            # _check_request_limit expects: request, endpoint_name, limit_list
            parsed_limit = limiter._strategy.parse_rate_limit(self.limit)
            limiter._check_request_limit(request, f"preauth:{self.limit}", [parsed_limit])
            
        except RateLimitExceeded as exc:
            # Re-raise so the global exception handler catches it
            raise RateLimitExceeded(exc)
        finally:
            limiter._key_func = original_key_func
