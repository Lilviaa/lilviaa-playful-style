from app.db.supabase import get_supabase
supabase = get_supabase()
res = supabase.table("products").select("name, product_variants(size, stock, reserved_stock)").eq("name", "picnic shirt").execute()
print(res.data)
