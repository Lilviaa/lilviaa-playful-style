from fastapi import APIRouter, Depends, Query, Request
from typing import List, Optional
from pydantic import BaseModel
from app.api.dependencies import get_current_user_token
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError

router = APIRouter()

def require_admin(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise AppError("Not authenticated", status_code=401)
    
    fresh = get_fresh_supabase()
    user_response = fresh.auth.get_user(token)
    if not user_response or not user_response.user:
        raise AppError("Invalid session", status_code=401)
        
    supabase = get_supabase()
    user_data = supabase.table("users").select("role").eq("id", str(user_response.user.id)).single().execute()
    role = user_data.data.get("role") if user_data.data else "customer"
    
    if role not in ["admin", "owner"]:
        raise AppError("Admin privileges required", status_code=403)
        
    return user_response.user.id

class ReviewUpdateStatus(BaseModel):
    status: str

class ReviewUpdateFeatured(BaseModel):
    featured: bool
    
class ReviewUpdateText(BaseModel):
    text: str

@router.get("/")
def get_all_reviews(
    status: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    admin_id: str = Depends(require_admin)
):
    """Fetch all reviews for admin moderation."""
    supabase = get_supabase()
    
    query = supabase.table("reviews").select(
        "id, product_id, user_id, rating, title, text, status, is_featured, created_at, order_item_id, users(email, user_profiles(full_name)), products(name, product_images(url))",
        count="exact"
    ).order("created_at", desc=True)
    
    if status and status != "all":
        query = query.eq("status", status)
        
    res = query.range(offset, offset + limit - 1).execute()
    
    out = []
    for row in res.data:
        # Get first product image for admin thumbnail
        prod = row.get("products") or {}
        images = prod.get("product_images") or []
        image_url = images[0]["url"] if images else ""
        
        # Safely extract full_name from users -> user_profiles
        users_data = row.get("users") or {}
        user_profiles = users_data.get("user_profiles") or []
        full_name = "Unknown Customer"
        if isinstance(user_profiles, list) and len(user_profiles) > 0:
            full_name = user_profiles[0].get("full_name") or "Unknown Customer"
        elif isinstance(user_profiles, dict):
            full_name = user_profiles.get("full_name") or "Unknown Customer"
            
        out.append({
            "id": row["id"],
            "product_id": row["product_id"],
            "product_name": prod.get("name") or "Unknown Product",
            "product_image": image_url,
            "customer_id": row["user_id"],
            "customer_name": full_name,
            "order_item_id": row["order_item_id"],
            "rating": row["rating"],
            "text": row["text"] or "",
            "status": row["status"],
            "is_featured": row["is_featured"],
            "created_at": row["created_at"],
        })
    return out

@router.get("/pending-count")
def get_pending_count(admin_id: str = Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("reviews").select("id", count="exact").eq("status", "pending").execute()
    return {"count": res.count or 0}

@router.patch("/{review_id}/status")
def update_review_status(review_id: str, payload: ReviewUpdateStatus, admin_id: str = Depends(require_admin)):
    if payload.status not in ["pending", "approved", "rejected"]:
        raise AppError("Invalid status", status_code=400)
        
    supabase = get_supabase()
    res = supabase.table("reviews").update({"status": payload.status}).eq("id", review_id).execute()
    if not res.data:
        raise AppError("Review not found", status_code=404)
    return {"message": "Status updated", "status": res.data[0]["status"]}

@router.patch("/{review_id}/feature")
def update_review_feature(review_id: str, payload: ReviewUpdateFeatured, admin_id: str = Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("reviews").update({"is_featured": payload.featured}).eq("id", review_id).execute()
    if not res.data:
        raise AppError("Review not found", status_code=404)
    return {"message": "Feature updated", "is_featured": res.data[0]["is_featured"]}

@router.patch("/{review_id}/text")
def update_review_text(review_id: str, payload: ReviewUpdateText, admin_id: str = Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("reviews").update({"text": payload.text}).eq("id", review_id).execute()
    if not res.data:
        raise AppError("Review not found", status_code=404)
    return {"message": "Text updated"}

@router.delete("/{review_id}")
def admin_delete_review(review_id: str, admin_id: str = Depends(require_admin)):
    supabase = get_supabase()
    res = supabase.table("reviews").delete().eq("id", review_id).execute()
    return {"message": "Review deleted"}
