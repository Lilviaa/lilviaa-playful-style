from app.db.supabase import get_supabase
supabase = get_supabase()
res = supabase.table("reviews").select("*").execute()
print(res.data)
