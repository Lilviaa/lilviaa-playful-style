import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { auth } from "./firebase";
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { apiFetch } from "./api";

export function getFirebaseErrorMessage(error: any): string {
  if (!error || !error.code) return error?.message || "An unknown error occurred.";
  
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return "Invalid email or password.";
    case 'auth/email-already-in-use':
      return "An account already exists with this email address.";
    case 'auth/weak-password':
      return "Password should be at least 6 characters.";
    case 'auth/network-request-failed':
      return "Network error. Please check your internet connection.";
    case 'auth/too-many-requests':
      return "Too many attempts. Please try again later.";
    case 'auth/invalid-email':
      return "Please enter a valid email address.";
    case 'auth/user-disabled':
      return "This account has been disabled. Please contact support.";
    case 'auth/popup-closed-by-user':
      return "Google sign-in was cancelled.";
    default:
      return error.message || "An unexpected error occurred.";
  }
}

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
  isLoggingOut: boolean;
  login: (credentials: Record<string, string>) => Promise<User | undefined>;
  registerUser: (userData: Record<string, string>) => Promise<User | undefined>;
  logout: () => Promise<void>;
  checkSession: () => Promise<User | null>;
  resetPassword: (email: string) => Promise<void>;
  loginWithGoogle: () => Promise<User | undefined>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Sync Firebase User with our Backend (Supabase users table)
  const syncWithBackend = async (firebaseUser: any) => {
    try {
      const token = await firebaseUser.getIdToken();
      // Fetch full profile from our DB
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/firebase_auth/me`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.error) {
          setUser(data);
          return data;
        }
      }
      setUser(null);
      return null;
    } catch (e) {
      setUser(null);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncWithBackend(firebaseUser);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (credentials: Record<string, string>) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      
      if (!userCredential.user.emailVerified) {
        // Option to block login if not verified:
        // await firebaseSignOut(auth);
        // throw new Error("Please verify your email address before logging in.");
      }
      
      const dbUser = await syncWithBackend(userCredential.user);
      
      // Attempt cart merge via our standard apiFetch which now handles the Authorization header
      try {
        const rawCart = localStorage.getItem("lilviaa-cart-v1-guest");
        if (rawCart) {
          const parsed = JSON.parse(rawCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const items = parsed.map((item: any) => ({
              product_variant_id: item.variant_id,
              quantity: item.qty
            }));
            const mergeRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/cart/merge`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await userCredential.user.getIdToken()}`
              },
              body: JSON.stringify({ items })
            });
            if (mergeRes.ok) {
              localStorage.removeItem("lilviaa-cart-v1-guest");
            }
          }
        }
      } catch (e) {
        console.error("Failed to merge cart:", e);
      }

      return {
        ...dbUser,
        requires_verification: !userCredential.user.emailVerified
      };
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const registerUser = async (userData: Record<string, string>) => {
    try {
      // 1. Create in Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
      
      // 2. Send Email Verification
      await sendEmailVerification(userCredential.user);

      // 3. Sync to Supabase via our backend
      const token = await userCredential.user.getIdToken();
      const syncRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/firebase_auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone || null
        })
      });

      if (!syncRes.ok) {
        throw new Error("Failed to sync user to database");
      }
      
      const dbUser = await syncWithBackend(userCredential.user);
      
      return {
        ...dbUser,
        requires_verification: !userCredential.user.emailVerified
      };
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  const logout = async () => {
    setIsLoggingOut(true);
    try {
      await firebaseSignOut(auth);
      setUser(null);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const checkSession = async () => {
    if (auth.currentUser) {
      return await syncWithBackend(auth.currentUser);
    }
    return null;
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      
      const token = await userCredential.user.getIdToken();
      const syncRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/firebase_auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          uid: userCredential.user.uid,
          email: userCredential.user.email || "",
          full_name: userCredential.user.displayName || "Google User",
          phone: userCredential.user.phoneNumber || null
        })
      });

      if (!syncRes.ok) {
        throw new Error("Failed to sync Google user to database");
      }

      const dbUser = await syncWithBackend(userCredential.user);
      
      try {
        const rawCart = localStorage.getItem("lilviaa-cart-v1-guest");
        if (rawCart) {
          const parsed = JSON.parse(rawCart);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const items = parsed.map((item: any) => ({
              product_variant_id: item.variant_id,
              quantity: item.qty
            }));
            const mergeRes = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/cart/merge`, {
              method: "POST",
              headers: { 
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ items })
            });
            if (mergeRes.ok) {
              localStorage.removeItem("lilviaa-cart-v1-guest");
            }
          }
        }
      } catch (e) {
        console.error("Failed to merge cart:", e);
      }

      return dbUser;
    } catch (error: any) {
      throw new Error(getFirebaseErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoggingOut,
        login,
        registerUser,
        logout,
        checkSession,
        resetPassword,
        loginWithGoogle
      }}
    >
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
