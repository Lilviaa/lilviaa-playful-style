import os
from supabase import create_client

url = os.environ.get("SUPABASE_URL", "http://127.0.0.1:54321")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")
supabase = create_client(url, key)

orders_res = supabase.table("orders").select("id, user_id, shipping_address_id, created_at").not_.is_("user_id", "null").execute()
orders = orders_res.data

if not orders:
    print("No authenticated orders.")
    exit(0)

user_ids = list(set([o["user_id"] for o in orders]))

# Get users (for email)
users_res = supabase.table("users").select("id, email").in_("id", user_ids).execute()
users_map = {u["id"]: u["email"] for u in users_res.data}

# Get profiles (for full_name and phone)
profiles_res = supabase.table("user_profiles").select("user_id, full_name, phone").in_("user_id", user_ids).execute()
profiles = {p["user_id"]: p for p in profiles_res.data}

addr_ids = list(set([o["shipping_address_id"] for o in orders if o.get("shipping_address_id")]))
addrs_res = supabase.table("addresses").select("id, full_name, phone").in_("id", addr_ids).execute()
addrs = {a["id"]: a for a in addrs_res.data}

mismatches = []
for o in orders:
    uid = o["user_id"]
    sid = o.get("shipping_address_id")
    
    email = users_map.get(uid, "")
    p = profiles.get(uid, {})
    a = addrs.get(sid, {})
    
    p_phone = p.get("phone", "") or ""
    a_phone = a.get("phone", "") or ""
    
    p_name = p.get("full_name", "") or ""
    a_name = a.get("full_name", "") or ""
    
    # Logic for mismatch:
    # If shipping phone is completely different from profile phone (and both exist)
    phone_mismatch = bool(p_phone and a_phone and p_phone.strip() != a_phone.strip())
    
    # Or if names are completely different
    name_mismatch = False
    if p_name and a_name:
        pn = p_name.lower().strip()
        an = a_name.lower().strip()
        if pn not in an and an not in pn:
            name_mismatch = True
            
    if phone_mismatch or name_mismatch:
        mismatches.append({
            "order_id": o["id"],
            "user_id": uid,
            "email": email,
            "profile_name": p_name,
            "profile_phone": p_phone,
            "shipping_name": a_name,
            "shipping_phone": a_phone
        })

print(f"Found {len(mismatches)} mismatches out of {len(orders)} orders.")
for m in mismatches:
    print(f"Order: {m['order_id']} | Email: {m['email']} | User: {m['profile_name']} ({m['profile_phone']}) | Ship: {m['shipping_name']} ({m['shipping_phone']})")
