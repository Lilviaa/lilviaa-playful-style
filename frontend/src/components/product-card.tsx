import { Link } from "@tanstack/react-router";
import { Heart, Star, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/products";
import { formatINR, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { cn } from "@/lib/utils";
import { ScrollReveal } from "@/components/scroll-reveal";
import { toast } from "sonner";

const tagStyles: Record<string, string> = {
  new: "bg-mint text-cocoa",
  bestseller: "bg-butter text-cocoa",
  sale: "bg-primary text-primary-foreground",
};

export function ProductCard({ product }: { product: Product }) {
  const { add: addToWishlist, remove: removeFromWishlist, has } = useWishlist();
  const { add: addToCart } = useCart();
  const inWishlist = has(product.slug);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inWishlist) {
      removeFromWishlist(product.slug);
    } else {
      addToWishlist({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        variant_id: product.variants?.[0]?.id || "",
      });
    }
  };

  let displayPrice = product.price;
  let displayCompareAt = product.compareAt;
  let hasMultiplePrices = false;
  
  if (product.variants && product.variants.length > 0) {
    const variantPrices = product.variants
      .map(v => v.price_override)
      .filter((p): p is number => p !== null);
      
    if (variantPrices.length > 0) {
      // The base value before any sale is compareAt (if on sale) or price (if not)
      const baseValue = product.compareAt && product.compareAt > 0 ? product.compareAt : product.price;
      
      const hasBasePriceVariants = product.variants.some(v => v.price_override === null);
      const allPrices = hasBasePriceVariants ? [baseValue, ...variantPrices] : variantPrices;
      
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);
      
      if (minPrice !== maxPrice) {
        hasMultiplePrices = true;
      }
      
      if (product.compareAt && product.compareAt > 0) {
        const discountMultiplier = product.price / product.compareAt;
        displayCompareAt = minPrice; // The pre-sale price of the cheapest variant
        displayPrice = Math.floor(minPrice * discountMultiplier);
      } else {
        displayPrice = minPrice;
        displayCompareAt = undefined;
      }
    }
  }

  // Calculate discount percentage
  let discountPercentage = 0;
  if (product.compareAt && product.compareAt > displayPrice) {
    discountPercentage = Math.round(((product.compareAt - displayPrice) / product.compareAt) * 100);
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const defaultVariant = product.variants?.[0];
    if (!defaultVariant) {
      toast.error("Product unavailable");
      return;
    }
    
    addToCart({
      slug: product.slug,
      name: product.name,
      price: displayPrice,
      image: product.image || "",
      size: defaultVariant.size || "Standard",
      qty: 1,
      max_qty: defaultVariant.stock || 10,
      variant_id: defaultVariant.id,
    });
    
    toast.success("Added to cart!");
  };

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
          {(product.tag || displayCompareAt) && (
            <span
              className={cn(
                "absolute left-2 top-2 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                (displayCompareAt || product.tag === "sale") ? tagStyles.sale : tagStyles[product.tag || ""],
              )}
            >
              {(displayCompareAt || product.tag === "sale") ? "Sale" : product.tag}
            </span>
          )}
          
          <div className="absolute left-2 bottom-2">
            <span className="inline-flex items-center gap-1 rounded bg-white/90 backdrop-blur-sm px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-cocoa shadow-sm">
              <span className="flex h-3 w-3 items-center justify-center rounded-full bg-primary text-white">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              </span>
              Lilviaa Assured
            </span>
          </div>

          <button
            onClick={toggleWishlist}
            className={cn(
              "absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-zinc-400 shadow-sm transition-all hover:scale-110",
              inWishlist ? "opacity-100 text-primary" : "opacity-0 group-hover:opacity-100 hover:text-primary"
            )}
            aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className="h-4 w-4" fill={inWishlist ? "currentColor" : "none"} />
          </button>
        </div>
        
        <div className="flex flex-1 flex-col gap-0.5 p-3">
          <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {product.category || "LILVIAA"}
          </p>
          
          <h3 className="text-sm font-medium leading-snug text-cocoa line-clamp-2 mt-0.5">
            {product.name}
          </h3>

          {product.reviewCount && product.reviewCount > 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-cocoa/80">
              <span className="flex items-center gap-0.5 bg-emerald-600 text-white px-1.5 py-0.5 rounded-[4px] font-bold">
                {product.rating} <Star className="h-2.5 w-2.5 fill-current" />
              </span>
              <span>{product.reviewCount} {product.reviewCount === 1 ? 'review' : 'reviews'}</span>
            </div>
          ) : (
            <div className="mt-1 h-[16px]"></div>
          )}

          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-base font-bold text-cocoa">
              {hasMultiplePrices && <span className="text-[10px] font-normal text-muted-foreground mr-1 uppercase">From</span>}
              {formatINR(displayPrice)}
            </span>
            {displayCompareAt && (
              <span className="text-[11px] font-medium text-muted-foreground line-through decoration-muted-foreground/50">
                {formatINR(displayCompareAt)}
              </span>
            )}
            {discountPercentage > 0 && (
              <span className="text-[11px] font-bold text-primary">
                {discountPercentage}% OFF
              </span>
            )}
          </div>
          
          <div className="mt-3 mt-auto">
            <button
              onClick={handleAddToCart}
              className="flex w-full items-center justify-center gap-1.5 rounded-md bg-[#fbbf24] px-3 py-2 text-xs font-bold text-cocoa shadow-sm hover:bg-[#f59e0b] transition-colors"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          </div>
        </div>
      </Link>
    </ScrollReveal>
  );
}
