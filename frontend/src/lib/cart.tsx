import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
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

const LS_KEY = "lilviaa-cart-v2";
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

function readCache(): CartItem[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function writeCache(items: CartItem[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch {}
}

function clearCache() {
  try {
    localStorage.removeItem(LS_KEY);
  } catch {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage immediately so cart shows on reload
  const [items, setItems] = useState<CartItem[]>(readCache);
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  // Track whether we're currently fetching to avoid double-fetches
  const fetchingRef = useRef(false);

  const setAndCache = (newItems: CartItem[]) => {
    setItems(newItems);
    writeCache(newItems);
  };

  const fetchBackendCart = async (): Promise<void> => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      // Wait for Firebase auth to fully initialize
      await auth.authStateReady();

      if (!auth.currentUser) {
        console.warn("[Cart] No Firebase user — cannot fetch cart");
        return;
      }

      // Get token WITHOUT force-refresh (force-refresh can fail on recently-issued tokens)
      const token = await auth.currentUser.getIdToken();

      const response = await fetch(`${API_BASE}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("[Cart] GET /cart failed:", response.status, errText);
        return;
      }

      const res = await response.json();
      console.log(`[Cart] DB returned ${res.length} items`);

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

      setAndCache(mappedItems);
    } catch (e) {
      console.error("[Cart] fetchBackendCart error:", e);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      // Small delay (300ms) to let Firebase token fully propagate after login
      const timer = setTimeout(fetchBackendCart, 300);
      return () => clearTimeout(timer);
    } else {
      // On logout: clear both memory and cache
      setItems([]);
      clearCache();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isLoading]);

  const add: CartCtx["add"] = async (item) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }

    // Optimistic update immediately
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.slug === item.slug && p.size === item.size);
      let next: CartItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + item.qty };
      } else {
        next = [...prev, item];
      }
      writeCache(next);
      return next;
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
      // Sync with real DB values
      await fetchBackendCart();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to add to cart");
      await fetchBackendCart(); // Rollback to real DB state
    }
  };

  const remove: CartCtx["remove"] = async (slug, size, variant_id) => {
    setItems((prev) => {
      const next = prev.filter((p) => !(p.slug === slug && p.size === size));
      writeCache(next);
      return next;
    });

    if (user && variant_id) {
      try {
        await apiFetch(`/cart/${variant_id}`, { method: "DELETE" });
      } catch (e) {
        console.error(e);
        await fetchBackendCart();
      }
    }
  };

  const setQty: CartCtx["setQty"] = async (slug, size, qty, variant_id) => {
    setItems((prev) => {
      const next = prev.map((p) =>
        p.slug === slug && p.size === size
          ? { ...p, qty: Math.min(p.max_qty, Math.max(1, qty)) }
          : p,
      );
      writeCache(next);
      return next;
    });

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
        await fetchBackendCart();
      }
    }
  };

  const clear = () => {
    setItems([]);
    clearCache();
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
