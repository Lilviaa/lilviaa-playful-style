import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Minus, Plus, ShieldCheck, Truck, Ruler } from "lucide-react";
import { findProduct, products, type Product } from "@/lib/products";
import { formatINR, useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { ProductCard } from "@/components/product-card";
import { SizeGuide } from "@/components/size-guide";

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
  const [activeImg, setActiveImg] = useState(product.image);
  const [size, setSize] = useState(product.sizes[2] ?? product.sizes[0]);
  const [qty, setQty] = useState(1);
  
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

  return (
    <div>
      <div className="mx-auto max-w-7xl px-6 pt-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-cocoa">Home</Link> ·{" "}
        <Link to="/shop" className="hover:text-cocoa">Shop</Link> ·{" "}
        <span className="text-cocoa">{product.name}</span>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-8 md:grid-cols-2">
        <div>
          <div
            className="relative aspect-square overflow-hidden rounded-3xl bg-sand shadow-cute cursor-crosshair"
            onMouseEnter={() => {
              // Add a small flag to the window or state to handle hover
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
              className="pointer-events-none absolute inset-0 z-10 bg-sand opacity-0 transition-opacity duration-200"
              style={{
                backgroundImage: `url('${activeImg}')`,
                backgroundPosition: '50% 50%',
                backgroundSize: '250%',
                backgroundRepeat: 'no-repeat'
              }}
            />
          </div>
          <div className="mt-4 flex gap-3">
            {product.gallery.map((g, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(g)}
                className={`h-20 w-20 overflow-hidden rounded-2xl border-2 transition-colors ${
                  activeImg === g ? "border-primary" : "border-transparent"
                }`}
              >
                <img src={g} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          {product.tag && (
            <span className="inline-block rounded-full bg-butter px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-cocoa">
              {product.tag}
            </span>
          )}
          <h1 className="mt-3 font-display text-4xl leading-tight text-cocoa md:text-5xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl font-bold text-cocoa">{formatINR(product.price)}</span>
            {product.compareAt && (
              <span className="text-lg text-muted-foreground line-through">
                {formatINR(product.compareAt)}
              </span>
            )}
            <span className="text-xs font-semibold text-muted-foreground">
              Inclusive of all taxes
            </span>
          </div>
          <p className="mt-5 text-cocoa/80">{product.description}</p>

          <div className="mt-6">
            <div className="mb-2 text-sm font-bold text-cocoa">
              Color: <span className="font-normal text-cocoa/70">{product.colors[0].name}</span>
            </div>
            <div className="flex gap-2">
              {product.colors.map((c) => (
                <button
                  key={c.name}
                  className="h-9 w-9 rounded-full border-2 border-border transition-transform hover:scale-110"
                  style={{ background: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-bold text-cocoa">Size (age)</div>
              <SizeGuide>
                <button className="text-xs font-semibold text-primary hover:underline">
                  Size guide
                </button>
              </SizeGuide>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-cocoa hover:border-cocoa/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-stretch gap-3">
            <div className="flex items-center rounded-full bg-card shadow-cute">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="p-3 text-cocoa hover:text-primary"
                aria-label="Decrease"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-8 text-center font-bold text-cocoa">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="p-3 text-cocoa hover:text-primary"
                aria-label="Increase"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={handleAdd}
              className="flex-1 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5"
            >
              Add to cart · {formatINR(product.price * qty)}
            </button>
            <button
              onClick={toggleWishlist}
              className={`rounded-full border-2 border-border p-3 transition-colors ${
                inWishlist ? "bg-primary/10 text-primary border-primary/20" : "bg-card text-cocoa hover:text-primary"
              }`}
              aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
              <Heart className="h-5 w-5" fill={inWishlist ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            {[
              { i: Truck, t: "Free ship > ₹999" },
              { i: ShieldCheck, t: "Skin-safe fabric" },
              { i: Ruler, t: "Check size guide" },
            ].map(({ i: Icon, t }) => (
              <div key={t} className="rounded-2xl bg-sand p-3 text-center">
                <Icon className="mx-auto h-4 w-4 text-primary" />
                <div className="mt-1 font-semibold text-cocoa">{t}</div>
              </div>
            ))}
          </div>

          <dl className="mt-8 divide-y divide-border rounded-2xl bg-card p-5 shadow-cute">
            <div className="flex justify-between py-2 text-sm">
              <dt className="font-bold text-cocoa">Fabric</dt>
              <dd className="text-cocoa/80">{product.fabric}</dd>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <dt className="font-bold text-cocoa">Care</dt>
              <dd className="text-cocoa/80">{product.care}</dd>
            </div>
            <div className="flex justify-between py-2 text-sm">
              <dt className="font-bold text-cocoa">Age</dt>
              <dd className="text-cocoa/80">{product.ageRange}</dd>
            </div>
          </dl>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <h2 className="font-display text-2xl text-cocoa md:text-3xl">You may also love</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
