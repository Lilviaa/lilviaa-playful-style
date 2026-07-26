import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
q = "shirt"
res = supabase.table("products").select("name").or_(f"name.ilike.%{q}%,description.ilike.%{q}%").execute()
print(res.data)
