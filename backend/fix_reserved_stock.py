from app.db.supabase import get_supabase
supabase = get_supabase()

# Reset all reserved_stock to 0 since there are no active orders
res = supabase.table("product_variants").select("id, reserved_stock").gt("reserved_stock", 0).execute()

for variant in res.data:
    supabase.table("product_variants").update({"reserved_stock": 0}).eq("id", variant["id"]).execute()
    print(f"Reset reserved_stock for variant {variant['id']}")

print("Done resetting reserved stock.")
