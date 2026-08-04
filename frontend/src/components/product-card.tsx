import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/scroll-reveal";

const tagStyles: Record<string, string> = {
  new: "bg-mint text-cocoa",
  bestseller: "bg-butter text-cocoa",
  sale: "bg-primary text-primary-foreground",
};

export function ProductCard({ product }: { product: Product }) {
  const { add, remove, has } = useWishlist();
  const inWishlist = has(product.slug);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      remove(product.slug);
    } else {
      add({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        variant_id: product.variants?.[0]?.id || "",
      });
    }
  };

  let displayPrice = product.price;
  let hasMultiplePrices = false;
  
  if (product.variants && product.variants.length > 0) {
    const variantPrices = product.variants
      .map(v => v.price_override)
      .filter((p): p is number => p !== null);
      
    if (variantPrices.length > 0) {
      // Some variants might not have an override, in which case they use the base price.
      // We consider base price in the pool if not ALL variants have overrides.
      const hasBasePriceVariants = product.variants.some(v => v.price_override === null);
      const allPrices = hasBasePriceVariants ? [product.price, ...variantPrices] : variantPrices;
      
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      if (minPrice !== maxPrice) {
        hasMultiplePrices = true;
      }
      displayPrice = minPrice;
    }
  }

  return (
    <ScrollReveal>
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="group relative flex flex-col overflow-hidden rounded-3xl bg-card shadow-cute transition-all hover:-translate-y-1 hover:shadow-pop"
      >
        <div className="relative aspect-square overflow-hidden bg-sand">
          <img
            src={product.image || "/fallback-image.jpg"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
          {product.tag && (
            <span
              className={cn(
                "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-cute",
                tagStyles[product.tag],
              )}
            >
              {product.tag === "sale" ? "On sale" : product.tag}
            </span>
          )}
          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute right-3 top-3 rounded-full bg-cream/90 p-2 text-cocoa shadow-cute transition-all",
              inWishlist ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {product.ageRange}
          </p>
          <h3 className="font-display text-lg leading-tight text-cocoa">
            {product.name}
          </h3>
          <div className="mt-auto flex items-center gap-2 pt-2">
            <span className="text-base font-bold text-cocoa">
              {hasMultiplePrices && <span className="text-xs font-normal text-muted-foreground mr-1">From</span>}
              {formatINR(displayPrice)}
            </span>
            {product.compareAt && (
              <span className="text-sm text-muted-foreground line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
            <div className="ml-auto flex -space-x-1">
            </div>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
