from fastapi import APIRouter, Depends, Request, BackgroundTasks, status
from app.api.dependencies import get_current_user_token
from app.db.supabase import get_supabase
from pydantic import BaseModel
from typing import Optional
import firebase_admin.auth

router = APIRouter()

class SyncUserRequest(BaseModel):
    uid: str
    email: str
    full_name: str
    phone: Optional[str] = None

@router.post("/sync")
def sync_firebase_user(user: SyncUserRequest):
    """
    Syncs a newly registered Firebase user into the Supabase 'users' table.
    This ensures they have a profile we can link orders to.
    """
    supabase = get_supabase()
    
    # Check if user already exists
    existing = supabase.table("users").select("id").eq("email", user.email).execute()
    
    if existing.data:
        # Update their Firebase UID if we want to store it, but for now we just return
        # the existing user id
        return {"status": "synced", "user_id": existing.data[0]["id"]}
    
    # Generate a new UUID for the user
    import uuid
    new_user_id = str(uuid.uuid4())
    
    # Insert new user into `users` table
    new_user = supabase.table("users").insert({
        "id": new_user_id,
        "email": user.email,
        "role": "customer",
        "is_verified": True # Firebase verifies emails
    }).execute()
    
    if new_user.data:
        user_id = new_user.data[0]["id"]
        
        # Insert profile into `user_profiles`
        supabase.table("user_profiles").insert({
            "user_id": user_id,
            "full_name": user.full_name,
            "phone": user.phone
        }).execute()
        
        return {"status": "created", "user_id": user_id}
    
    return {"status": "error"}

@router.get("/me")
def get_current_user_profile(token_data: dict = Depends(get_current_user_token)):
    """
    Returns the user's profile from Supabase, bridging the gap between Firebase auth and our DB.
    """
    supabase = get_supabase()
    # Fetch user and their profile
    user_data = supabase.table("users").select("*, user_profiles(full_name, phone)").eq("id", token_data["sub"]).single().execute()
    
    if user_data.data:
        user = user_data.data
        
        # Flatten profile data
        profile = user.pop("user_profiles", None)
        if profile:
            # Handle both list and dict returns from Supabase joins
            prof_data = profile[0] if isinstance(profile, list) else profile
            user["full_name"] = prof_data.get("full_name")
            user["phone"] = prof_data.get("phone")
            
        if "hashed_password" in user:
            del user["hashed_password"]
            
        return user
    return {"error": "User not found"}

@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_current_user(token_data: dict = Depends(get_current_user_token)):
    """
    Deletes the current user from our Supabase DB and from Firebase Auth.
    Requires re-authentication on the frontend before calling.
    """
    supabase = get_supabase()
    user_id = token_data["sub"]
    
    # 1. Delete from Supabase (cascades where needed)
    supabase.table("users").delete().eq("id", user_id).execute()
    
    # 2. Delete from Firebase
    try:
        firebase_admin.auth.delete_user(token_data["firebase_uid"])
    except Exception as e:
        # Ignore if it doesn't exist, we just want it gone
        pass
        
    return
