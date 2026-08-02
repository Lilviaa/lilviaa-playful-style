from fastapi import APIRouter
from app.db.supabase import get_supabase

router = APIRouter()

@router.get("/hero-slides")
def get_public_hero_slides():
    supabase = get_supabase()
    res = supabase.table("hero_slides").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.get("/category-tiles")
def get_public_category_tiles():
    supabase = get_supabase()
    res = supabase.table("category_tiles").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.get("/featured-products")
def get_public_featured_products():
    supabase = get_supabase()
    res = supabase.table("featured_products").select("*, products(*)").order("sort_order", desc=False).execute()
    return res.data

@router.get("/sections/{section_key}")
def get_public_cms_section(section_key: str):
    supabase = get_supabase()
    res = supabase.table("cms_sections").select("*").eq("section_key", section_key).execute()
    if not res.data:
        return None
    return res.data[0]

@router.get("/philosophy-cards")
def get_public_philosophy_cards():
    supabase = get_supabase()
    res = supabase.table("philosophy_cards").select("*").order("sort_order", desc=False).execute()
    return res.data
