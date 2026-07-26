import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv(".env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

try:
    print("Checking if kamaleshwaran197609@gmail.com is in user_profiles...")
    
    # Get user id
    user_data = supabase.table("users").select("id").eq("email", "kamaleshwaran197609@gmail.com").execute()
    if not user_data.data:
        print("User not found in users table.")
    else:
        user_id = user_data.data[0]["id"]
        print("User ID:", user_id)
        
        # Check user_profiles
        profile_data = supabase.table("user_profiles").select("*").eq("user_id", user_id).execute()
        print("Profile data:", profile_data.data)
        
except Exception as e:
    print("Error:", e)
