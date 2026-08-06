from fastapi import APIRouter, Request, Depends
from app.db.supabase import get_supabase
from app.models.settings import CompanySettingsResponse
from fastapi import HTTPException
from app.core.limiter import limiter, PreAuthRateLimit

router = APIRouter()

@router.get("/hero-slides", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_public_hero_slides(request: Request):
    supabase = get_supabase()
    res = supabase.table("hero_slides").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.get("/category-tiles", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_public_category_tiles(request: Request):
    supabase = get_supabase()
    res = supabase.table("category_tiles").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.get("/company-settings", response_model=CompanySettingsResponse, dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_company_settings(request: Request):
    """Get the global company settings"""
    supabase = get_supabase()
    res = supabase.table("company_settings").select("*").limit(1).execute()
    
    if not res.data:
        raise HTTPException(status_code=404, detail="Company settings not initialized")
        
    return res.data[0]

@router.get("/featured-products", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_public_featured_products(request: Request):
    supabase = get_supabase()
    res = supabase.table("featured_products").select("*, products(*)").order("sort_order", desc=False).execute()
    return res.data

@router.get("/sections/{section_key}", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_public_cms_section(section_key: str, request: Request):
    supabase = get_supabase()
    res = supabase.table("cms_sections").select("*").eq("section_key", section_key).execute()
    if not res.data:
        return None
    return res.data[0]

@router.get("/philosophy-cards", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_public_philosophy_cards(request: Request):
    supabase = get_supabase()
    res = supabase.table("philosophy_cards").select("*").order("sort_order", desc=False).execute()
    return res.data
