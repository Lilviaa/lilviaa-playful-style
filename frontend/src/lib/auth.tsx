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
  login: (credentials: Record<string, string>) => Promise<void>;
  registerUser: (userData: Record<string, string>) => Promise<void>;
  logout: () => Promise<void>;
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
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
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
    await checkSession();
  };

  const registerUser = async (userData: Record<string, string>) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData)
    });

    if (!res.ok) {
      const errData = await res.json();
      let errorMessage = "Registration failed";
      if (Array.isArray(errData.detail)) {
        errorMessage = errData.detail.map((e: any) => e.msg).join(", ");
      } else if (typeof errData.detail === "string") {
        errorMessage = errData.detail;
      }
      throw new Error(errorMessage);
    }

    // Registration also logs us in, so fetch profile
    await checkSession();
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, registerUser, logout }}>
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
