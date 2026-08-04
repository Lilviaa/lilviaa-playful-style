from fastapi import APIRouter, HTTPException, status, Query, Request
from typing import List, Optional
from datetime import datetime, timezone
from app.models.public_product import PublicProductResponse
from app.db.supabase import get_supabase, get_fresh_supabase
from app.core.exceptions import AppError

router = APIRouter()

def map_product(row: dict) -> dict:
    """Map DB row to frontend strict shape"""
    now = datetime.now(timezone.utc)
    
    # 1. Pricing logic
    base_price = float(row.get("base_price", 0))
    sale_price = row.get("sale_price")
    sale_start_str = row.get("sale_start")
    sale_end_str = row.get("sale_end")
    
    is_sale_active = False
    if sale_price is not None and float(sale_price) > 0:
        is_sale_active = True
        if sale_start_str:
            sale_start = datetime.fromisoformat(sale_start_str.replace("Z", "+00:00"))
            if now < sale_start:
                is_sale_active = False
        if sale_end_str:
            sale_end = datetime.fromisoformat(sale_end_str.replace("Z", "+00:00"))
            if now > sale_end:
                is_sale_active = False
                
    if is_sale_active:
        price = float(sale_price)
        compareAt = base_price
    else:
        price = base_price
        compareAt = None

    # 2. Images logic
    images_raw = row.get("product_images", [])
    images_sorted = sorted(images_raw, key=lambda x: x.get("sort_order", 0))
    gallery = [img["url"] for img in images_sorted]
    image = gallery[0] if gallery else ""

    # 3. Variants logic (sizes only)
    variants_raw = row.get("product_variants", [])
    sizes = []
    variants = []
    total_stock = 0
    sku = ""
    for v in variants_raw:
        if v.get("sku") and not sku:
            sku = v["sku"]
        if v.get("size") and v["size"] not in sizes:
            sizes.append(v["size"])
            
        stock = v.get("stock") or 0
        reserved = v.get("reserved_stock") or 0
        available_stock = max(0, stock - reserved)

        variants.append({
            "id": v.get("id"),
            "size": v.get("size"),
            "sku": v.get("sku"),
            "stock": available_stock,
            "price_override": v.get("price_override")
        })
        total_stock += available_stock

    # 4. Category
    category_slug = row.get("category", {}).get("slug", "") if row.get("category") else ""

    result = {
        "id": row.get("id") or "",
        "slug": row.get("slug") or "",
        "name": row.get("name") or "",
        "price": price,
        "image": image,
        "gallery": gallery,
        "sku": sku or "",
        "stock": total_stock,
        "variants": variants,
        "category": category_slug,
        "gender": row.get("gender") or "unisex",
        "ageRange": row.get("age_range") or "",
        "sizes": sizes,
        "description": row.get("description") or "",
        "fabric": row.get("fabric") or "",
        "care": row.get("wash_care") or "",
    }
    
    if compareAt is not None:
        result["compareAt"] = compareAt
    if row.get("tag"):
        result["tag"] = row["tag"]
        
    return result

@router.get("/", response_model=List[PublicProductResponse])
def get_products(
    category: Optional[str] = None,
    sort: Optional[str] = Query(None, description="price_asc, price_desc, newest"),
    q: Optional[str] = Query(None, description="Search term for name and description"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Fetch published products with optional filtering, sorting, search, and pagination."""
    supabase = get_supabase()
    
    # We use inner join on category if filtering, else left join
    select_clause = "*, category:categories!inner(slug), product_images(*), product_variants(*)" if category else "*, category:categories(slug), product_images(*), product_variants(*)"
    
    query = supabase.table("products").select(select_clause).eq("status", "published")
    
    if category:
        query = query.eq("categories.slug", category)
        
    if q:
        query = query.or_(f"name.ilike.%{q}%,description.ilike.%{q}%")
        
    if sort == "newest":
        query = query.order("created_at", desc=True)
        
    query = query.range(offset, offset + limit - 1)
        
    result = query.execute()
    products = [map_product(row) for row in result.data]
    
    # Post-query sorting for price (since price is calculated in Python)
    if sort == "price_asc":
        products.sort(key=lambda x: x["price"])
    elif sort == "price_desc":
        products.sort(key=lambda x: x["price"], reverse=True)
        
    return products

@router.get("/featured", response_model=List[PublicProductResponse])
def get_featured_products():
    """Fetch featured published products (e.g. tag is bestseller or new). Limit to 8."""
    supabase = get_supabase()
    
    query = supabase.table("products").select(
        "*, category:categories(slug), product_images(*), product_variants(*)"
    ).eq("status", "published").in_("tag", ["bestseller", "new"]).order("created_at", desc=True).limit(8)
    
    result = query.execute()
    return [map_product(row) for row in result.data]

@router.get("/{slug}", response_model=PublicProductResponse)
def get_product_by_slug(slug: str, request: Request):
    """Fetch a single published product by slug. Admins can view drafts/archived."""
    supabase = get_supabase()
    
    # Check if admin
    is_admin = False
    auth_header = request.headers.get("Authorization")
    
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        try:
            import firebase_admin.auth as firebase_auth
            decoded_token = firebase_auth.verify_id_token(token)
            email = decoded_token.get('email', '')
            user_data = supabase.table("users").select("role").eq("email", email).execute()
            if user_data.data:
                role = user_data.data[0].get("role")
                if role in ["admin", "owner"]:
                    is_admin = True
        except Exception:
            pass
    elif request.cookies.get("access_token"):
        token = request.cookies.get("access_token")
        try:
            fresh = get_fresh_supabase()
            user_response = fresh.auth.get_user(token)
            if user_response and user_response.user:
                user_data = supabase.table("users").select("role").eq("id", str(user_response.user.id)).single().execute()
                role = user_data.data.get("role") if user_data.data else "customer"
                if role in ["admin", "owner"]:
                    is_admin = True
        except Exception:
            pass

    query = supabase.table("products").select(
        "*, category:categories(slug), product_images(*), product_variants(*)"
    ).eq("slug", slug)
    
    if not is_admin:
        query = query.eq("status", "published")
        
    result = query.execute()
    
    if not result.data:
        raise AppError("Product not found", status_code=404)
        
    return map_product(result.data[0])
