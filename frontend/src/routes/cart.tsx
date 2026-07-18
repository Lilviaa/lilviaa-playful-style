import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { formatINR, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your cart — lilviaa" },
      { name: "description", content: "Review the little outfits in your lilviaa cart." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, subtotal, clear } = useCart();
  const shipping = subtotal === 0 ? 0 : subtotal >= 999 ? 0 : 79;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-butter text-cocoa shadow-cute">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl text-cocoa">Your cart is snoozing</h1>
        <p className="mt-2 text-muted-foreground">
          Add some tiny outfits and let the fun begin.
        </p>
        <Link
          to="/shop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop"
        >
          Start shopping <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <h1 className="font-display text-4xl text-cocoa md:text-5xl">Your cart</h1>
      <p className="mt-2 text-muted-foreground">{items.length} lovely items</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <ul className="space-y-4">
          {items.map((it) => (
            <li
              key={it.slug + it.size}
              className="flex gap-4 rounded-3xl bg-card p-4 shadow-cute"
            >
              <img
                src={it.image}
                alt={it.name}
                className="h-28 w-28 shrink-0 rounded-2xl object-cover"
              />
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      to="/products/$slug"
                      params={{ slug: it.slug }}
                      className="font-display text-lg text-cocoa hover:text-primary"
                    >
                      {it.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">Size {it.size}</p>
                  </div>
                  <button
                    onClick={() => {
                      remove(it.slug, it.size);
                      toast("Removed from cart");
                    }}
                    className="rounded-full p-2 text-muted-foreground hover:bg-sand hover:text-primary"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center rounded-full bg-sand">
                    <button
                      onClick={() => setQty(it.slug, it.size, it.qty - 1)}
                      className="p-2 text-cocoa"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-bold text-cocoa">
                      {it.qty}
                    </span>
                    <button
                      onClick={() => setQty(it.slug, it.size, it.qty + 1)}
                      className="p-2 text-cocoa"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-bold text-cocoa">
                    {formatINR(it.price * it.qty)}
                  </span>
                </div>
              </div>
            </li>
          ))}
          <button
            onClick={() => {
              clear();
              toast("Cart cleared");
            }}
            className="text-xs font-semibold text-muted-foreground hover:text-primary"
          >
            Clear cart
          </button>
        </ul>

        <aside className="h-max rounded-3xl bg-card p-6 shadow-cute">
          <h2 className="font-display text-2xl text-cocoa">Order summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-semibold text-cocoa">{formatINR(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="font-semibold text-cocoa">
                {shipping === 0 ? "Free" : formatINR(shipping)}
              </dd>
            </div>
          </dl>
          {subtotal < 999 && (
            <p className="mt-3 rounded-xl bg-butter px-3 py-2 text-xs font-semibold text-cocoa">
              Add {formatINR(999 - subtotal)} more for free shipping ✨
            </p>
          )}
          <div className="mt-4 border-t border-border pt-4 flex justify-between text-lg font-bold text-cocoa">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop"
          >
            Checkout <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/shop"
            className="mt-2 block text-center text-xs font-semibold text-muted-foreground hover:text-cocoa"
          >
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
