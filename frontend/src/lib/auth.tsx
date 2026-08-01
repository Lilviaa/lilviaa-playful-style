import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";
import { apiFetch } from "./api";
import { z } from "zod";

export interface User {
  id: string;
  email: string;
  role: string;
  full_name: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: Record<string, string>) => Promise<User | undefined>;
  registerUser: (userData: Record<string, string>) => Promise<User | undefined>;
  logout: () => Promise<void>;
  checkSession: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      // If we don't have cookies, this will fail with 401. That's fine.
      const res = await apiFetch("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        return data;
      } else {
        setUser(null);
        return null;
      }
    } catch (e) {
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (credentials: Record<string, string>) => {
    // We send form data because OAuth2PasswordRequestForm expects it
    const formData = new URLSearchParams();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: formData,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      }
    });

    if (!res.ok) {
      const errData = await res.json();
      let errorMessage = "Login failed";
      if (Array.isArray(errData.detail)) {
        errorMessage = errData.detail.map((e: any) => e.msg).join(", ");
      } else if (typeof errData.detail === "string") {
        errorMessage = errData.detail;
      }
      throw new Error(errorMessage);
    }

    // Now fetch the profile
    const userSession = await checkSession();
    
    // Attempt cart merge
    try {
      const rawCart = localStorage.getItem("lilviaa-cart-v1-guest");
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const items = parsed.map((item: any) => ({
            product_variant_id: item.variant_id,
            quantity: item.qty
          }));
          const mergeRes = await apiFetch("/cart/merge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items })
          });
          if (mergeRes.ok) {
            const data = await mergeRes.json();
            if (data.message && data.message.includes("adjusted")) {
              console.warn(data.message);
            }
          }
        }
        localStorage.removeItem("lilviaa-cart-v1-guest");
      }
    } catch (e) {
      console.error("Cart merge failed", e);
    }
    
    return userSession;
  };

  const registerUser = async (userData: Record<string, string>) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });

    const data = await res.json();

    if (!res.ok) {
      let errorMessage = "Registration failed";
      if (Array.isArray(data.detail)) {
        errorMessage = data.detail.map((e: any) => e.msg).join(", ");
      } else if (typeof data.detail === "string") {
        errorMessage = data.detail;
      }
      throw new Error(errorMessage);
    }

    // If verification is required, return the data for the caller to handle
    if (data.requires_verification) {
      return data; // { message, email, requires_verification }
    }

    // Fallback: if no verification needed (shouldn't happen with new flow), fetch session
    const userSession = await checkSession();
    
    // Attempt cart merge
    try {
      const rawCart = localStorage.getItem("lilviaa-cart-v1-guest");
      if (rawCart) {
        const parsed = JSON.parse(rawCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const items = parsed.map((item: any) => ({
            product_variant_id: item.variant_id,
            quantity: item.qty
          }));
          const mergeRes = await apiFetch("/cart/merge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items })
          });
          if (mergeRes.ok) {
            const mergeData = await mergeRes.json();
            if (mergeData.message && mergeData.message.includes("adjusted")) {
              console.warn(mergeData.message);
            }
          }
        }
        localStorage.removeItem("lilviaa-cart-v1-guest");
      }
    } catch (e) {
      console.error("Cart merge failed", e);
    }
    
    return userSession;
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
      localStorage.removeItem("lilviaa-cart-v1-guest");
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerUser, logout, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
