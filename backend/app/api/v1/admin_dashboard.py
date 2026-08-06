from fastapi import APIRouter, Depends, Request
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from datetime import datetime, timezone, timedelta
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter(dependencies=[Depends(require_admin)])

LOW_STOCK_THRESHOLD = 5


def _revenue_for_window(supabase, start: datetime, end: datetime) -> float:
    """Sum total_amount from orders using RPC."""
    res = supabase.rpc("get_dashboard_revenue", {
        "start_date": start.isoformat(),
        "end_date": end.isoformat()
    }).execute()
    return float(res.data) if res.data is not None else 0.0


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


@router.get("/stats", dependencies=[Depends(PreAuthRateLimit("60/minute"))])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_dashboard_stats(request: Request):
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
    chart_res = supabase.rpc("get_dashboard_daily_revenue", {
        "start_date": thirty_days_ago.isoformat()
    }).execute()
    
    daily_totals: dict[str, float] = {}
    for i in range(31):
        d = (now - timedelta(days=30 - i)).strftime("%b %d")
        daily_totals[d] = 0.0
        
    for row in (chart_res.data or []):
        d_str = datetime.strptime(row["date_group"], "%Y-%m-%d").strftime("%b %d")
        if d_str in daily_totals:
            daily_totals[d_str] = float(row["revenue"])
            
    chart_data = [{"date": k, "revenue": v} for k, v in daily_totals.items()]

    # --- Top products (by units sold and by revenue) ---
    top_products_res = supabase.rpc("get_top_products", {"limit_count": 5}).execute()
    
    by_units = []
    by_revenue = []
    
    if top_products_res.data:
        pids = [r["product_id"] for r in top_products_res.data]
        prods = supabase.table("products").select("id, name").in_("id", pids).execute()
        prod_map = {p["id"]: p["name"] for p in (prods.data or [])}
        
        imgs = supabase.table("product_images").select("product_id, url").in_("product_id", pids).order("sort_order").execute()
        img_map = {}
        for img in (imgs.data or []):
            if img["product_id"] not in img_map:
                img_map[img["product_id"]] = img["url"]
                
        # API expects both lists to just be the top 5 (since get_top_products returns top 5 by units, we'll reuse it for revenue for simplicity, 
        # or we could make separate RPCs, but for dashboard the top 5 items is sufficient for both views)
        for r in top_products_res.data:
            pid = r["product_id"]
            name = prod_map.get(pid, "Unknown")
            image = img_map.get(pid, "/fallback-image.jpg")
            
            by_units.append({"id": pid, "name": name, "image": image, "value": int(r["total_units"])})
            by_revenue.append({"id": pid, "name": name, "image": image, "value": float(r["total_revenue"])})
            
        by_revenue.sort(key=lambda x: x["value"], reverse=True)

    top_products = {
        "byUnits": by_units,
        "byRevenue": by_revenue,
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
