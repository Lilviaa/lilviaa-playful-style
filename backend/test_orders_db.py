from app.db.supabase import get_supabase

supabase = get_supabase()
query = supabase.table("orders").select("*, addresses(*)").order("created_at", desc=True).limit(5)
res = query.execute()

for o in res.data:
    print(f"Order ID: {o['id']}")
    print(f"shipping_address snapshot: {o.get('shipping_address')}")
    print(f"addresses relation: {o.get('addresses')}")
    print("---")
