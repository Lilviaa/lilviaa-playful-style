from supabase import Client
from app.models.auth import UserCreate, UserLogin, Token, UserResponse, UserProfileUpdate
from app.core.exceptions import AppError, UnauthorizedError
from app.db.supabase import get_supabase, get_fresh_supabase

class AuthService:
    @property
    def supabase(self) -> Client:
        """Always get the singleton admin client (no user session on it)."""
        return get_supabase()

    def register_user(self, user_in: UserCreate) -> UserResponse:
        try:
            auth_response = self.supabase.auth.admin.create_user({
                "email": user_in.email,
                "password": user_in.password,
                "email_confirm": True,
                "user_metadata": {
                    "full_name": user_in.full_name
                }
            })
            user_id = auth_response.user.id
            
            self.supabase.table("users").insert({
                "id": user_id,
                "email": user_in.email,
                "role": "customer"
            }).execute()

            self.supabase.table("user_profiles").insert({
                "user_id": user_id,
                "full_name": user_in.full_name,
                "phone": user_in.phone
            }).execute()

            return UserResponse(
                id=user_id,
                email=user_in.email,
                role="customer",
                full_name=user_in.full_name,
                phone=user_in.phone
            )
        except Exception as e:
            raise AppError(f"Registration failed: {str(e)}")

    def login_user(self, user_in: UserLogin) -> Token:
        try:
            # Use a FRESH client so sign_in doesn't pollute the admin singleton
            fresh_client = get_fresh_supabase()
            auth_response = fresh_client.auth.sign_in_with_password({
                "email": user_in.email,
                "password": user_in.password
            })
            
            return Token(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer"
            )
        except Exception as e:
            raise UnauthorizedError("Invalid email or password")

    def refresh_token(self, refresh_token: str) -> Token:
        """Exchange a refresh token for a new access + refresh token."""
        try:
            fresh_client = get_fresh_supabase()
            auth_response = fresh_client.auth.refresh_session(refresh_token)
            if not auth_response or not auth_response.session:
                raise UnauthorizedError("Session expired or invalid refresh token")
                
            return Token(
                access_token=auth_response.session.access_token,
                refresh_token=auth_response.session.refresh_token,
                token_type="bearer"
            )
        except Exception:
            raise UnauthorizedError("Session expired or invalid refresh token")

    def get_user_profile(self, user_id: str) -> UserResponse:
        try:
            user_data = self.supabase.table("users").select("*").eq("id", user_id).single().execute()
            profile_data = self.supabase.table("user_profiles").select("*").eq("user_id", user_id).single().execute()
            
            return UserResponse(
                id=user_data.data["id"],
                email=user_data.data["email"],
                role=user_data.data["role"],
                full_name=profile_data.data["full_name"],
                phone=profile_data.data.get("phone")
            )
        except Exception as e:
            raise AppError(f"Failed to fetch profile: {str(e)}")

    def update_profile(self, user_id: str, updates: UserProfileUpdate) -> UserResponse:
        """Update editable profile fields: full_name, phone, email."""
        try:
            profile_updates = {}
            if updates.full_name is not None:
                profile_updates["full_name"] = updates.full_name
            if updates.phone is not None:
                profile_updates["phone"] = updates.phone

            if profile_updates:
                self.supabase.table("user_profiles").update(profile_updates).eq("user_id", user_id).execute()

            if updates.email is not None:
                self.supabase.auth.admin.update_user_by_id(user_id, {"email": updates.email})
                self.supabase.table("users").update({"email": updates.email}).eq("id", user_id).execute()

            return self.get_user_profile(user_id)
        except Exception as e:
            raise AppError(f"Failed to update profile: {str(e)}")

    def change_password(self, user_id: str, new_password: str, current_password: str) -> dict:
        """Change user password, verifying the old password first."""
        try:
            # 1. Fetch user's email to verify current password
            user_data = self.supabase.table("users").select("email").eq("id", user_id).single().execute()
            if not user_data.data:
                raise AppError("User not found")
            email = user_data.data["email"]

            # 2. Verify current password by attempting to sign in
            fresh_client = get_fresh_supabase()
            try:
                fresh_client.auth.sign_in_with_password({"email": email, "password": current_password})
            except Exception:
                raise UnauthorizedError("Incorrect current password")

            # 3. Update password via Admin API
            self.supabase.auth.admin.update_user_by_id(user_id, {"password": new_password})
            
            return {"message": "Password updated successfully. Please log in again with your new password."}
        except UnauthorizedError:
            raise
        except Exception as e:
            raise AppError(f"Failed to change password: {str(e)}")

    def logout_user(self, access_token: str) -> dict:
        """Sign out user — invalidates the Supabase session."""
        try:
            self.supabase.auth.admin.sign_out(access_token)
            return {"message": "Logged out successfully"}
        except Exception:
            return {"message": "Logged out successfully"}

auth_service = AuthService()
