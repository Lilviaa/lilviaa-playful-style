from app.db.supabase import get_supabase
supabase = get_supabase()
res = supabase.table("product_variants").select("id, stock, reserved_stock").execute()
print(res.data)
