from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from limits import parse

def get_trusted_ip(request: Request) -> str:
    """
    Extracts the real client IP using trusted-hop-counting from the right
    side of X-Forwarded-For.

    Architecture: Client -> Vercel Edge -> Render/Cloudflare -> FastAPI
    Trusted proxy depth = 2 (Vercel + Render)

    X-Forwarded-For arrives as: [SpoofedIPs..., ClientIP, VercelIP]
    We grab [-2] (second from right) = the IP that Vercel saw connecting,
    which is the real client IP.

    If the header has fewer entries than expected (e.g., local dev with
    no proxies, or direct Render access with 1 proxy), we fall back to
    the leftmost IP — this is less secure but avoids IndexError crashes.

    KNOWN ACCEPTED RISK: If an attacker bypasses Vercel and hits Render
    directly, proxy depth drops to 1 and [-2] could grab a spoofed IP.
    This requires infrastructure-level mitigation (Cloudflare, Render
    Scale plan IP allowlist, or stack migration to Next.js for Edge
    Middleware support). Documented and deferred.
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
        TRUSTED_PROXY_DEPTH = 2  # Vercel + Render
        if len(ips) >= TRUSTED_PROXY_DEPTH:
            return ips[-TRUSTED_PROXY_DEPTH]
        else:
            # Fewer hops than expected (local dev or direct access)
            return ips[0]

    # No X-Forwarded-For at all (direct connection, no proxies)
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
