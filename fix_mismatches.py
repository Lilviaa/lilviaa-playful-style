import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

mismatched_order_ids = [
    "2e1554f9-9a9d-4781-afec-1a7477786f8e",
    "a72cca2a-0300-4b28-9239-bb3c1d327c1f",
    "df7a19a4-f0e7-4ede-b346-b777cb0e0496",
    "4e577ff5-c0d9-4d61-aa49-49fe1f7cd4ef",
    "885fc358-e718-427d-b6d0-74adc7259a59",
    "00d355ae-55c8-4618-8522-d3e5f1267552",
    "3ee2f748-9397-4266-8b8d-a03ec4141b57",
    "43956076-d80a-48ee-bd59-fc70084b806e"
]

correct_user_id = "d6b8724e-944e-42c3-8727-8a692c45efeb"

print(f"Reassigning {len(mismatched_order_ids)} orders to correct user {correct_user_id}...")

for oid in mismatched_order_ids:
    res = supabase.table("orders").update({"user_id": correct_user_id}).eq("id", oid).execute()
    print(f"Updated order {oid}: {len(res.data) > 0}")

print("Done properly aligning past orders.")
