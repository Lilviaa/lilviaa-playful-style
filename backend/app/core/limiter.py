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

# Single shared Limiter instance used by @limiter.limit() decorators
limiter = Limiter(key_func=get_trusted_ip)

class PreAuthRateLimit:
    """
    A FastAPI Dependency that enforces a rate limit BEFORE authentication or DB
    dependencies run, so abusive traffic is rejected cheaply.

    THREAD-SAFETY FIX: The previous implementation mutated the shared
    `limiter._key_func` to switch key functions per-call. Under concurrent load
    (e.g. 130 JMeter threads), Thread A's key would be overwritten by Thread B's
    `finally` block mid-execution, causing rate counters to accumulate against
    random/wrong keys — the limiter became a no-op under burst traffic.

    Fix: Each PreAuthRateLimit instance owns its own private Limiter with its
    own immutable key_func. No shared mutable state is ever touched. Multiple
    concurrent calls to the same PreAuthRateLimit instance are safe because
    Limiter._check_request_limit only reads _key_func, and ours never changes.
    """
    def __init__(self, limit: str, key_func=get_trusted_ip):
        self.limit = limit
        # Each instance gets its own Limiter — no shared _key_func mutation
        self._limiter = Limiter(key_func=key_func)

    def __call__(self, request: Request):
        def preauth_dummy():
            pass
        preauth_dummy.__name__ = f"preauth_{self.limit.replace('/', '_')}"

        parsed_limit = parse(self.limit)
        try:
            self._limiter._check_request_limit(request, preauth_dummy, [parsed_limit])
        except RateLimitExceeded as exc:
            # Re-raise so the global exception handler returns 429
            raise RateLimitExceeded(exc)

