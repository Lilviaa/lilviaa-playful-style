import asyncio
from backend.app.core.supabase import supabase

async def main():
    res = supabase.table("users").select("email, role").execute()
    print(res.data)

asyncio.run(main())
