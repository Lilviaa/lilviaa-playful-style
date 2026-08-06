from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import Optional, List
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter(dependencies=[Depends(require_admin)])

class BannerCreate(BaseModel):
    image_url: Optional[str] = None
    type: Optional[str] = "hero"
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cta_text: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = 0
    active: Optional[bool] = True
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class BannerUpdate(BaseModel):
    image_url: Optional[str] = None
    type: Optional[str] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    cta_text: Optional[str] = None
    link_url: Optional[str] = None
    sort_order: Optional[int] = None
    active: Optional[bool] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None

class BannerReorderRequest(BaseModel):
    id: str
    sort_order: int

@router.get("/", dependencies=[Depends(PreAuthRateLimit("60/minute"))])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_banners(request: Request):
    supabase = get_supabase()
    res = supabase.table("banners").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.post("/", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def create_banner(banner: BannerCreate, request: Request):
    supabase = get_supabase()
    if banner.image_url is None:
        banner.image_url = ""
    res = supabase.table("banners").insert(banner.model_dump(exclude_none=True)).execute()
    return res.data[0]

@router.put("/{banner_id}", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_banner(banner_id: str, banner: BannerUpdate, request: Request):
    supabase = get_supabase()
    updates = banner.model_dump(exclude_unset=True)
    if "image_url" in updates and updates["image_url"] is None:
        updates["image_url"] = ""
    if not updates:
        return supabase.table("banners").select("*").eq("id", banner_id).single().execute().data
        
    updates["updated_at"] = "now()"
    res = supabase.table("banners").update(updates).eq("id", banner_id).execute()
    if not res.data:
        raise AppError("Banner not found", status_code=404)
    return res.data[0]

@router.delete("/{banner_id}", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def delete_banner(banner_id: str, request: Request):
    supabase = get_supabase()
    res = supabase.table("banners").delete().eq("id", banner_id).execute()
    if not res.data:
        raise AppError("Banner not found", status_code=404)
    return {"message": "Deleted"}

@router.post("/reorder", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def reorder_banners(updates: List[BannerReorderRequest], request: Request):
    supabase = get_supabase()
    # Ideally batch update, but supabase python client doesn't have upsert multiple simply unless all fields match
    # Do them one by one for now
    for update in updates:
        supabase.table("banners").update({"sort_order": update.sort_order}).eq("id", update.id).execute()
    return {"message": "Reordered"}
