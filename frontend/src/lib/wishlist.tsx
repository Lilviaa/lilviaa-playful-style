import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "./auth";
import { type CartItem } from "./cart";

export type WishlistItem = Omit<CartItem, "size" | "qty" | "max_qty">;

type WishlistCtx = {
  items: WishlistItem[];
  add: (item: WishlistItem) => void;
  remove: (slug: string) => void;
  has: (slug: string) => boolean;
  clear: () => void;
  count: number;
};

const Ctx = createContext<WishlistCtx | null>(null);
const KEY = "lilviaa-wishlist-v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(() => {
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

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      setItems([]);
    }
  }, [user, isLoading]);

  useEffect(() => {
    if (isLoading) return; // Don't write back during initial auth loading to prevent wiping
    if (!user) return; // Guests don't have wishlists, so don't write empty lists
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, isLoading, user]);

  const add: WishlistCtx["add"] = (item) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setItems((prev) => {
      if (prev.some((p) => p.slug === item.slug)) return prev;
      return [...prev, item];
    });
  };

  const remove: WishlistCtx["remove"] = (slug) =>
    setItems((prev) => prev.filter((p) => p.slug !== slug));

  const has = (slug: string) => items.some((p) => p.slug === slug);

  const clear = () => setItems([]);
  const count = items.length;

  return (
    <Ctx.Provider value={{ items, add, remove, has, clear, count }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWishlist() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useWishlist must be used within WishlistProvider");
  return c;
}
