import asyncio
from supabase import create_client
import os

from dotenv import load_dotenv
load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
anon_key = os.environ.get("SUPABASE_KEY")

supabase = create_client(url, key)
anon_supabase = create_client(url, anon_key)

try:
    print("Attempting to register test user...")
    auth_response = supabase.auth.admin.create_user({
        "email": "test_auth_123@example.com",
        "password": "Password123!",
        "email_confirm": True,
        "user_metadata": {
            "full_name": "Test Auth"
        }
    })
    print("User created:", auth_response.user.id)
except Exception as e:
    print("Registration failed:", e)

try:
    print("Attempting to login...")
    login_response = anon_supabase.auth.sign_in_with_password({
        "email": "test_auth_123@example.com",
        "password": "Password123!"
    })
    print("Login successful:", login_response.session.access_token[:20])
except Exception as e:
    print("Login failed:", e)

try:
    print("Cleaning up...")
    supabase.auth.admin.delete_user(auth_response.user.id)
    print("Cleanup done.")
except Exception as e:
    print("Cleanup failed:", e)
