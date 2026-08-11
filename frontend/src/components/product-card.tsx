import { Link } from "@tanstack/react-router";
import { Heart, Star } from "lucide-react";
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

  // Calculate discount percentage
  let discountPercentage = 0;
  if (product.compareAt && product.compareAt > displayPrice) {
    discountPercentage = Math.round(((product.compareAt - displayPrice) / product.compareAt) * 100);
  }

  return (
    <ScrollReveal className="h-full">
      <Link
        to="/products/$slug"
        params={{ slug: product.slug }}
        className="h-full group relative flex flex-col overflow-hidden rounded-xl bg-card shadow-sm border border-border/50 transition-all hover:shadow-md"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-sand/30">
          <img
            src={product.image || "/fallback-image.jpg"}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {product.tag && (
            <span
              className={cn(
                "absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                tagStyles[product.tag] || "bg-primary text-primary-foreground",
              )}
            >
              {product.tag === "sale" ? "Sale" : product.tag}
            </span>
          )}
          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-400 shadow-sm transition-all hover:scale-110",
              inWishlist ? "opacity-100 text-rose-500" : "opacity-0 group-hover:opacity-100 hover:text-rose-500"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className="flex flex-1 flex-col gap-0.5 p-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              {product.category || "LILVIAA"}
            </p>
          </div>
          
          <h3 className="text-sm font-medium leading-snug text-cocoa line-clamp-2 mt-0.5 min-h-[2.5rem]">
            {product.name}
          </h3>

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-cocoa">
              {hasMultiplePrices && <span className="text-xs font-normal text-muted-foreground mr-1">From</span>}
              {formatINR(displayPrice)}
            </span>
            {product.compareAt && (
              <span className="text-xs text-muted-foreground line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="text-xs font-bold text-emerald-600">
                {discountPercentage}% off
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white shadow-sm">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 text-slate-900">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              Lilviaa Assured
            </span>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
