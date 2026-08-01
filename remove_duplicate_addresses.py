import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

print("Fetching all addresses to find duplicates...")
res = supabase.table("addresses").select("*").execute()
addresses = res.data

# Group by user_id and address details
seen = {}
duplicates = []

for addr in addresses:
    # Create a unique key for the address content
    key_parts = (
        addr.get("user_id"),
        addr.get("full_name"),
        addr.get("phone"),
        addr.get("address"),
        addr.get("city"),
        addr.get("state"),
        addr.get("zip")
    )
    
    if key_parts in seen:
        # Keep the one that is marked as default, or the older one if neither is default (or both are)
        # Actually, let's just keep the FIRST one we see, and delete the others.
        # But wait! If the duplicate is marked as is_default = True, and the kept one is False,
        # we should promote the kept one to True.
        existing_addr = seen[key_parts]
        if addr.get("is_default") and not existing_addr.get("is_default"):
            # Update the kept one to be default
            supabase.table("addresses").update({"is_default": True}).eq("id", existing_addr["id"]).execute()
            existing_addr["is_default"] = True
            
        duplicates.append(addr["id"])
    else:
        seen[key_parts] = addr

print(f"Found {len(duplicates)} duplicate addresses.")

for dup_id in duplicates:
    print(f"Deleting duplicate address: {dup_id}")
    supabase.table("addresses").delete().eq("id", dup_id).execute()

print("Cleanup complete!")
