from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional, List
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError

router = APIRouter(dependencies=[Depends(require_admin)])

class BannerCreate(BaseModel):
    image_url: str
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

@router.get("/")
def list_banners():
    supabase = get_supabase()
    res = supabase.table("banners").select("*").order("sort_order", desc=False).execute()
    return res.data

@router.post("/")
def create_banner(banner: BannerCreate):
    supabase = get_supabase()
    res = supabase.table("banners").insert(banner.model_dump(exclude_none=True)).execute()
    return res.data[0]

@router.put("/{banner_id}")
def update_banner(banner_id: str, banner: BannerUpdate):
    supabase = get_supabase()
    updates = banner.model_dump(exclude_unset=True)
    if not updates:
        return supabase.table("banners").select("*").eq("id", banner_id).single().execute().data
        
    updates["updated_at"] = "now()"
    res = supabase.table("banners").update(updates).eq("id", banner_id).execute()
    if not res.data:
        raise AppError("Banner not found", status_code=404)
    return res.data[0]

@router.delete("/{banner_id}")
def delete_banner(banner_id: str):
    supabase = get_supabase()
    res = supabase.table("banners").delete().eq("id", banner_id).execute()
    if not res.data:
        raise AppError("Banner not found", status_code=404)
    return {"message": "Deleted"}

@router.post("/reorder")
def reorder_banners(updates: List[BannerReorderRequest]):
    supabase = get_supabase()
    # Ideally batch update, but supabase python client doesn't have upsert multiple simply unless all fields match
    # Do them one by one for now
    for update in updates:
        supabase.table("banners").update({"sort_order": update.sort_order}).eq("id", update.id).execute()
    return {"message": "Reordered"}
