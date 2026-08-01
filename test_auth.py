import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

res = supabase.auth.admin.list_users()
print(f"Total users: {len(res)}")
if len(res) > 0:
    print(f"First user: {res[0].email} ID: {res[0].id}")

# Can we get a user by email?
# Supabase doesn't have `get_user_by_email` in python client.
# Let's see if we can query user_profiles and then update auth.users
profile = supabase.table("user_profiles").select("user_id").limit(1).execute()
print(f"Profile: {profile.data}")
