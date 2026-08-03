import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShieldCheck, Truck, Ruler, Banknote } from "lucide-react";
import type { Product } from "@/lib/products";
import { fetchProduct, useProducts } from "@/lib/products-api";
import { formatINR, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/product-card";
import { SizeGuide } from "@/components/size-guide";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CustomerReviews } from "@/components/customer-reviews";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params }): Promise<{ product: Product }> => {
    try {
      const product = await fetchProduct(params.slug);
      return { product };
    } catch (e: any) {
      console.error("fetchProduct ERROR:", e);
      // Return the error so we can see it on the page!
      return { product: null as any, error: e.message || String(e) };
    }
  },
  head: ({ loaderData }) => {
    if (!loaderData || loaderData.error) {
      return {
        meta: [
          { title: "Error — lilviaa" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — lilviaa` },
        { name: "description", content: product.description },
        { property: "og:title", content: `${product.name} — lilviaa` },
        { property: "og:description", content: product.description },
        { property: "og:image", content: product.image },
        { name: "twitter:image", content: product.image },
      ],
    };
  },
  pendingComponent: ProductSkeleton,
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-3xl text-cocoa">We can't find that piece.</h1>
      <p className="mt-2 text-muted-foreground">It may have sold out or moved.</p>
      <Link
        to="/shop"
        className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground"
      >
        Back to shop
      </Link>
    </div>
  ),
  errorComponent: () => (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <h1 className="font-display text-2xl text-cocoa">Something went wobbly.</h1>
    </div>
  ),
});

function ProductPage() {
  const { product, error } = Route.useLoaderData() as { product: Product; error?: string };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, add, setQty: setCartQty, remove: removeFromCart } = useCart();
  const { add: addToWishlist, remove: removeFromWishlist, has: inWishlistCheck } = useWishlist();

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-display text-3xl text-cocoa">Debug Error</h1>
        <p className="mt-2 text-red-500 font-mono">{error}</p>
        <Link to="/shop" className="mt-6 inline-block rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground">
          Back to shop
        </Link>
      </div>
    );
  }

  const [activeImg, setActiveImg] = useState(product.image);
  const [size, setSize] = useState(product.sizes[2] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  
  // Find the exact variant based on selected size
  const activeVariant = product.variants?.find(v => v.size === size);

  let displayPrice = product.price;
  let displayCompareAt = product.compareAt;

  if (activeVariant?.price_override) {
    if (product.compareAt && product.compareAt > 0) {
      const discountMultiplier = product.price / product.compareAt;
      displayCompareAt = activeVariant.price_override;
      displayPrice = Math.floor(activeVariant.price_override * discountMultiplier);
    } else {
      displayPrice = activeVariant.price_override;
      displayCompareAt = undefined;
    }
  }

  const displayStock = activeVariant?.stock ?? product.stock ?? 0;
  const displaySku = activeVariant?.sku || product.sku;
  
  const { data: allProducts = [] } = useProducts();
  const related = allProducts.filter((p) => p.slug !== product.slug).slice(0, 4);

  const inWishlist = inWishlistCheck(product.slug);

  const toggleWishlist = () => {
    if (inWishlist) {
      removeFromWishlist(product.slug);
    } else {
      addToWishlist({
        slug: product.slug,
        name: product.name,
        price: product.price,
        image: product.image,
        variant_id: activeVariant?.id || "",
      });
    }
  };



  const cartItem = items.find(i => i.variant_id === (activeVariant?.id || ""));
  const inCart = !!cartItem;
  const currentQty = inCart ? cartItem.qty : qty;

  const handleMinus = () => {
    if (inCart) {
      if (currentQty === 1) removeFromCart(cartItem.slug, cartItem.size);
      else setCartQty(cartItem.slug, cartItem.size, currentQty - 1);
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handlePlus = () => {
    if (currentQty < displayStock) {
      if (inCart) {
        setCartQty(cartItem.slug, cartItem.size, currentQty + 1);
      } else {
        setQty((q) => q + 1);
      }
    } else {
      toast.error(`Only ${displayStock} items available in stock`);
    }
  };

  const handleAdd = () => {
    if (!user) {
      navigate({ to: "/login" });
      return false;
    }
    if (inCart) {
      // If already in cart, just go to cart/checkout or do nothing
      return true;
    }
    add({
      slug: product.slug,
      name: product.name,
      price: displayPrice,
      image: product.image,
      size,
      qty,
      max_qty: displayStock,
      variant_id: activeVariant?.id || "",
    });
    toast.success(`${product.name} added to cart`, {
      description: `Size ${size} · Qty ${qty}`,
    });
    return true;
  };

  const handleBuyNow = () => {
    if (handleAdd()) {
      navigate({ to: "/checkout" });
    }
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Link to="/" className="hover:text-cocoa transition-colors">Home</Link> <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-cocoa transition-colors">Shop</Link> <span className="mx-2">/</span>
        {product.category && (
          <>
            <Link to="/shop" search={{ category: product.category }} className="hover:text-cocoa transition-colors">
              {product.category.replace(/-/g, ' ')}
            </Link> <span className="mx-2">/</span>
          </>
        )}
        <span className="text-cocoa font-bold">{product.name}</span>
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 lg:gap-12 px-4 sm:px-6 py-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        {/* Left Column - Standard Gallery with Zoom */}
        <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
          {/* Thumbnails */}
          <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto scrollbar-none md:w-20 shrink-0">
            {product.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(g)}
                className={`h-24 md:h-24 w-20 md:w-full shrink-0 overflow-hidden rounded-xl bg-sand transition-all ${
                  activeImg === g ? "ring-2 ring-cocoa" : "opacity-60 hover:opacity-100"
                }`}
              >
                <img src={g || "/fallback-image.jpg"} alt={`${product.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>

          {/* Main Image with Zoom */}
          <div
            className="relative flex-1 aspect-[4/5] overflow-hidden rounded-2xl bg-sand cursor-crosshair group w-full"
            onMouseEnter={() => {
              document.getElementById('zoom-layer')?.classList.remove('opacity-0');
              document.getElementById('base-img')?.classList.add('opacity-0');
            }}
            onMouseLeave={() => {
              document.getElementById('zoom-layer')?.classList.add('opacity-0');
              document.getElementById('base-img')?.classList.remove('opacity-0');
            }}
            onMouseMove={(e) => {
              const elem = e.currentTarget;
              const { top, left, width, height } = elem.getBoundingClientRect();
              const xPercent = ((e.clientX - left) / width) * 100;
              const yPercent = ((e.clientY - top) / height) * 100;
              const zoomLayer = document.getElementById('zoom-layer');
              if (zoomLayer) {
                zoomLayer.style.backgroundPosition = `${xPercent}% ${yPercent}%`;
              }
            }}
          >
            <img id="base-img" src={activeImg || "/fallback-image.jpg"} alt={product.name} className="h-full w-full object-cover transition-opacity duration-200" />
            <div 
              id="zoom-layer"
              className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity duration-200"
              style={{
                backgroundImage: `url('${activeImg}')`,
                backgroundPosition: '50% 50%',
                backgroundSize: '250%',
                backgroundRepeat: 'no-repeat'
              }}
            />
          </div>
        </div>

        {/* Right Column - Sticky Details */}
        <div className="flex flex-col lg:sticky lg:top-24 h-fit">
          {product.tag && (
            <span className="mb-3 inline-block self-start border border-primary/20 bg-primary/5 text-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest">
              {product.tag}
            </span>
          )}
          
          <h1 className="font-display text-3xl leading-tight text-cocoa md:text-4xl">
            {product.name}
          </h1>
          
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="text-2xl font-bold text-cocoa">{formatINR(displayPrice)}</span>
            <span className="text-sm font-medium text-muted-foreground mt-1">
              + Shipping Charges
            </span>
            {displayCompareAt && (
              <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                {formatINR(displayCompareAt)}
              </span>
            )}
            {displayCompareAt && (
              <span className="text-sm font-bold text-red-600">
                {Math.round(((displayCompareAt - displayPrice) / displayCompareAt) * 100)}% OFF
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-col gap-2 text-sm font-medium text-cocoa/90">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">✓</span> Ships in 2–4 Days
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center h-4 w-4 rounded-full bg-green-100 text-green-700 text-[10px] font-bold">✓</span> Free Shipping above ₹3000
            </div>
          </div>

          <hr className="my-8 border-border" />

          {/* Size Selection */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-bold text-cocoa uppercase tracking-wider">Select Size</div>
                <SizeGuide>
                  <button className="flex items-center gap-1.5 text-xs font-bold text-cocoa hover:text-primary transition-colors uppercase tracking-widest">
                    <Ruler className="h-3.5 w-3.5" /> Size guide
                  </button>
                </SizeGuide>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-[4rem] px-4 py-3 text-sm font-bold transition-all ${
                      size === s
                        ? "bg-cocoa text-white ring-1 ring-cocoa"
                        : "bg-transparent text-cocoa border border-border hover:border-cocoa"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div className="mt-6 mb-2">
            {displayStock !== undefined && displayStock > 0 ? (
              <div className="flex items-center gap-2 text-sm font-bold text-amber-600 uppercase tracking-wider">
                Only {displayStock} left
              </div>
            ) : displayStock === 0 ? (
              <div className="flex items-center gap-2 text-sm font-bold text-red-600 uppercase tracking-wider">
                <div className="h-2 w-2 rounded-full bg-red-600"></div>
                Out of Stock
              </div>
            ) : null}
          </div>

          {/* Quantity & Actions */}
          <div className="mt-4 flex flex-col gap-4">
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <div className="flex h-14 w-32 shrink-0 items-center justify-between border border-border px-4">
                <button onClick={handleMinus} className="text-cocoa hover:text-primary transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-cocoa">{currentQty}</span>
                <button onClick={handlePlus} className="text-cocoa hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={inCart ? () => navigate({ to: "/checkout" }) : handleAdd}
                disabled={displayStock === 0}
                className={`flex h-14 flex-1 items-center justify-center whitespace-nowrap border font-bold uppercase tracking-widest text-xs sm:text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  inCart 
                    ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90" 
                    : "bg-background border-cocoa text-cocoa hover:bg-cocoa hover:text-white disabled:hover:bg-background disabled:hover:text-cocoa"
                }`}
              >
                {displayStock === 0 ? "Out of Stock" : inCart ? "Added To Cart (Checkout)" : "Add to Cart"}
              </button>
              <button
                onClick={toggleWishlist}
                className={`flex h-14 w-14 shrink-0 items-center justify-center border transition-colors ${
                  inWishlist ? "border-primary bg-primary/5 text-primary" : "border-border text-cocoa hover:border-cocoa"
                }`}
              >
                <Heart className="h-5 w-5" fill={inWishlist ? "currentColor" : "none"} />
              </button>
            </div>
            
            <button
              onClick={handleBuyNow}
              disabled={displayStock === 0}
              className="w-full h-14 flex items-center justify-center bg-cocoa text-white font-bold uppercase tracking-widest text-sm hover:bg-cocoa/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-cocoa"
            >
              Buy it Now
            </button>
          </div>

          {/* SKU, Category & Payments */}
          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-cocoa">SKU:</span> 
              <span className="text-muted-foreground">{displaySku || "N/A"}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-cocoa">Category:</span> 
              <span className="text-muted-foreground capitalize">{product.category.replace(/-/g, ' ') || "Uncategorized"}</span>
            </div>

            <div className="pt-6 mt-6 border-t border-border">
              <div className="text-xs font-bold text-center text-cocoa uppercase tracking-widest mb-4">
                Guaranteed Safe Checkout
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="h-8 w-14 bg-white border border-border rounded flex items-center justify-center shadow-sm p-2">
                  <img src="/asset/Checkout_logo/VISA-logo-768x432.png" alt="Visa" className="h-full w-full object-contain" />
                </div>
                <div className="h-8 w-14 bg-white border border-border rounded flex items-center justify-center shadow-sm p-1.5">
                  <img src="/asset/Checkout_logo/masterCard.png" alt="MasterCard" className="h-full w-full object-contain" />
                </div>
                <div className="h-8 w-14 bg-white border border-border rounded flex items-center justify-center shadow-sm p-1">
                  <img src="/asset/Checkout_logo/upi_logo_icon_169316.png" alt="UPI" className="h-full w-full object-contain" />
                </div>
                <div className="h-8 w-14 bg-white border border-border rounded flex items-center justify-center shadow-sm p-1.5">
                  <img src="/asset/Checkout_logo/pngwing.com.png" alt="GPay" className="h-full w-full object-contain" />
                </div>
                <div className="h-8 w-14 bg-white border border-border rounded flex items-center justify-center shadow-sm p-1.5">
                  <img src="/asset/Checkout_logo/pngwing.com (1).png" alt="PhonePe" className="h-full w-full object-contain" />
                </div>
              </div>
            </div>
          </div>

          <hr className="my-10 border-border" />

          {/* Accordions */}
          <Accordion type="single" collapsible defaultValue="description" className="w-full">
            <AccordionItem value="description" className="border-border">
              <AccordionTrigger className="text-base font-bold text-cocoa uppercase tracking-wider hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6">
                <div className="text-cocoa/90 whitespace-pre-line">
                  {product.description ? product.description : "No description available for this product."}
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="details" className="border-border">
              <AccordionTrigger className="text-base font-bold text-cocoa uppercase tracking-wider hover:no-underline">
                Product Details
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <dl className="divide-y divide-border/50">
                  {(() => {
                    let customDetails = null;
                    if (product.fabric && product.fabric.startsWith("[")) {
                      try {
                        const parsed = JSON.parse(product.fabric);
                        if (Array.isArray(parsed)) {
                          customDetails = parsed;
                        }
                      } catch (e) {
                        // fallback to string
                      }
                    }

                    // If it's explicitly a JSON array (even if empty)
                    if (customDetails !== null) {
                      if (customDetails.length === 0) return null;
                      
                      return customDetails.map((detail: any, i: number) => (
                        <div key={i} className="flex justify-between py-3 text-sm">
                          <dt className="font-semibold text-cocoa">{detail.key}</dt>
                          <dd className="text-muted-foreground text-right">{detail.value || "N/A"}</dd>
                        </div>
                      ));
                    }

                    // Fallback for old products that just have a raw fabric string
                    if (product.fabric || product.care) {
                      return (
                        <>
                          <div className="flex justify-between py-3 text-sm">
                            <dt className="font-semibold text-cocoa">Material</dt>
                            <dd className="text-muted-foreground text-right">{product.fabric || "N/A"}</dd>
                          </div>
                          <div className="flex justify-between py-3 text-sm">
                            <dt className="font-semibold text-cocoa">Care Instructions</dt>
                            <dd className="text-muted-foreground text-right">{product.care || "N/A"}</dd>
                          </div>
                        </>
                      );
                    }
                    
                    return null;
                  })()}

                  {product.gender && product.gender !== "unisex" && (
                    <div className="flex justify-between py-3 text-sm">
                      <dt className="font-semibold text-cocoa">Gender</dt>
                      <dd className="text-muted-foreground text-right capitalize">{product.gender}</dd>
                    </div>
                  )}
                  {product.ageRange && (
                    <div className="flex justify-between py-3 text-sm">
                      <dt className="font-semibold text-cocoa">Age Range</dt>
                      <dd className="text-muted-foreground text-right">{product.ageRange}</dd>
                    </div>
                  )}
                  <div className="flex justify-between pt-3 text-sm">
                    <dt className="font-semibold text-cocoa">Country of Origin</dt>
                    <dd className="text-muted-foreground text-right">India</dd>
                  </div>
                </dl>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shipping" className="border-border">
              <AccordionTrigger className="text-base font-bold text-cocoa uppercase tracking-wider hover:no-underline">
                Delivery & Returns
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="mt-1 bg-sand p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cocoa text-sm mb-1">Fast Delivery</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Orders are delivered within 2–4 business days in Tamil Nadu and 3–6 business days across the rest of India. Free shipping is available on orders above ₹3,000.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 bg-sand p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cocoa text-sm mb-1">Returns & Refunds</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Lil Viaa follows a No Return & No Refund Policy. Damaged or incorrect products must be reported within 48 hours of delivery with an unboxing video and product images for assistance.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <CustomerReviews productId={product.id} />

      <section className="mx-auto max-w-7xl px-6 py-16 border-t border-border mt-8">
        <h2 className="font-display text-2xl text-cocoa md:text-3xl text-center uppercase tracking-widest">You may also love</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-8">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-4">
        <Skeleton className="h-4 w-64 rounded-md" />
      </div>

      <div className="mx-auto grid max-w-7xl gap-8 lg:gap-12 px-4 sm:px-6 py-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <div className="flex flex-col-reverse md:flex-row gap-4 w-full">
          <div className="flex md:flex-col gap-3 overflow-x-auto md:w-20 shrink-0">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-20 md:w-full shrink-0 rounded-xl" />
            ))}
          </div>
          <div className="relative flex-1 aspect-[4/5] overflow-hidden rounded-2xl w-full">
            <Skeleton className="h-full w-full" />
          </div>
        </div>

        <div className="flex flex-col h-fit mt-4 lg:mt-0">
          <Skeleton className="h-10 w-3/4 mb-4" />
          <Skeleton className="h-8 w-1/4 mb-6" />
          
          <Skeleton className="h-16 w-full mb-6 rounded-2xl" />
          
          <div className="mt-4">
            <Skeleton className="h-6 w-20 mb-4" />
            <div className="flex flex-wrap gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-24 rounded-full" />
              ))}
            </div>
          </div>
          
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-14 w-32 rounded-full" />
            <Skeleton className="h-14 flex-1 rounded-full" />
            <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          </div>
        </div>
      </div>
    </div>
  );
}
