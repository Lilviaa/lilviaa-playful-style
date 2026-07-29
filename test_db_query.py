import asyncio
from supabase import create_client
import os
from dotenv import load_dotenv
from datetime import datetime, timezone

load_dotenv("backend/.env")
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_ROLE_KEY"])
res = supabase.table("product_variants").select("id, stock, reserved_stock, price_override, products(base_price, sale_price, sale_start, sale_end)").limit(1).execute()
print(res.data)
