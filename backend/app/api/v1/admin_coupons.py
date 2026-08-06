from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime, timezone
from uuid import UUID
from app.api.dependencies import require_admin, require_role
from app.db.supabase import get_supabase
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

# Coupons management is owner-only per frontend UI
require_owner = require_role(["owner"])
router = APIRouter(dependencies=[Depends(require_owner)])


class CouponCreate(BaseModel):
    code: str
    type: str  # flat, percent, free_shipping
    value: float = 0
    max_discount_cap: Optional[float] = None
    min_cart_value: float = 0
    usage_limit_total: Optional[int] = None
    usage_limit_per_customer: Optional[int] = None
    scope: str = "store_wide"
    scope_ids: Optional[List[str]] = None
    start_date: str
    end_date: str
    active: bool = True

    @field_validator("code")
    def sanitize_code(cls, v):
        return v.upper().strip()


class CouponUpdate(BaseModel):
    code: Optional[str] = None
    type: Optional[str] = None
    value: Optional[float] = None
    max_discount_cap: Optional[float] = None
    min_cart_value: Optional[float] = None
    usage_limit_total: Optional[int] = None
    usage_limit_per_customer: Optional[int] = None
    scope: Optional[str] = None
    scope_ids: Optional[List[str]] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    active: Optional[bool] = None

    @field_validator("code")
    def sanitize_code(cls, v):
        return v.upper().strip() if v else v


@router.get("/", dependencies=[Depends(PreAuthRateLimit("60/minute"))])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_coupons(request: Request):
    """List all coupons with usage stats."""
    supabase = get_supabase()

    coupons_res = supabase.table("coupons") \
        .select("*") \
        .order("created_at", desc=True) \
        .execute()

    coupons = coupons_res.data or []

    # Get usage counts per coupon
    usages_res = supabase.table("coupon_usages") \
        .select("coupon_id, discount_applied") \
        .execute()

    usage_stats: dict = {}
    for u in (usages_res.data or []):
        cid = u["coupon_id"]
        if cid not in usage_stats:
            usage_stats[cid] = {"times_used": 0, "total_discount_given": 0.0}
        usage_stats[cid]["times_used"] += 1
        usage_stats[cid]["total_discount_given"] += float(u["discount_applied"])

    result = []
    for c in coupons:
        stats = usage_stats.get(c["id"], {"times_used": 0, "total_discount_given": 0.0})
        result.append({
            **c,
            "times_used": stats["times_used"],
            "total_discount_given": stats["total_discount_given"],
        })

    return result


@router.get("/{coupon_id}", dependencies=[Depends(PreAuthRateLimit("60/minute"))])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_coupon(coupon_id: UUID, request: Request):
    """Get a single coupon with usage stats."""
    supabase = get_supabase()

    coupon_res = supabase.table("coupons") \
        .select("*") \
        .eq("id", str(coupon_id)) \
        .execute()

    if not coupon_res.data:
        raise AppError("Coupon not found", status_code=404)

    coupon = coupon_res.data[0]

    # Usage stats
    usages_res = supabase.table("coupon_usages") \
        .select("*") \
        .eq("coupon_id", str(coupon_id)) \
        .order("created_at", desc=True) \
        .execute()

    usages = usages_res.data or []
    times_used = len(usages)
    total_discount = sum(float(u["discount_applied"]) for u in usages)

    return {
        **coupon,
        "times_used": times_used,
        "total_discount_given": total_discount,
    }


@router.get("/{coupon_id}/usages", dependencies=[Depends(PreAuthRateLimit("60/minute"))])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_coupon_usages(coupon_id: UUID, request: Request):
    """Get usage history for a coupon."""
    supabase = get_supabase()

    usages_res = supabase.table("coupon_usages") \
        .select("*, users(email), orders(id)") \
        .eq("coupon_id", str(coupon_id)) \
        .order("created_at", desc=True) \
        .execute()

    # Get coupon code for display
    coupon_res = supabase.table("coupons").select("code").eq("id", str(coupon_id)).execute()
    coupon_code = coupon_res.data[0]["code"] if coupon_res.data else ""

    result = []
    for u in (usages_res.data or []):
        user_email = ""
        if u.get("users"):
            user_email = u["users"].get("email", "")

        result.append({
            "id": u["id"],
            "coupon_id": u["coupon_id"],
            "coupon_code": coupon_code,
            "customer_name": user_email or "Guest",
            "order_id": u["order_id"],
            "discount_applied": float(u["discount_applied"]),
            "used_at": u["created_at"],
        })

    return result


@router.post("/", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def create_coupon(body: CouponCreate, request: Request):
    """Create a new coupon."""
    supabase = get_supabase()

    valid_types = ("flat", "percent", "free_shipping")
    if body.type not in valid_types:
        raise AppError(f"Invalid coupon type. Must be one of: {', '.join(valid_types)}", status_code=400)

    valid_scopes = ("store_wide", "category", "product")
    if body.scope not in valid_scopes:
        raise AppError(f"Invalid scope. Must be one of: {', '.join(valid_scopes)}", status_code=400)

    data = {
        "code": body.code.upper().strip(),
        "type": body.type,
        "value": body.value,
        "max_discount_cap": body.max_discount_cap,
        "min_cart_value": body.min_cart_value,
        "usage_limit_total": body.usage_limit_total,
        "usage_limit_per_customer": body.usage_limit_per_customer,
        "scope": body.scope,
        "scope_ids": body.scope_ids,
        "start_date": body.start_date,
        "end_date": body.end_date,
        "active": body.active,
    }

    try:
        res = supabase.table("coupons").insert(data).execute()
        return res.data[0]
    except Exception as e:
        if "coupons_code_key" in str(e):
            raise AppError("A coupon with this code already exists", status_code=400)
        raise AppError(f"Error creating coupon: {str(e)}")


@router.put("/{coupon_id}", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_coupon(coupon_id: UUID, body: CouponUpdate, request: Request):
    """Update a coupon."""
    supabase = get_supabase()

    update_data = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not update_data:
        raise AppError("No fields to update", status_code=400)

    if "code" in update_data and update_data["code"]:
        update_data["code"] = update_data["code"].upper().strip()

    if "type" in update_data:
        valid_types = ("flat", "percent", "free_shipping")
        if update_data["type"] not in valid_types:
            raise AppError(f"Invalid coupon type. Must be one of: {', '.join(valid_types)}", status_code=400)

    try:
        res = supabase.table("coupons").update(update_data).eq("id", str(coupon_id)).execute()
        if not res.data:
            raise AppError("Coupon not found", status_code=404)
        return res.data[0]
    except AppError:
        raise
    except Exception as e:
        if "coupons_code_key" in str(e):
            raise AppError("A coupon with this code already exists", status_code=400)
        raise AppError(f"Error updating coupon: {str(e)}")


@router.delete("/{coupon_id}", dependencies=[Depends(PreAuthRateLimit("30/minute"))])
@limiter.limit("30/minute", key_func=get_admin_id)
def delete_coupon(coupon_id: UUID, request: Request):
    """Delete a coupon."""
    supabase = get_supabase()

    try:
        res = supabase.table("coupons").delete().eq("id", str(coupon_id)).execute()
        if not res.data:
            raise AppError("Coupon not found", status_code=404)
        return {"success": True, "message": "Coupon deleted successfully"}
    except AppError:
        raise
    except Exception as e:
        # Check if it fails due to foreign key constraints (e.g. coupon_usages)
        if "23503" in str(e): # Foreign key violation code
            raise AppError("Cannot delete coupon because it has been used by customers.", status_code=400)
        raise AppError(f"Error deleting coupon: {str(e)}")
