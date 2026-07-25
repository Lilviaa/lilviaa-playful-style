import os
import sys
from dotenv import load_dotenv
from supabase import create_client

def create_admin():
    load_dotenv()
    
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        print("Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
        sys.exit(1)
        
    supabase = create_client(url, key)
    
    print("--- Create Admin User ---")
    email = "admin@test.com"
    password = "Password123!"
    
    if not email or not password:
        print("Email and password are required.")
        sys.exit(1)
        
    try:
        # 1. Create the user in Supabase Auth
        # email_confirm=True automatically verifies the email so they can log in immediately
        res = supabase.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })
        user_id = res.user.id
        
        # 2. Update their role to 'admin' in the public.users table
        supabase.table("users").update({"role": "admin"}).eq("id", user_id).execute()
        
        print(f"\nSuccess! Admin user created.")
        print(f"You can now log in at http://localhost:8080/admin with:")
        print(f"Email: {email}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"\nFailed to create admin: {e}")

if __name__ == "__main__":
    create_admin()
