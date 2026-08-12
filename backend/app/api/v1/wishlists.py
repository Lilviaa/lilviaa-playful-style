from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.api.dependencies import get_current_user_token
from app.db.supabase import get_supabase
from typing import List

router = APIRouter()

class WishlistAddRequest(BaseModel):
    slug: str

@router.get("/")
def get_wishlist(user=Depends(get_current_user_token)):
    """Get the current user's wishlist."""
    sb = get_supabase()
    
    # We join with products to return full details
    res = sb.table("wishlist_items").select(
        "id, product_id, products(id, name, slug, base_price, sale_price, product_images(url), status)"
    ).eq("user_id", user["sub"]).execute()
    
    items = []
    for row in res.data or []:
        p = row.get("products")
        if not p or p.get("status") == "draft":
            continue
            
        images = p.get("product_images") or []
        primary_image = images[0].get("url") if images else ""
        
        items.append({
            "id": p["id"],
            "product_id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "price": p.get("sale_price") if p.get("sale_price") is not None else p.get("base_price"),
            "image": primary_image
        })
        
    return items

@router.post("/")
def add_to_wishlist(req: WishlistAddRequest, user=Depends(get_current_user_token)):
    sb = get_supabase()
    
    # Resolve slug to product_id
    p_res = sb.table("products").select("id").eq("slug", req.slug).execute()
    if not p_res.data:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product_id = p_res.data[0]["id"]
    
    try:
        sb.table("wishlist_items").insert({
            "user_id": user["sub"],
            "product_id": product_id
        }).execute()
    except Exception as e:
        # Ignore unique constraint violations
        if "duplicate key value" not in str(e):
            raise HTTPException(status_code=400, detail="Failed to add to wishlist")
            
    return {"status": "success"}

@router.delete("/{slug}")
def remove_from_wishlist(slug: str, user=Depends(get_current_user_token)):
    sb = get_supabase()
    
    # Resolve slug to product_id
    p_res = sb.table("products").select("id").eq("slug", slug).execute()
    if not p_res.data:
        return {"status": "success"} # Nothing to delete
        
    product_id = p_res.data[0]["id"]
    
    sb.table("wishlist_items").delete().match({
        "user_id": user["sub"],
        "product_id": product_id
    }).execute()
    
    return {"status": "success"}
