from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel
from typing import Optional, List
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from app.core.exceptions import AppError
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter()


class TagsUpdate(BaseModel):
    tags: List[str]


@router.get("", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def list_customers(
    request: Request,
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("recent"),
):
    """List all registered customers (user_id-based only, no guests) with aggregated stats."""
    supabase = get_supabase()

    # 1. Get all users with role=customer + their profiles
    users_res = supabase.table("users") \
        .select("id, email, created_at, user_profiles(full_name, phone, tags)") \
        .eq("role", "customer") \
        .execute()

    users = users_res.data or []

    # 2. Get order aggregates grouped by user_id (only non-cancelled/returned)
    orders_res = supabase.table("orders") \
        .select("user_id, total_amount, status, created_at") \
        .not_.is_("user_id", "null") \
        .not_.in_("status", ["cancelled", "returned"]) \
        .execute()

    # Build aggregates per user_id
    user_stats: dict = {}
    for o in (orders_res.data or []):
        uid = o["user_id"]
        if uid not in user_stats:
            user_stats[uid] = {"total_orders": 0, "total_spend": 0.0, "last_order_date": None}
        user_stats[uid]["total_orders"] += 1
        user_stats[uid]["total_spend"] += float(o["total_amount"])
        order_date = o["created_at"]
        if user_stats[uid]["last_order_date"] is None or order_date > user_stats[uid]["last_order_date"]:
            user_stats[uid]["last_order_date"] = order_date

    # 3. Build response
    result = []
    for u in users:
        profile = u.get("user_profiles")
        if isinstance(profile, list):
            profile = profile[0] if profile else {}
        elif profile is None:
            profile = {}

        name = profile.get("full_name", "")
        phone = profile.get("phone", "")
        tags = profile.get("tags") or []
        stats = user_stats.get(u["id"], {"total_orders": 0, "total_spend": 0.0, "last_order_date": None})

        customer = {
            "id": u["id"],
            "name": name,
            "email": u["email"],
            "phone": phone or "",
            "is_guest": False,
            "created_at": u["created_at"],
            "tags": tags,
            "total_orders": stats["total_orders"],
            "total_spend": stats["total_spend"],
            "last_order_date": stats["last_order_date"],
        }

        # Apply search filter
        if search:
            q = search.lower()
            if q not in customer["name"].lower() and \
               q not in customer["email"].lower() and \
               q not in customer["phone"]:
                continue

        result.append(customer)

    # Sort
    if sort == "spend":
        result.sort(key=lambda c: c["total_spend"], reverse=True)
    else:
        result.sort(key=lambda c: c["created_at"], reverse=True)

    return result


@router.get("/{customer_id}", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_customer(customer_id: str, request: Request):
    """Get a single customer's details, addresses, and order history."""
    supabase = get_supabase()

    # User + profile
    user_res = supabase.table("users") \
        .select("id, email, created_at, user_profiles(full_name, phone, tags)") \
        .eq("id", customer_id) \
        .execute()

    if not user_res.data:
        raise AppError("Customer not found", status_code=404)

    u = user_res.data[0]
    profile = u.get("user_profiles")
    if isinstance(profile, list):
        profile = profile[0] if profile else {}
    elif profile is None:
        profile = {}

    # Addresses
    addr_res = supabase.table("addresses") \
        .select("*") \
        .eq("user_id", customer_id) \
        .execute()

    addresses = []
    for a in (addr_res.data or []):
        addresses.append({
            "id": a["id"],
            "customer_id": customer_id,
            "label": a.get("type", "Home"),
            "full_address": {
                "address": a.get("address", ""),
                "city": a.get("city", ""),
                "state": a.get("state", ""),
                "zip": a.get("zip", ""),
            },
            "is_default": a.get("is_default", False),
        })

    # Order history
    orders_res = supabase.table("orders") \
        .select("id, status, total_amount, payment_method, created_at") \
        .eq("user_id", customer_id) \
        .order("created_at", desc=True) \
        .execute()

    # Aggregates
    valid_orders = [o for o in (orders_res.data or []) if o["status"] not in ("cancelled", "returned")]
    total_spend = sum(float(o["total_amount"]) for o in valid_orders)
    last_order_date = valid_orders[0]["created_at"] if valid_orders else None

    # Wishlist
    wishlist_res = supabase.table("wishlist_items") \
        .select("id, product_id, created_at, products(id, name, slug, base_price, sale_price, images)") \
        .eq("user_id", customer_id) \
        .execute()

    wishlist_items = []
    for w in (wishlist_res.data or []):
        p = w.get("products")
        if not p:
            continue
        images = p.get("images") or []
        primary_image = images[0].get("url") if images else ""
        wishlist_items.append({
            "id": p["id"],
            "name": p["name"],
            "slug": p["slug"],
            "price": p.get("sale_price") if p.get("sale_price") is not None else p.get("base_price"),
            "image": primary_image,
            "added_at": w["created_at"]
        })

    return {
        "customer": {
            "id": u["id"],
            "name": profile.get("full_name", ""),
            "email": u["email"],
            "phone": profile.get("phone", "") or "",
            "is_guest": False,
            "created_at": u["created_at"],
            "tags": profile.get("tags") or [],
            "total_orders": len(valid_orders),
            "total_spend": total_spend,
            "last_order_date": last_order_date,
        },
        "addresses": addresses,
        "orders": orders_res.data or [],
        "wishlist": wishlist_items,
    }


@router.patch("/{customer_id}/tags", dependencies=[Depends(PreAuthRateLimit("30/minute")), Depends(require_admin)])
@limiter.limit("30/minute", key_func=get_admin_id)
def update_customer_tags(customer_id: str, body: TagsUpdate, request: Request):
    """Update customer tags (vip, repeat, high_value, etc.)."""
    supabase = get_supabase()

    # Verify user exists
    user_res = supabase.table("users").select("id").eq("id", customer_id).execute()
    if not user_res.data:
        raise AppError("Customer not found", status_code=404)

    # Update tags on user_profiles
    supabase.table("user_profiles") \
        .update({"tags": body.tags}) \
        .eq("user_id", customer_id) \
        .execute()

    return {"id": customer_id, "tags": body.tags}
