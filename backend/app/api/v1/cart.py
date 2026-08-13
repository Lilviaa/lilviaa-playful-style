from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel
from typing import List
from app.db.supabase import get_supabase
from app.api.dependencies import get_current_user_token
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_user_id

router = APIRouter()

class CartItemCreate(BaseModel):
    product_variant_id: str
    quantity: int

class CartItemUpdate(BaseModel):
    quantity: int

class MergeCartRequest(BaseModel):
    items: List[CartItemCreate]

@router.get("", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def get_cart(request: Request, user: dict = Depends(get_current_user_token)):
    """Fetch the authenticated user's cart."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    # We need to fetch cart items along with product variant and product details
    # Supabase allows joins if foreign keys are set up properly
    res = supabase.table("cart_items") \
        .select("*, product_variants(*, products(*, product_images(*)))") \
        .eq("user_id", user_id) \
        .execute()
        
    return res.data

@router.post("", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def add_to_cart(item: CartItemCreate, request: Request, user: dict = Depends(get_current_user_token)):
    """Add an item to the cart or increment quantity."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    # 1. Fetch variant to check stock
    variant_res = supabase.table("product_variants").select("stock, products(name)").eq("id", item.product_variant_id).execute()
    if not variant_res.data:
        raise AppError("Product variant not found", status_code=404)
        
    variant = variant_res.data[0]
    stock = variant["stock"]
    
    # 2. Check if item already in cart
    existing_res = supabase.table("cart_items").select("*").eq("user_id", user_id).eq("product_variant_id", item.product_variant_id).execute()
    
    current_qty = 0
    if existing_res.data:
        current_qty = existing_res.data[0]["quantity"]
        
    new_qty = current_qty + item.quantity
    
    # 3. Stock validation
    if new_qty > stock:
        # Cap it to available stock and raise an error
        raise AppError(f"Only {stock} in stock for this item.", status_code=400)
        
    # 4. Upsert (using standard update/insert)
    if existing_res.data:
        res = supabase.table("cart_items") \
            .update({"quantity": new_qty}) \
            .eq("id", existing_res.data[0]["id"]) \
            .execute()
    else:
        res = supabase.table("cart_items") \
            .insert({
                "user_id": user_id,
                "product_variant_id": item.product_variant_id,
                "quantity": new_qty
            }) \
            .execute()
            
    return {"success": True, "data": res.data[0]}

@router.put("/{product_variant_id}", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def update_cart_item(product_variant_id: str, body: CartItemUpdate, request: Request, user: dict = Depends(get_current_user_token)):
    """Update quantity of a cart item."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    if body.quantity <= 0:
        # Just delete it if qty <= 0
        supabase.table("cart_items").delete().eq("user_id", user_id).eq("product_variant_id", product_variant_id).execute()
        return {"success": True, "action": "deleted"}
        
    # 1. Check stock
    variant_res = supabase.table("product_variants").select("stock").eq("id", product_variant_id).execute()
    if not variant_res.data:
        raise AppError("Product variant not found", status_code=404)
        
    stock = variant_res.data[0]["stock"]
    
    if body.quantity > stock:
        raise AppError(f"Only {stock} in stock for this item.", status_code=400)
        
    # 2. Update
    res = supabase.table("cart_items") \
        .update({"quantity": body.quantity}) \
        .eq("user_id", user_id) \
        .eq("product_variant_id", product_variant_id) \
        .execute()
        
    if not res.data:
        raise AppError("Item not found in cart", status_code=404)
        
    return {"success": True, "data": res.data[0]}

@router.delete("/{product_variant_id}", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def remove_from_cart(product_variant_id: str, request: Request, user: dict = Depends(get_current_user_token)):
    """Remove item from cart."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    res = supabase.table("cart_items") \
        .delete() \
        .eq("user_id", user_id) \
        .eq("product_variant_id", product_variant_id) \
        .execute()
        
    return {"success": True}

@router.post("/merge", dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("60/minute", key_func=get_user_id)
def merge_cart(body: MergeCartRequest, request: Request, user: dict = Depends(get_current_user_token)):
    """Merge guest cart with user cart upon login."""
    supabase = get_supabase()
    user_id = user["sub"]
    
    if not body.items:
        return {"success": True, "message": "Nothing to merge"}
        
    # Fetch existing cart items to combine quantities
    existing_res = supabase.table("cart_items").select("*").eq("user_id", user_id).execute()
    existing_map = {item["product_variant_id"]: item for item in existing_res.data}
    
    # Fetch stock for all incoming items
    variant_ids = [item.product_variant_id for item in body.items]
    variants_res = supabase.table("product_variants").select("id, stock").in_("id", variant_ids).execute()
    stock_map = {v["id"]: v["stock"] for v in variants_res.data}
    
    adjustments_made = False
    
    for item in body.items:
        variant_id = item.product_variant_id
        stock = stock_map.get(variant_id, 0)
        
        current_qty = existing_map.get(variant_id, {}).get("quantity", 0)
        requested_qty = current_qty + item.quantity
        
        # Validate and cap stock
        final_qty = requested_qty
        if final_qty > stock:
            final_qty = stock
            adjustments_made = True
            
        if final_qty <= 0:
            continue
            
        if variant_id in existing_map:
            supabase.table("cart_items") \
                .update({"quantity": final_qty}) \
                .eq("id", existing_map[variant_id]["id"]) \
                .execute()
        else:
            supabase.table("cart_items") \
                .insert({
                    "user_id": user_id,
                    "product_variant_id": variant_id,
                    "quantity": final_qty
                }) \
                .execute()
                
    msg = "Cart merged successfully"
    if adjustments_made:
        msg = "Cart merged, but some quantities were adjusted due to limited stock."
        
    return {"success": True, "message": msg}
