from fastapi import APIRouter, Depends, Query, Request
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.api.dependencies import get_current_user_token
from app.db.supabase import get_supabase
from app.core.exceptions import AppError

router = APIRouter()

class ReviewCreate(BaseModel):
    product_id: str
    rating: int
    title: Optional[str] = None
    text: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    product_id: str
    user_id: str
    rating: int
    title: Optional[str]
    text: Optional[str]
    is_featured: bool
    created_at: str
    reviewer_name: str
    verified_purchase: bool

@router.get("/featured")
def get_featured_reviews():
    """Fetch the top 3 featured and approved reviews for the landing page."""
    supabase = get_supabase()
    
    # We join users to get the name, and check order_item_id for verified purchase
    res = supabase.table("reviews").select(
        "id, product_id, user_id, rating, title, text, is_featured, created_at, order_item_id, users(email, user_profiles(full_name))"
    ).eq("status", "approved").eq("is_featured", True).eq("rating", 5).order("created_at", desc=True).limit(3).execute()
    
    out = []
    for row in res.data:
        users_data = row.get("users") or {}
        user_profiles = users_data.get("user_profiles") or []
        full_name = "Verified Customer"
        if isinstance(user_profiles, list) and len(user_profiles) > 0:
            full_name = user_profiles[0].get("full_name") or "Verified Customer"
        elif isinstance(user_profiles, dict):
            full_name = user_profiles.get("full_name") or "Verified Customer"
            
        out.append({
            "id": row["id"],
            "product_id": row["product_id"],
            "user_id": row["user_id"],
            "rating": row["rating"],
            "title": row["title"],
            "text": row["text"],
            "is_featured": row["is_featured"],
            "created_at": row["created_at"],
            "reviewer_name": full_name,
            "verified_purchase": bool(row.get("order_item_id"))
        })
    return out

@router.get("/product/{product_id}")
def get_product_reviews(product_id: str, limit: int = Query(10, ge=1, le=50), offset: int = Query(0, ge=0)):
    """Fetch approved reviews for a specific product."""
    supabase = get_supabase()
    
    res = supabase.table("reviews").select(
        "id, product_id, user_id, rating, title, text, is_featured, created_at, order_item_id, users(email, user_profiles(full_name))",
        count="exact"
    ).eq("product_id", product_id).eq("status", "approved").order("created_at", desc=True).range(offset, offset + limit - 1).execute()
    
    out = []
    for row in res.data:
        users_data = row.get("users") or {}
        user_profiles = users_data.get("user_profiles") or []
        full_name = "Verified Customer"
        if isinstance(user_profiles, list) and len(user_profiles) > 0:
            full_name = user_profiles[0].get("full_name") or "Verified Customer"
        elif isinstance(user_profiles, dict):
            full_name = user_profiles.get("full_name") or "Verified Customer"
            
        out.append({
            "id": row["id"],
            "product_id": row["product_id"],
            "user_id": row["user_id"],
            "rating": row["rating"],
            "title": row["title"],
            "text": row["text"],
            "is_featured": row["is_featured"],
            "created_at": row["created_at"],
            "reviewer_name": full_name,
            "verified_purchase": bool(row.get("order_item_id"))
        })
    return {
        "data": out,
        "count": res.count
    }

@router.post("/", status_code=201)
def create_review(review: ReviewCreate, user: dict = Depends(get_current_user_token)):
    """Create a new review. Will auto-verify if the user has purchased the item."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    if review.rating < 1 or review.rating > 5:
        raise AppError("Rating must be between 1 and 5", status_code=400)
        
    # Check if user already reviewed this product
    existing = supabase.table("reviews").select("id").eq("user_id", user_id).eq("product_id", review.product_id).execute()
    if existing.data:
        raise AppError("You have already reviewed this product.", status_code=400)
        
    # Auto-verify purchase
    # Check if the user has an order item for this product variant
    # We join order_items -> product_variants to get the product_id
    purchases = supabase.table("order_items").select(
        "id, orders!inner(user_id), product_variants!inner(product_id)"
    ).eq("orders.user_id", user_id).eq("product_variants.product_id", review.product_id).limit(1).execute()
    
    order_item_id = purchases.data[0]["id"] if purchases.data else None
    
    new_review = {
        "product_id": review.product_id,
        "user_id": user_id,
        "order_item_id": order_item_id,
        "rating": review.rating,
        "title": review.title,
        "text": review.text,
        "status": "pending"
    }
    
    try:
        res = supabase.table("reviews").insert(new_review).execute()
        return res.data[0]
    except Exception as e:
        raise AppError(f"Failed to submit review: {str(e)}", status_code=400)

@router.delete("/{review_id}")
def delete_review(review_id: str, user: dict = Depends(get_current_user_token)):
    """Delete own review."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    existing = supabase.table("reviews").select("user_id").eq("id", review_id).single().execute()
    if not existing.data:
        raise AppError("Review not found", status_code=404)
        
    if existing.data["user_id"] != user_id:
        raise AppError("Not authorized to delete this review", status_code=403)
        
    supabase.table("reviews").delete().eq("id", review_id).execute()
    return {"message": "Review deleted"}
