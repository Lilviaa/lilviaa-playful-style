from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError
from app.models.settings import CompanySettingsResponse, CompanySettingsUpdate
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter()

# -----------------
# Upload Endpoints
# -----------------
from fastapi import Request
from app.services.storage_service import storage_service

class UploadRequest(BaseModel):
    filename: str
    content_type: str

class UploadResponse(BaseModel):
    upload_url: str
    file_path: str
    public_url: str

@router.post("/upload/request-url", response_model=UploadResponse, dependencies=[Depends(PreAuthRateLimit("15/minute")), Depends(require_admin)])
@limiter.limit("15/minute", key_func=get_admin_id)
def request_upload_url(req: UploadRequest, request: Request):
    return storage_service.generate_presigned_url(req.filename, req.content_type, folder="cms")

@router.put("/upload/direct/cms/{filename}", dependencies=[Depends(PreAuthRateLimit("15/minute")), Depends(require_admin)])
@limiter.limit("15/minute", key_func=get_admin_id)
async def direct_upload(filename: str, request: Request):
    file_bytes = await request.body()
    storage_service.process_and_upload_image(file_bytes, f"cms/{filename}")
    return {"status": "ok"}

# -----------------
# Hero Slides
# -----------------
class HeroSlideBase(BaseModel):
    image_url: str
    sort_order: Optional[int] = 0

class HeroSlideUpdate(HeroSlideBase):
    id: str

@router.get("/hero-slides", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_hero_slides(request: Request):
    supabase = get_supabase()
    res = supabase.table("hero_slides").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.put("/hero-slides", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_hero_slides(slides: List[HeroSlideUpdate], request: Request):
    supabase = get_supabase()
    supabase.table("hero_slides").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute() # delete all
    
    if not slides:
        return []
    
    records = [s.model_dump(exclude={"id"}) for s in slides]
    res = supabase.table("hero_slides").insert(records).execute()
    return res.data

# -----------------
# Category Tiles
# -----------------
class CategoryTileBase(BaseModel):
    image_url: str
    label: str
    link: str
    sort_order: Optional[int] = 0

class CategoryTileUpdate(CategoryTileBase):
    id: str

@router.get("/category-tiles", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_category_tiles(request: Request):
    supabase = get_supabase()
    res = supabase.table("category_tiles").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.put("/category-tiles", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_category_tiles(tiles: List[CategoryTileUpdate], request: Request):
    supabase = get_supabase()
    supabase.table("category_tiles").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    if not tiles:
        return []
        
    records = [t.model_dump(exclude={"id"}) for t in tiles]
    res = supabase.table("category_tiles").insert(records).execute()
    return res.data

# -----------------
# Featured Products
# -----------------
class FeaturedProductBase(BaseModel):
    product_id: str
    sort_order: Optional[int] = 0

class FeaturedProductUpdate(FeaturedProductBase):
    id: str

@router.get("/featured-products", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_featured_products(request: Request):
    supabase = get_supabase()
    res = supabase.table("featured_products").select("*, products(*)").order("sort_order", desc=False).execute()
    return res.data

@router.put("/featured-products", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_featured_products(products: List[FeaturedProductUpdate], request: Request):
    supabase = get_supabase()
    supabase.table("featured_products").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    if not products:
        return []
        
    records = [p.model_dump(exclude={"id"}) for p in products]
    res = supabase.table("featured_products").insert(records).execute()
    return res.data

# -----------------
# CMS Sections
# -----------------
class CmsSectionUpdate(BaseModel):
    title: Optional[str] = None
    body: Optional[str] = None
    image_url: Optional[str] = None
    secondary_image_url: Optional[str] = None

@router.get("/sections/{section_key}", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_cms_section(section_key: str, request: Request):
    supabase = get_supabase()
    res = supabase.table("cms_sections").select("*").eq("section_key", section_key).execute()
    if not res.data:
        return None
    return res.data[0]

@router.put("/sections/{section_key}", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_cms_section(section_key: str, section: CmsSectionUpdate, request: Request):
    supabase = get_supabase()
    
    existing = supabase.table("cms_sections").select("*").eq("section_key", section_key).execute()
    updates = section.model_dump(exclude_unset=True)
    
    if existing.data:
        res = supabase.table("cms_sections").update(updates).eq("section_key", section_key).execute()
        return res.data[0]
    else:
        updates["section_key"] = section_key
        res = supabase.table("cms_sections").insert(updates).execute()
        return res.data[0]

# -----------------
# Philosophy Cards
# -----------------
class PhilosophyCardBase(BaseModel):
    icon: str
    title: str
    description: Optional[str] = None
    sort_order: Optional[int] = 0

class PhilosophyCardUpdate(PhilosophyCardBase):
    id: str

@router.get("/philosophy-cards", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_philosophy_cards(request: Request):
    supabase = get_supabase()
    res = supabase.table("philosophy_cards").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.put("/philosophy-cards", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_philosophy_cards(cards: List[PhilosophyCardUpdate], request: Request):
    supabase = get_supabase()
    supabase.table("philosophy_cards").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
    
    if not cards:
        return []
        
    records = [c.model_dump(exclude={"id"}) for c in cards]
    res = supabase.table("philosophy_cards").insert(records).execute()
    return res.data

# -----------------
# Company Settings
# -----------------

@router.put("/company-settings", response_model=CompanySettingsResponse, dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_company_settings(updates: CompanySettingsUpdate, request: Request):
    """Update global company settings"""
    supabase = get_supabase()
    
    update_data = updates.model_dump(exclude_unset=True)
    # Temporary fix: pop maintenance columns if they don't exist in DB schema yet
    update_data.pop("is_maintenance_mode", None)
    update_data.pop("maintenance_end_time", None)
    
    res = supabase.table("company_settings") \
        .update(update_data) \
        .eq("id", "00000000-0000-0000-0000-000000000001") \
        .execute()
        
    if not res.data:
        raise AppError("Failed to update company settings", status_code=500)
        
    # Inject the popped values back into response so the UI doesn't crash
    response_data = res.data[0]
    response_data["is_maintenance_mode"] = updates.is_maintenance_mode
    response_data["maintenance_end_time"] = updates.maintenance_end_time
    
    return response_data
