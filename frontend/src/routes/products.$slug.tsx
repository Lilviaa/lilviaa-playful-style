import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShieldCheck, Truck, Ruler } from "lucide-react";
import { findProduct, products, type Product } from "@/lib/products";
import { formatINR, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { SizeGuide } from "@/components/size-guide";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/products/$slug")({
  loader: ({ params }): { product: Product } => {
    const product = findProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return {
        meta: [
          { title: "Product not found — lilviaa" },
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
  const { product } = Route.useLoaderData() as { product: Product };
  const { add } = useCart();
  const { add: addToWishlist, remove: removeFromWishlist, has: inWishlistCheck } = useWishlist();
  const navigate = useNavigate();
  const [activeImg, setActiveImg] = useState(product.image);
  const [size, setSize] = useState(product.sizes[2] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  
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
      });
    }
  };

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  const handleAdd = () => {
    add({
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.image,
      size,
      qty,
    });
    toast.success(`${product.name} added to cart`, {
      description: `Size ${size} · Qty ${qty}`,
    });
  };

  const handleBuyNow = () => {
    handleAdd();
    navigate({ to: "/checkout" });
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      {/* Breadcrumbs */}
      <div className="mx-auto max-w-7xl px-6 pt-6 pb-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
        <Link to="/" className="hover:text-cocoa transition-colors">Home</Link> <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-cocoa transition-colors">Shop</Link> <span className="mx-2">/</span>
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
                <img src={g} alt={`${product.name} thumbnail ${i + 1}`} className="h-full w-full object-cover" />
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
            <img id="base-img" src={activeImg} alt={product.name} className="h-full w-full object-cover transition-opacity duration-200" />
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
          
          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold text-cocoa">{formatINR(product.price)}</span>
            {product.compareAt && (
              <span className="text-lg text-muted-foreground line-through decoration-muted-foreground/50">
                {formatINR(product.compareAt)}
              </span>
            )}
            {product.compareAt && (
              <span className="text-sm font-bold text-red-600">
                {Math.round(((product.compareAt - product.price) / product.compareAt) * 100)}% OFF
              </span>
            )}
          </div>
          <div className="mt-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Inclusive of all taxes
          </div>

          <hr className="my-8 border-border" />

          {/* Color Selection */}
          <div>
            <div className="mb-3 text-sm font-bold text-cocoa uppercase tracking-wider">
              Color: <span className="font-medium text-muted-foreground normal-case tracking-normal">{selectedColor.name}</span>
            </div>
            <div className="flex gap-3">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setSelectedColor(c)}
                  className={`h-10 w-10 rounded-full border p-1 transition-transform hover:scale-110 focus:outline-none ${
                    selectedColor.name === c.name ? "border-cocoa ring-1 ring-cocoa" : "border-border"
                  }`}
                  title={c.name}
                >
                  <div className="h-full w-full rounded-full" style={{ background: c.hex }} />
                </button>
              ))}
            </div>
          </div>

          {/* Size Selection */}
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

          {/* Quantity & Actions */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <div className="flex h-14 w-32 shrink-0 items-center justify-between border border-border px-4">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="text-cocoa hover:text-primary transition-colors">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-cocoa">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="text-cocoa hover:text-primary transition-colors">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                className="flex h-14 flex-1 items-center justify-center whitespace-nowrap bg-background border border-cocoa text-cocoa font-bold uppercase tracking-widest text-xs sm:text-sm hover:bg-cocoa hover:text-white transition-colors"
              >
                Add to Cart
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
              className="w-full h-14 flex items-center justify-center bg-cocoa text-white font-bold uppercase tracking-widest text-sm hover:bg-cocoa/90 transition-colors shadow-sm"
            >
              Buy it Now
            </button>
          </div>

          <hr className="my-10 border-border" />

          {/* Accordions */}
          <Accordion type="single" collapsible defaultValue="description" className="w-full">
            <AccordionItem value="description" className="border-border">
              <AccordionTrigger className="text-base font-bold text-cocoa uppercase tracking-wider hover:no-underline">
                Description
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2 pb-6">
                <p className="mb-4 text-cocoa/90">
                  Premium-quality fabric designed for comfort and durability. Perfect for festive occasions, family gatherings, and celebrations. Bright-colored Chinese / Ben Collar printed shirts with excellent finishing and a comfortable fit.
                </p>
                <ul className="list-disc list-outside ml-4 space-y-2 text-cocoa/80 text-sm">
                  <li>Price mentioned is for the <strong>shirt only</strong>. Dhoti or trousers are available at an additional cost.</li>
                  <li>We aim to display product colors as accurately as possible. However, slight variations may occur.</li>
                  <li>Manufactured in India and supplied directly from the manufacturer to the customer.</li>
                </ul>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="details" className="border-border">
              <AccordionTrigger className="text-base font-bold text-cocoa uppercase tracking-wider hover:no-underline">
                Product Details
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-6">
                <dl className="divide-y divide-border/50">
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Material</dt>
                    <dd className="text-muted-foreground text-right">Shimmer Silk with Inner Lining</dd>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Fit</dt>
                    <dd className="text-muted-foreground text-right">Regular Fit</dd>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Style</dt>
                    <dd className="text-muted-foreground text-right">Chinese / Ben Collar</dd>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Closure Type</dt>
                    <dd className="text-muted-foreground text-right">Button</dd>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Sleeve Type</dt>
                    <dd className="text-muted-foreground text-right">Half Sleeve</dd>
                  </div>
                  <div className="flex justify-between py-3 text-sm">
                    <dt className="font-semibold text-cocoa">Care Instructions</dt>
                    <dd className="text-muted-foreground text-right">Machine Wash</dd>
                  </div>
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
                      <h4 className="font-bold text-cocoa text-sm mb-1">Free Shipping</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">We offer free shipping across India on all prepaid orders above ₹999. Standard delivery takes 3-5 business days.</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="mt-1 bg-sand p-2 rounded-full h-8 w-8 flex items-center justify-center shrink-0">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-cocoa text-sm mb-1">Easy Returns</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Not the perfect fit? We accept returns within 7 days of delivery. The items must be unused, unwashed, and with all original tags attached.</p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

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
