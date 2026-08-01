from app.db.supabase import get_supabase
supabase = get_supabase()
res = supabase.table("coupons").select("code").execute()
print("Coupons in DB:", [c["code"] for c in res.data])
