import os
import sys
from dotenv import load_dotenv

load_dotenv(dotenv_path="backend/.env")

from supabase import create_client

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(url, key)

# Pick some arbitrary UUID that we know doesn't have ALL orders
user_id = "00000000-0000-0000-0000-000000000000"

res = supabase.table("orders").select("*").eq("user_id", user_id).execute()
print(f"Number of orders for {user_id}: {len(res.data)}")
