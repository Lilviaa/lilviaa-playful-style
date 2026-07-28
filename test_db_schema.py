import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
res = supabase.table("product_variants").select("*").limit(1).execute()
print(res.data[0].keys() if res.data else "No rows")
