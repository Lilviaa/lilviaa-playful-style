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

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export function CartProvider({ children }: { children: ReactNode }) {
  // No localStorage — always fetch from backend so login/logout is reliable
  const [items, setItems] = useState<CartItem[]>([]);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  const fetchBackendCart = async (attempt = 1): Promise<void> => {
    try {
      await auth.authStateReady();

      if (!auth.currentUser) {
        console.warn("[Cart] No Firebase currentUser — skipping fetch");
        return;
      }

      // Force-refresh the token every time to avoid stale tokens
      const token = await auth.currentUser.getIdToken(true);

      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Cart] Fetch failed:", response.status, errText);
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          return fetchBackendCart(attempt + 1);
        }
        return;
      }

      const res = await response.json();
      console.log(`[Cart] Loaded ${res.length} items from DB`);

      const mappedItems: CartItem[] = res.map((row: any) => {
        const variant = row.product_variants;
        const product = variant.products;

        let price = product.base_price;
        if (product.is_sale_active) price = product.sale_price;
        if (variant.price_override) {
          price = product.is_sale_active
            ? Math.floor(variant.price_override * (product.sale_price / product.base_price))
            : variant.price_override;
        }

        return {
          slug: product.slug,
          name: product.name,
          price,
          image: product.image_urls[0] || "",
          size: variant.size,
          qty: row.quantity,
          max_qty: variant.stock,
          variant_id: row.product_variant_id,
        };
      });

      setItems(mappedItems);
    } catch (e) {
      console.error("[Cart] Error fetching cart:", e);
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, attempt * 1000));
        return fetchBackendCart(attempt + 1);
      }
    }
  };

  useEffect(() => {
    if (isLoading) return;
    if (user) {
      // 500ms delay ensures Firebase token is fully propagated after login
      const timer = setTimeout(() => fetchBackendCart(), 500);
      return () => clearTimeout(timer);
    } else {
      setItems([]);
    }
  }, [user?.id, isLoading]);

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
        body: JSON.stringify({ product_variant_id: item.variant_id, quantity: item.qty }),
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
    setItems((prev) => prev.filter((p) => !(p.slug === slug && p.size === size)));
    if (user && variant_id) {
      try {
        await apiFetch(`/cart/${variant_id}`, { method: "DELETE" });
      } catch (e) {
        console.error(e);
        fetchBackendCart();
      }
    }
  };

  const setQty: CartCtx["setQty"] = async (slug, size, qty, variant_id) => {
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
          body: JSON.stringify({ quantity: qty }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || "Failed to update quantity");
        }
      } catch (e: any) {
        console.error(e);
        toast.error(e.message || "Failed to update quantity");
        fetchBackendCart();
      }
    }
  };

  const clear = () => setItems([]);

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
