import os
os.environ["HTTPX_NO_HTTP2"] = "1"

from supabase import create_client, Client
from app.core.config import settings

# Shared admin client — used for operations that bypass RLS (creating users, 
# admin updates, verifying tokens). This client is NOT used for user sign-in
# to avoid session contamination.
_admin_client: Client | None = None

def get_supabase() -> Client:
    """Get the admin Supabase client (service_role key, no user session)."""
    global _admin_client
    if _admin_client is None:
        _admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _admin_client

def get_fresh_supabase() -> Client:
    """Create a fresh Supabase client — used for sign_in_with_password so the 
    user session doesn't pollute the admin client."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)

def get_anon_supabase() -> Client:
    """Create a fresh anon Supabase client for user-facing auth flows to avoid
    exposing service role privileges if abused."""
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
