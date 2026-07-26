import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    print("Getting a user ID from users table...")
    user_data = supabase.table("users").select("id").limit(1).execute()
    user_id = user_data.data[0]["id"]
    print("User ID:", user_id)

    print("Testing audit_logs insert...")
    res = supabase.table("audit_logs").insert({
        "user_id": user_id,
        "action": "test",
        "details": {"msg": "test"}
    }).execute()
    print("Success:", res)
except Exception as e:
    print("Error:", e)
