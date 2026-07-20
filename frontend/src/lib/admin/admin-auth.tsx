import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import type { AdminUser } from "@/types/admin";

interface AdminAuthContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isOwner: boolean;
  isAdminUser: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

// In a real app, this would be fetched from Supabase `profiles` table.
const OWNER_EMAILS = ["admin1@lilviaa.com", "admin2@lilviaa.com"];

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoadingAuth) {
      setIsLoading(true);
      return;
    }

    if (user) {
      // Real authorization logic using the role returned from the backend
      const role = user.role;
      const isOwner = role === "owner";
      const isAdminUser = role === "admin" || role === "owner";

      if (isAdminUser) {
        setAdminUser({ user, role });
      } else {
        setAdminUser(null);
      }
    } else {
      setAdminUser(null);
    }
    setIsLoading(false);
  }, [user, isLoadingAuth]);

  const isOwner = adminUser?.role === "owner";
  const isAdminUser = adminUser !== null;

  return (
    <AdminAuthContext.Provider value={{ adminUser, isLoading, isOwner, isAdminUser }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
