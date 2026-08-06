from fastapi import APIRouter, Depends, HTTPException, status, Request
from typing import List
from app.models.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter()

# ──────────────────────────────────────────
# Public Routes
# ──────────────────────────────────────────

@router.get("", response_model=List[CategoryResponse], dependencies=[Depends(PreAuthRateLimit("120/minute"))])
@limiter.limit("120/minute")
def get_categories(request: Request):
    """Fetch all categories, ordered by sort_order."""
    supabase = get_supabase()
    result = supabase.table("categories").select("*").order("sort_order").execute()
    return result.data


# ──────────────────────────────────────────
# Admin Routes
# ──────────────────────────────────────────

@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def create_category(category: CategoryCreate, request: Request):
    """Create a new category (Admin only)."""
    supabase = get_supabase()
    try:
        result = supabase.table("categories").insert(category.model_dump()).execute()
        if not result.data:
            raise AppError("Failed to create category")
        return result.data[0]
    except Exception as e:
        if "categories_slug_key" in str(e):
            raise AppError("A category with this slug already exists", status_code=400)
        raise AppError(f"Error creating category: {str(e)}")

@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_category(category_id: str, updates: CategoryUpdate, request: Request):
    """Update a category (Admin only)."""
    supabase = get_supabase()
    update_data = {k: v for k, v in updates.model_dump(exclude_unset=True).items()}
    if not update_data:
        raise AppError("No fields to update", status_code=400)
        
    try:
        result = supabase.table("categories").update(update_data).eq("id", category_id).execute()
        if not result.data:
            raise AppError("Category not found", status_code=404)
        return result.data[0]
    except Exception as e:
        if "categories_slug_key" in str(e):
            raise AppError("A category with this slug already exists", status_code=400)
        raise AppError(f"Error updating category: {str(e)}")

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def delete_category(category_id: str, request: Request):
    """Delete a category (Admin only). Products linking here will have category_id set to NULL."""
    supabase = get_supabase()
    # Supabase/PostgREST delete does not return the deleted rows by default unless .returning() is called.
    supabase.table("categories").delete().eq("id", category_id).execute()
    return
