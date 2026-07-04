import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/product-card";
import { ArrowRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — lilviaa" },
      {
        name: "description",
        content: "Fresh out the box. Explore the newest drops and latest styles from lilviaa.",
      },
    ],
  }),
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  const [sort, setSort] = useState<string>("featured");

  const items = useMemo(() => {
    let list = products.filter((p) => p.tag === "new");
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [sort]);

  return (
    <div>
      <section className="bg-hero border-b border-border/60 px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">New Drops</p>
          <h1 className="mt-2 font-display text-4xl text-cocoa md:text-5xl">
            Fresh out the box.
          </h1>
          <p className="mt-3 max-w-xl text-cocoa/80">
            The newest additions to the Lilviaa family. Discover our latest playful styles and fresh seasonal collections.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-bold text-muted-foreground">{items.length} new styles</p>
          <div className="ml-auto">
            <label className="mr-2 text-sm font-semibold text-cocoa">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-semibold text-cocoa focus:border-primary focus:outline-none"
            >
              <option value="featured">Featured</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        
        {items.length === 0 && (
          <div className="mt-16 rounded-3xl bg-card p-10 text-center shadow-cute">
            <p className="font-display text-2xl text-cocoa">All sold out! 🌱</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Our new drops flew off the shelves. Check back soon!
            </p>
            <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5">
              Shop all collections <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
