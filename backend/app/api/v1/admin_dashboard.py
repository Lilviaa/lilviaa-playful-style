from fastapi import APIRouter, Depends
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from datetime import datetime, timezone, timedelta

router = APIRouter(dependencies=[Depends(require_admin)])

LOW_STOCK_THRESHOLD = 5


def _revenue_for_window(supabase, start: datetime, end: datetime) -> float:
    """Sum total_amount from orders (excluding cancelled/returned) within a date window."""
    res = supabase.table("orders") \
        .select("total_amount") \
        .gte("created_at", start.isoformat()) \
        .lt("created_at", end.isoformat()) \
        .not_.in_("status", ["cancelled", "returned"]) \
        .execute()
    return sum(float(r["total_amount"]) for r in (res.data or []))


def _get_window_boundaries():
    """Return (start, end, prev_start, prev_end) for today, week, month, year."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    week_start = today_start - timedelta(days=today_start.weekday())
    prev_week_start = week_start - timedelta(weeks=1)

    month_start = today_start.replace(day=1)
    if month_start.month == 1:
        prev_month_start = month_start.replace(year=month_start.year - 1, month=12)
    else:
        prev_month_start = month_start.replace(month=month_start.month - 1)

    year_start = today_start.replace(month=1, day=1)
    prev_year_start = year_start.replace(year=year_start.year - 1)

    return {
        "today": (today_start, now, yesterday_start, today_start),
        "week": (week_start, now, prev_week_start, week_start),
        "month": (month_start, now, prev_month_start, month_start),
        "year": (year_start, now, prev_year_start, year_start),
    }


def _pct_change(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


@router.get("/stats")
def get_dashboard_stats():
    supabase = get_supabase()

    # --- Revenue aggregates ---
    windows = _get_window_boundaries()
    revenue = {}
    for key, (start, end, prev_start, prev_end) in windows.items():
        current = _revenue_for_window(supabase, start, end)
        previous = _revenue_for_window(supabase, prev_start, prev_end)
        revenue[key] = {
            "current": current,
            "previous": previous,
            "percentageChange": _pct_change(current, previous),
        }

    # --- Revenue chart (last 30 days, daily totals) ---
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    chart_orders = supabase.table("orders") \
        .select("total_amount, created_at") \
        .gte("created_at", thirty_days_ago.isoformat()) \
        .not_.in_("status", ["cancelled", "returned"]) \
        .execute()

    daily_totals: dict[str, float] = {}
    for i in range(31):
        d = (now - timedelta(days=30 - i)).strftime("%b %d")
        daily_totals[d] = 0.0

    for row in (chart_orders.data or []):
        date_str = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00")).strftime("%b %d")
        if date_str in daily_totals:
            daily_totals[date_str] += float(row["total_amount"])

    chart_data = [{"date": k, "revenue": v} for k, v in daily_totals.items()]

    # --- Top products (by units sold and by revenue) ---
    items_res = supabase.table("order_items") \
        .select("product_variant_id, quantity, total_price, order_id") \
        .execute()

    # Filter to only non-cancelled orders
    valid_order_ids = set()
    if items_res.data:
        order_ids = list(set(r["order_id"] for r in items_res.data))
        # Batch fetch order statuses
        orders_status = supabase.table("orders") \
            .select("id, status") \
            .in_("id", order_ids) \
            .execute()
        valid_order_ids = {
            o["id"] for o in (orders_status.data or [])
            if o["status"] not in ("cancelled", "returned")
        }

    # Aggregate by variant -> product
    variant_units: dict[str, int] = {}
    variant_revenue: dict[str, float] = {}
    for item in (items_res.data or []):
        if item["order_id"] not in valid_order_ids:
            continue
        vid = item["product_variant_id"]
        variant_units[vid] = variant_units.get(vid, 0) + item["quantity"]
        variant_revenue[vid] = variant_revenue.get(vid, 0) + float(item["total_price"])

    # Get variant->product mapping
    all_variant_ids = list(set(list(variant_units.keys()) + list(variant_revenue.keys())))
    product_units: dict[str, int] = {}
    product_revenue: dict[str, float] = {}
    product_info: dict[str, dict] = {}

    if all_variant_ids:
        variants = supabase.table("product_variants") \
            .select("id, product_id, products(name, slug)") \
            .in_("id", all_variant_ids) \
            .execute()
        for v in (variants.data or []):
            pid = v["product_id"]
            product_units[pid] = product_units.get(pid, 0) + variant_units.get(v["id"], 0)
            product_revenue[pid] = product_revenue.get(pid, 0) + variant_revenue.get(v["id"], 0)
            if pid not in product_info and v.get("products"):
                product_info[pid] = v["products"]

    # Get images for top products
    top_product_ids = list(product_info.keys())[:10]
    product_images: dict[str, str] = {}
    if top_product_ids:
        imgs = supabase.table("product_images") \
            .select("product_id, url") \
            .in_("product_id", top_product_ids) \
            .order("sort_order") \
            .execute()
        for img in (imgs.data or []):
            if img["product_id"] not in product_images:
                product_images[img["product_id"]] = img["url"]

    by_units = sorted(product_units.items(), key=lambda x: x[1], reverse=True)[:5]
    by_revenue = sorted(product_revenue.items(), key=lambda x: x[1], reverse=True)[:5]

    top_products = {
        "byUnits": [
            {
                "id": pid,
                "name": product_info.get(pid, {}).get("name", "Unknown"),
                "image": product_images.get(pid, "/fallback-image.jpg"),
                "value": units,
            }
            for pid, units in by_units
        ],
        "byRevenue": [
            {
                "id": pid,
                "name": product_info.get(pid, {}).get("name", "Unknown"),
                "image": product_images.get(pid, "/fallback-image.jpg"),
                "value": rev,
            }
            for pid, rev in by_revenue
        ],
    }

    # --- Low stock count ---
    low_stock = supabase.table("product_variants") \
        .select("id", count="exact") \
        .lt("stock", LOW_STOCK_THRESHOLD) \
        .execute()
    low_stock_count = low_stock.count or 0

    # --- Pending orders count ---
    pending = supabase.table("orders") \
        .select("id", count="exact") \
        .eq("status", "pending") \
        .execute()
    pending_orders_count = pending.count or 0

    # --- Recent activity ---
    recent_orders = supabase.table("orders") \
        .select("id, status, created_at") \
        .order("created_at", desc=True) \
        .limit(5) \
        .execute()

    recent_low = supabase.table("product_variants") \
        .select("id, stock, products(name)") \
        .lt("stock", LOW_STOCK_THRESHOLD) \
        .order("stock") \
        .limit(5) \
        .execute()

    recent_activity = []
    for o in (recent_orders.data or []):
        status_label = "completed" if o["status"] in ("delivered",) else "pending"
        recent_activity.append({
            "id": o["id"],
            "type": "order",
            "title": f"Order #{o['id'][:8]}… {o['status']}",
            "timestamp": o["created_at"],
            "status": status_label,
        })
    for v in (recent_low.data or []):
        pname = v.get("products", {}).get("name", "Unknown") if v.get("products") else "Unknown"
        recent_activity.append({
            "id": v["id"],
            "type": "stock",
            "title": f"{pname} is {'out of stock' if v['stock'] <= 0 else 'running low'} ({v['stock']} left)",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "status": "low_stock",
        })

    return {
        "revenue": revenue,
        "chartData": chart_data,
        "topProducts": top_products,
        "lowStockCount": low_stock_count,
        "pendingOrdersCount": pending_orders_count,
        "recentActivity": recent_activity,
    }
