import os
import sys
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from supabase import create_client, Client

# Add the parent directory to sys.path so we can import app modules if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

load_dotenv()

def seed_firebase():
    cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
    if not cred_path or not os.path.exists(cred_path):
        print("Firebase service account JSON not found.")
        return

    # Initialize Firebase if not already initialized
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)

    # Initialize Supabase
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not supabase_url or not supabase_key:
        print("Supabase credentials not found in .env")
        return
        
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Fetch all users from Supabase public.users
    print("Fetching users from Supabase...")
    response = supabase.table("users").select("email").execute()
    users_to_create = response.data
    
    if not users_to_create:
        print("No users found in Supabase.")
        return
        
    print(f"Found {len(users_to_create)} users. Migrating to Firebase...")

    success_count = 0
    fail_count = 0
    default_password = "Password@123"

    for u in users_to_create:
        email = u.get("email")
        if not email:
            continue
            
        try:
            # Check if user already exists in Firebase
            try:
                existing = auth.get_user_by_email(email)
                print(f"User {email} already exists in Firebase. Skipping.")
                continue
            except auth.UserNotFoundError:
                pass

            # Create the user in Firebase
            # Note: We cannot extract the real passwords from Supabase for security reasons,
            # so we set a default password for the migration.
            user = auth.create_user(
                email=email,
                password=default_password,
                email_verified=True
            )
            print(f"Successfully created {email} in Firebase!")
            success_count += 1
        except Exception as e:
            print(f"Failed to create {email}: {e}")
            fail_count += 1
            
    print("-" * 30)
    print(f"Migration Complete: {success_count} created, {fail_count} failed.")
    print(f"NOTE: All migrated users have been given the default password: {default_password}")

if __name__ == "__main__":
    seed_firebase()
