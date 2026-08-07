from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from limits import parse

def get_trusted_ip(request: Request) -> str:
    """
    Extracts the client IP from X-Forwarded-For by taking the leftmost IP (ips[0]).

    Architecture: Client -> Vercel Edge -> Render/Cloudflare -> FastAPI

    Because Render adds an unpredictable number of internal hops to the
    X-Forwarded-For header before the request reaches the FastAPI process,
    we cannot reliably count hops from the right (e.g. [-2]).

    Therefore, we take ips[0] (the first IP added to the list, which is
    what Vercel saw connecting).

    KNOWN ACCEPTED RISK: An attacker can spoof their IP by sending a fake
    X-Forwarded-For header, which will become ips[0]. This means they can
    bypass rate limiting.
    This requires infrastructure-level mitigation (like putting Cloudflare
    in front of Render to overwrite the header). Documented and deferred.
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
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
