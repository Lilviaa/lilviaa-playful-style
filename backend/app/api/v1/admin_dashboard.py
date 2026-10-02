from fastapi import APIRouter, Depends, Request, Query
from app.api.dependencies import require_admin
from app.db.supabase import get_supabase
from datetime import datetime, timezone, timedelta
from app.core.limiter import limiter, PreAuthRateLimit, get_admin_id

router = APIRouter()

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


@router.get("/stats", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
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

@router.get("/metrics", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_dashboard_metrics(
    request: Request,
    start_date: str = Query(...),
    end_date: str = Query(...)
):
    supabase = get_supabase()
    try:
        start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except ValueError:
        return {"error": "Invalid date format"}
    
    res = supabase.table("orders") \
        .select("total_amount") \
        .gte("created_at", start_dt.isoformat()) \
        .lte("created_at", end_dt.isoformat()) \
        .in_("status", ["pending", "confirmed", "packed", "shipped", "delivered"]) \
        .execute()
        
    orders = res.data or []
    total_orders = len(orders)
    total_revenue = sum(float(o["total_amount"]) for o in orders)
    
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    days = max((end_dt - start_dt).days, 1)
    avg_daily_revenue = total_revenue / days
    
    return {
        "totalRevenue": int(total_revenue * 100),
        "avgDailyRevenue": int(avg_daily_revenue * 100),
        "totalOrders": total_orders,
        "avgOrderValue": int(avg_order_value * 100)
    }

@router.get("/chart", dependencies=[Depends(PreAuthRateLimit("60/minute")), Depends(require_admin)])
@limiter.limit("60/minute", key_func=get_admin_id)
def get_dashboard_chart(
    request: Request,
    time_range: str = Query(None),
    start_date: str = Query(None),
    end_date: str = Query(None)
):
    supabase = get_supabase()
    now = datetime.now(timezone.utc)
    
    if time_range == "1d":
        start_dt = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif time_range == "7d":
        start_dt = now - timedelta(days=7)
        end_dt = now
    elif time_range == "30d":
        start_dt = now - timedelta(days=30)
        end_dt = now
    elif time_range == "1y":
        start_dt = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        end_dt = now
    elif start_date and end_date:
        start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    else:
        start_dt = now - timedelta(days=30)
        end_dt = now

    res = supabase.table("orders") \
        .select("created_at, total_amount") \
        .gte("created_at", start_dt.isoformat()) \
        .lte("created_at", end_dt.isoformat()) \
        .in_("status", ["pending", "confirmed", "packed", "shipped", "delivered"]) \
        .execute()
        
    orders = res.data or []
    chart_data = {}
    
    delta = (end_dt - start_dt).days
    if delta <= 1:
        for i in range(24):
            d_str = start_dt.replace(hour=i).strftime("%I %p")
            chart_data[d_str] = 0.0
    elif delta <= 60:
        for i in range(delta + 1):
            d = (start_dt + timedelta(days=i)).strftime("%b %d")
            chart_data[d] = 0.0
    else:
        curr = start_dt
        while curr <= end_dt:
            m_str = curr.strftime("%b %Y")
            chart_data[m_str] = 0.0
            if curr.month == 12:
                curr = curr.replace(year=curr.year + 1, month=1)
            else:
                curr = curr.replace(month=curr.month + 1)
                
    for o in orders:
        o_dt = datetime.fromisoformat(o["created_at"].replace("Z", "+00:00"))
        amt = float(o["total_amount"])
        if delta <= 1:
            k = o_dt.strftime("%I %p")
        elif delta <= 60:
            k = o_dt.strftime("%b %d")
        else:
            k = o_dt.strftime("%b %Y")
            
        if k in chart_data:
            chart_data[k] += amt
            
    result = [{"date": k, "revenue": int(v * 100)} for k, v in chart_data.items()]
    return {"chartData": result}

@router.get("/report", dependencies=[Depends(PreAuthRateLimit("20/minute")), Depends(require_admin)])
@limiter.limit("20/minute", key_func=get_admin_id)
def get_dashboard_report(
    request: Request,
    start_date: str = Query(...),
    end_date: str = Query(...)
):
    supabase = get_supabase()
    try:
        start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
        end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
    except ValueError:
        return {"error": "Invalid date format"}
        
    res = supabase.table("orders") \
        .select("*, order_items(*, product_variants(*, products(*)))") \
        .gte("created_at", start_dt.isoformat()) \
        .lte("created_at", end_dt.isoformat()) \
        .order("created_at", desc=True) \
        .execute()
        
    orders = res.data or []
    reports = []
    
    for o in orders:
        items = []
        for i in o.get("order_items", []):
            prod = i.get("product_variants", {}).get("products", {}) if i.get("product_variants") else {}
            name = prod.get("name", "Unknown") if prod else "Unknown"
            sku = i.get("product_variants", {}).get("sku", "Unknown") if i.get("product_variants") else "Unknown"
            items.append(f"{name} (SKU: {sku}) x{i.get('quantity')}")
            
        addr = o.get("shipping_address") or {}
        reports.append({
            "orderId": o["id"],
            "date": o["created_at"],
            "customerName": addr.get("fullName", "Unknown"),
            "customerEmail": addr.get("email", "Unknown"),
            "status": o["status"],
            "paymentMethod": o["payment_method"],
            "total": float(o["total_amount"]),
            "items": " | ".join(items)
        })
        
    return {"reportData": reports}

