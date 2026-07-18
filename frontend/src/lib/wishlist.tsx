import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type CartItem } from "./cart";

export type WishlistItem = Omit<CartItem, "size" | "qty">;

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
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  const add: WishlistCtx["add"] = (item) =>
    setItems((prev) => {
      if (prev.some((p) => p.slug === item.slug)) return prev;
      return [...prev, item];
    });

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
