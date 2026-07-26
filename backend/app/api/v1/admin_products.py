from fastapi import APIRouter, Depends, status
from typing import List
from app.models.product import (
    ProductCreate, ProductUpdate, ProductResponse,
    ProductVariantCreate, ProductVariantUpdate, ProductVariantResponse,
    ProductImageResponse, R2UploadRequest, R2UploadResponse, R2UploadConfirmRequest
)
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError
from app.services.r2_service import r2_service

router = APIRouter(dependencies=[Depends(require_admin)])

# ──────────────────────────────────────────
# Products (Admin)
# ──────────────────────────────────────────

@router.get("/", response_model=List[ProductResponse])
def get_all_products():
    """Admin: Fetch all products (draft, published, archived)."""
    supabase = get_supabase()
    result = supabase.table("products").select("*, category:categories(name, slug), images:product_images(*), variants:product_variants(*)").execute()
    for product in result.data:
        if product.get("images"):
            product["images"].sort(key=lambda x: x.get("sort_order", 0))
    return result.data

@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(product: ProductCreate):
    """Admin: Create a new product."""
    supabase = get_supabase()
    try:
        result = supabase.table("products").insert(product.model_dump(mode='json')).execute()
        return result.data[0]
    except Exception as e:
        print(f"Product create error: {repr(e)}")
        if "products_slug_key" in str(e):
            raise AppError("A product with this slug already exists", status_code=400)
        raise AppError(f"Error creating product: {str(e)}")

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(product_id: str, updates: ProductUpdate):
    """Admin: Update a product."""
    supabase = get_supabase()
    update_data = {k: v for k, v in updates.model_dump(mode='json', exclude_unset=True).items()}
    if not update_data:
        raise AppError("No fields to update", status_code=400)
        
    try:
        result = supabase.table("products").update(update_data).eq("id", product_id).execute()
        if not result.data:
            raise AppError("Product not found", status_code=404)
        return result.data[0]
    except Exception as e:
        if "products_slug_key" in str(e):
            raise AppError("A product with this slug already exists", status_code=400)
        raise AppError(f"Error updating product: {str(e)}")

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: str):
    """Admin: Hard delete a product. Used primarily for rollback if variant/image creation fails."""
    supabase = get_supabase()
    supabase.table("products").delete().eq("id", product_id).execute()
    return

# ──────────────────────────────────────────
# Variants (Admin)
# ──────────────────────────────────────────

@router.post("/{product_id}/variants", response_model=ProductVariantResponse, status_code=status.HTTP_201_CREATED)
def add_variant(product_id: str, variant: ProductVariantCreate):
    """Admin: Add a variant to a product."""
    supabase = get_supabase()
    data = variant.model_dump(mode='json')
    data["product_id"] = product_id
    try:
        result = supabase.table("product_variants").insert(data).execute()
        return result.data[0]
    except Exception as e:
        if "product_variants_sku_key" in str(e):
            raise AppError("A variant with this SKU already exists", status_code=400)
        raise AppError(f"Error adding variant: {str(e)}")

@router.put("/variants/{variant_id}", response_model=ProductVariantResponse)
def update_variant(variant_id: str, updates: ProductVariantUpdate):
    """Admin: Update a variant."""
    supabase = get_supabase()
    update_data = {k: v for k, v in updates.model_dump(mode='json', exclude_unset=True).items()}
    try:
        result = supabase.table("product_variants").update(update_data).eq("id", variant_id).execute()
        if not result.data:
            raise AppError("Variant not found", status_code=404)
        return result.data[0]
    except Exception as e:
        if "product_variants_sku_key" in str(e):
            raise AppError("A variant with this SKU already exists", status_code=400)
        raise AppError(f"Error updating variant: {str(e)}")

@router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(variant_id: str):
    """Admin: Delete a variant."""
    supabase = get_supabase()
    supabase.table("product_variants").delete().eq("id", variant_id).execute()
    return

# ──────────────────────────────────────────
# Images (Admin & R2 Uploads)
# ──────────────────────────────────────────

@router.post("/upload/request-url", response_model=R2UploadResponse)
def request_upload_url(req: R2UploadRequest):
    """Admin: Request a backend URL to upload and compress a product image."""
    return r2_service.generate_presigned_url(req.filename, req.content_type)

from fastapi import Request
@router.put("/upload/direct/products/{filename}")
async def direct_upload(filename: str, request: Request):
    """Admin: Direct upload endpoint for image compression before Supabase."""
    file_bytes = await request.body()
    r2_service.process_and_upload_image(file_bytes, f"products/{filename}")
    return {"status": "ok"}

@router.post("/upload/confirm", response_model=ProductImageResponse)
def confirm_upload(req: R2UploadConfirmRequest):
    """Admin: Verify the image was uploaded to R2 and add it to the product_images table."""
    # 1. Verify object exists in R2
    if not r2_service.verify_object_exists(req.file_path):
        raise AppError("Image not found in R2. Upload must have failed.", status_code=400)
        
    # 2. Insert into DB
    public_url = f"{r2_service.public_url_base}/{req.file_path}"
    supabase = get_supabase()
    
    result = supabase.table("product_images").insert({
        "product_id": req.product_id,
        "url": public_url,
        "sort_order": req.sort_order
    }).execute()
    
    return result.data[0]

@router.delete("/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_image(image_id: str):
    """Admin: Delete an image from the database."""
    # MVP Note: This only deletes the DB row. In a full system, you would also 
    # delete the object from R2 via s3_client.delete_object.
    supabase = get_supabase()
    supabase.table("product_images").delete().eq("id", image_id).execute()
    return
