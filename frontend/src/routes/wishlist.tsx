import { createFileRoute, Link } from "@tanstack/react-router";
import { useWishlist } from "@/lib/wishlist";
import { HeartOff, ShoppingBag } from "lucide-react";
import { formatINR } from "@/lib/cart";

export const Route = createFileRoute("/wishlist")({
  component: WishlistPage,
  head: () => ({
    meta: [
      { title: "My Wishlist — lilviaa" },
    ],
  }),
});

function WishlistPage() {
  const { items, remove, clear } = useWishlist();

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-24">
      <div className="flex items-end justify-between mb-8">
        <h1 className="font-display text-4xl text-cocoa md:text-5xl">My Wishlist</h1>
        {items.length > 0 && (
          <button
            onClick={clear}
            className="text-sm font-semibold text-muted-foreground hover:text-cocoa transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center rounded-3xl bg-card p-8 text-center shadow-cute">
          <div className="mb-6 rounded-full bg-sand p-6 text-cocoa">
            <HeartOff className="h-10 w-10" />
          </div>
          <h2 className="mb-2 font-display text-2xl text-cocoa">Your wishlist is empty</h2>
          <p className="mb-8 max-w-md text-muted-foreground">
            Save items you love to your wishlist to easily find them later.
          </p>
          <Link
            to="/shop"
            className="rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95"
          >
            Explore Shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.slug} className="group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-cute">
              <Link to="/products/$slug" params={{ slug: item.slug }} className="relative aspect-[3/4] overflow-hidden bg-sand">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  remove(item.slug);
                }}
                className="absolute right-3 top-3 rounded-full bg-cream p-2 text-cocoa shadow-sm transition-transform hover:scale-110"
                aria-label="Remove from wishlist"
              >
                <HeartOff className="h-4 w-4" />
              </button>
              <div className="flex flex-col p-5">
                <h3 className="font-display text-lg font-semibold text-cocoa">
                  <Link to="/products/$slug" params={{ slug: item.slug }}>
                    {item.name}
                  </Link>
                </h3>
                <p className="mt-1 font-semibold text-primary">{formatINR(item.price)}</p>
                <Link
                  to="/products/$slug"
                  params={{ slug: item.slug }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-sand px-4 py-2.5 text-sm font-bold text-cocoa transition-colors hover:bg-cocoa hover:text-cream"
                >
                  <ShoppingBag className="h-4 w-4" /> View Product
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
