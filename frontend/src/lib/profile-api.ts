import { apiFetch } from "./api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./auth";

export function useUpdateProfile() {
  const { checkSession } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { full_name?: string; phone?: string }) => {
      const res = await apiFetch("/firebase_auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update profile");
      }
      return res.json();
    },
    onSuccess: async () => {
      await checkSession();
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update profile");
    }
  });
}

import { auth } from "./firebase";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!user.email) throw new Error("User has no email");
      
      // Google users cannot change password this way
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleUser) {
        throw new Error("You signed in with Google. You cannot change your password here.");
      }
      
      try {
        const credential = EmailAuthProvider.credential(user.email, data.current_password);
        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, data.new_password);
      } catch (e: any) {
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          throw new Error("Current password is incorrect");
        }
        throw new Error(e.message || "Failed to update password");
      }
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    }
  });
}

import { deleteUser } from "firebase/auth";

export function useDeleteAccount() {
  const { logout } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { current_password: string }) => {
      const user = auth.currentUser;
      if (!user) throw new Error("Not authenticated");
      if (!user.email) throw new Error("User has no email");
      
      const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
      if (isGoogleUser) {
        throw new Error("You signed in with Google. You cannot delete your account using a password here. Please contact support.");
      }
      
      try {
        const credential = EmailAuthProvider.credential(user.email, data.current_password);
        await reauthenticateWithCredential(user, credential);
        
        // Call backend to delete Supabase data (which also triggers Firebase admin delete just in case)
        const res = await apiFetch("/firebase_auth/me", { method: "DELETE" });
        if (!res.ok) {
           const err = await res.json();
           throw new Error(err.detail || "Failed to delete account from server");
        }
        
        // Also ensure client drops it
        await deleteUser(user);
      } catch (e: any) {
        if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password') {
          throw new Error("Current password is incorrect");
        }
        throw new Error(e.message || "Failed to delete account");
      }
    },
    onSuccess: () => {
      toast.success("Account deleted permanently");
      logout();
      window.location.href = "/";
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete account");
    }
  });
}
