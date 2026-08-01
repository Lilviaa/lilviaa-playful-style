import { apiFetch } from "./api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "./auth";

export function useUpdateProfile() {
  const { checkSession } = useAuth();
  
  return useMutation({
    mutationFn: async (data: { full_name?: string; phone?: string }) => {
      const res = await apiFetch("/auth/me", {
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

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const res = await apiFetch("/auth/me/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to update password");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Password updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update password");
    }
  });
}
