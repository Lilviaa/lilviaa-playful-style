import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth";
import { apiFetch } from "./api";
import { toast } from "sonner";
import { auth } from "./firebase";

export type CartItem = {
  slug: string;
  name: string;
  price: number;
  image: string;
  size: string;
  qty: number;
  max_qty: number;
  variant_id: string;
};

type CartCtx = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (slug: string, size: string, variant_id?: string) => void;
  setQty: (slug: string, size: string, qty: number, variant_id?: string) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  refreshCart: () => void;
};

const Ctx = createContext<CartCtx | null>(null);

const KEY = "lilviaa-cart-snapshot-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  const fetchBackendCart = async () => {
    try {
      // Force-refresh the Firebase token before fetching cart.
      // This fixes the race condition where the auth state change fires
      // but the token is not yet available for apiFetch to use.
      await auth.authStateReady();
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1"}/cart`,
        { headers: { Authorization: `Bearer ${token}` }, credentials: "include" }
      );
      if (!response.ok) throw new Error("Failed to fetch cart");
      const res = await response.json();
      
      const mappedItems: CartItem[] = res.map((row: any) => {
        const variant = row.product_variants;
        const product = variant.products;
        
        let price = product.base_price;
        if (product.is_sale_active) {
            price = product.sale_price;
        }
        if (variant.price_override) {
            price = product.is_sale_active 
                ? Math.floor(variant.price_override * (product.sale_price / product.base_price))
                : variant.price_override;
        }

        return {
          slug: product.slug,
          name: product.name,
          price: price,
          image: product.image_urls[0] || "",
          size: variant.size,
          qty: row.quantity,
          max_qty: variant.stock,
          variant_id: row.product_variant_id
        };
      });
      
      setItems(mappedItems);
    } catch (e) {
      console.error("Failed to fetch backend cart", e);
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      fetchBackendCart();
    } else {
      setItems([]);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't wipe cache during initial load
    if (!user) return; // Only cache for logged in users
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, isLoading, user]);

  const add: CartCtx["add"] = async (item) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    // Optimistic update
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.slug === item.slug && p.size === item.size);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
        return next;
      }
      return [...prev, item];
    });

    try {
        const response = await apiFetch("/cart", {
          method: "POST",
          body: JSON.stringify({ product_variant_id: item.variant_id, quantity: item.qty })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to add to cart");
        }
        fetchBackendCart();
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Failed to add to cart");
        fetchBackendCart(); // Rollback
      }
  };

  const remove: CartCtx["remove"] = async (slug, size, variant_id) => {
    // Optimistic update
    setItems((prev) => prev.filter((p) => !(p.slug === slug && p.size === size)));

    if (user && variant_id) {
      try {
        await apiFetch(`/cart/${variant_id}`, { method: "DELETE" });
      } catch (e) {
        console.error(e);
        fetchBackendCart(); // Rollback
      }
    }
  };

  const setQty: CartCtx["setQty"] = async (slug, size, qty, variant_id) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((p) =>
        p.slug === slug && p.size === size
          ? { ...p, qty: Math.min(p.max_qty, Math.max(1, qty)) }
          : p,
      ),
    );

    if (user && variant_id) {
      try {
        const response = await apiFetch(`/cart/${variant_id}`, {
          method: "PUT",
          body: JSON.stringify({ quantity: qty })
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || "Failed to update quantity");
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Failed to update quantity");
        fetchBackendCart(); // Rollback
      }
    }
  };

  const clear = () => {
    setItems([]);
  };

  const count = items.length;
  const subtotal = items.reduce((s, i) => s + i.qty * i.price, 0);

  return (
    <Ctx.Provider value={{ items, add, remove, setQty, clear, count, subtotal, refreshCart: fetchBackendCart }}>
      {children}
    </Ctx.Provider>
  );
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}

export const formatINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
