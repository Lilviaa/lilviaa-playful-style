import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

res = supabase.table("users").select("id").eq("email", "testuser_orders@test.com").execute()
print("Without schema:", res.data)

try:
    res2 = supabase.table("auth.users").select("id").eq("email", "testuser_orders@test.com").execute()
    print("With auth schema:", res2.data)
except Exception as e:
    print("Failed with auth schema:", e)

# How about using an RPC?
