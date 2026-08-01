from fastapi import APIRouter
from app.db.supabase import get_supabase
from datetime import datetime, timezone

router = APIRouter()

@router.get("/")
def get_public_banners():
    """Fetch active banners for the storefront."""
    supabase = get_supabase()
    now = datetime.now(timezone.utc).isoformat()
    
    # RLS bypasses via get_supabase(), but we can still rely on the same logic 
    # as the RLS policy, or use get_anon_supabase() if preferred. Let's do it explicitly:
    res = supabase.table("banners") \
        .select("*") \
        .eq("active", True) \
        .order("sort_order", desc=False) \
        .execute()
        
    # Python side filtering for start_date and end_date if using admin client
    # Or rely on Supabase filtering:
    # PostgREST syntax for OR logic is slightly verbose in Python, so we filter in memory for dates.
    active_banners = []
    current_time = datetime.now(timezone.utc)
    for b in res.data:
        start = b.get("start_date")
        end = b.get("end_date")
        
        # start_date check
        if start:
            start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
            if start_dt > current_time:
                continue
                
        # end_date check
        if end:
            end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
            if end_dt < current_time:
                continue
                
        active_banners.append(b)
        
    return active_banners
