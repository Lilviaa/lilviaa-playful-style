from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.models.category import CategoryCreate, CategoryUpdate, CategoryResponse
from app.db.supabase import get_supabase
from app.api.dependencies import require_admin
from app.core.exceptions import AppError

router = APIRouter()

# ──────────────────────────────────────────
# Public Routes
# ──────────────────────────────────────────

@router.get("/", response_model=List[CategoryResponse])
def get_categories():
    """Fetch all categories, ordered by sort_order."""
    supabase = get_supabase()
    result = supabase.table("categories").select("*").order("sort_order").execute()
    return result.data


# ──────────────────────────────────────────
# Admin Routes
# ──────────────────────────────────────────

@router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_category(category: CategoryCreate):
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

@router.put("/{category_id}", response_model=CategoryResponse, dependencies=[Depends(require_admin)])
def update_category(category_id: str, updates: CategoryUpdate):
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

@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
def delete_category(category_id: str):
    """Delete a category (Admin only). Products linking here will have category_id set to NULL."""
    supabase = get_supabase()
    # Supabase/PostgREST delete does not return the deleted rows by default unless .returning() is called.
    supabase.table("categories").delete().eq("id", category_id).execute()
    return
