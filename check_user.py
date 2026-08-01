import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

# Does Dharanidharan have an account?
res = supabase.table("user_profiles").select("user_id, full_name, phone").eq("phone", "09363778981").execute()
if res.data:
    print(f"Yes! Found account for Dharanidharan: {res.data[0]}")
else:
    print("No account found for Dharanidharan with that phone.")

# Also check by name
res2 = supabase.table("user_profiles").select("user_id, full_name, phone").ilike("full_name", "%Dharanidharan%").execute()
if res2.data:
    print(f"Found account for Dharanidharan by name: {res2.data[0]}")
