from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from limits import parse

def get_trusted_ip(request: Request) -> str:
    """
    Extracts the client IP, prioritizing Vercel's proprietary header.

    Architecture: Client -> Vercel Edge -> Render/Cloudflare -> FastAPI

    Vercel does not append to X-Forwarded-For on external rewrites. Instead,
    it replaces it with its own rotating edge node IPs, and places the true
    client IP in 'x-vercel-forwarded-for'.

    Therefore, we MUST read 'x-vercel-forwarded-for' first. If it's missing
    (e.g., direct Render access or local dev), we fall back to X-Forwarded-For.

    KNOWN ACCEPTED RISK: Direct Render access still allows spoofing by an
    attacker sending fake X-Forwarded-For or x-vercel-forwarded-for headers.
    Requires infrastructure-level mitigation (Cloudflare).
    """
    # Primary: Vercel-specific header (real client IP when routed through Vercel)
    vercel_ip = request.headers.get("x-vercel-forwarded-for")
    if vercel_ip:
        return vercel_ip.split(",")[0].strip()

    # Fallback: standard XFF for direct Render access or local dev
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()

    # No proxy headers at all (direct connection, local dev)
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
            
            def preauth_dummy():
                pass
            preauth_dummy.__name__ = f"preauth_{self.limit.replace('/', '_')}"
            
            # _check_request_limit expects: request, endpoint_name, limit_list
            parsed_limit = parse(self.limit)
            limiter._check_request_limit(request, preauth_dummy, [parsed_limit])
            
        except RateLimitExceeded as exc:
            # Re-raise so the global exception handler catches it
            raise RateLimitExceeded(exc)
        finally:
            limiter._key_func = original_key_func
