from app.db.supabase import get_supabase
supabase = get_supabase()
res = supabase.table("coupons").select("*").eq("code", "SAVE100").execute()
print(res.data)
