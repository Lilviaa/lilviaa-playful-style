import os
import sys
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("C:\\Users\\Kamaleswaran\\OneDrive\\Desktop\\Lilviaa_web\\lilviaa-playful-style\\backend\\.env")
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table("orders").select("id").ilike("id", "9763d7bc%").execute()
    print("SUCCESS ilike UUID:", len(res.data))
except Exception as e:
    print("FAILED ilike UUID:", e)

try:
    res = supabase.table("orders").select("id").eq("id", "9763d7bc-937e-4ba1-9a12-35210271d413").execute()
    print("SUCCESS eq UUID:", len(res.data))
except Exception as e:
    print("FAILED eq UUID:", e)
