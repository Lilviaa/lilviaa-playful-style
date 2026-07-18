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
  const { user } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate a network request to Supabase to fetch user role
    setIsLoading(true);
    
    const timeout = setTimeout(() => {
      if (user) {
        // Mock authorization logic
        // For development, we'll allow any @lilviaa.com email to be an owner as well.
        const isOwner = OWNER_EMAILS.includes(user.email.toLowerCase()) || user.email.endsWith("@lilviaa.com");
        
        if (isOwner) {
          setAdminUser({ user, role: "owner" });
        } else {
          setAdminUser(null);
        }
      } else {
        setAdminUser(null);
      }
      setIsLoading(false);
    }, 400); // Slight delay to mock network

    return () => clearTimeout(timeout);
  }, [user]);

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
