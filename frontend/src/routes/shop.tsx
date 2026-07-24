import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useProducts, useCategories } from "@/lib/products-api";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/shop")({
  validateSearch: (search: Record<string, unknown>): { category?: string; tag?: string } => {
    return {
      category: typeof search.category === "string" ? search.category : undefined,
      tag: typeof search.tag === "string" ? search.tag : undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Shop all — lilviaa" },
      {
        name: "description",
        content:
          "Browse the full lilviaa collection — kurtas, shirts, party sets and dresses for babies and kids from 6 months to 7 years.",
      },
      { property: "og:title", content: "Shop all — lilviaa" },
      {
        property: "og:description",
        content: "The full lilviaa collection for babies and kids.",
      },
    ],
  }),
  component: ShopPage,
});

const genders = [
  { v: "all", l: "Everyone" },
  { v: "boys", l: "Boys" },
  { v: "girls", l: "Girls" },
  { v: "unisex", l: "Unisex" },
] as const;

function ShopPage() {
  const search = Route.useSearch();
  const [cat, setCat] = useState<string>(search.category ?? "all");
  const [tag, setTag] = useState<string>(search.tag ?? "all");
  const [gender, setGender] = useState<string>("all");
  const [sort, setSort] = useState<string>("featured");

  const { data: products = [], isLoading } = useProducts();
  const { data: dbCategories = [] } = useCategories();

  const items = useMemo(() => {
    let list = products.filter(
      (p) =>
        (cat === "all" || p.category === cat) &&
        (gender === "all" || p.gender === gender) &&
        (tag === "all" || p.tag === tag),
    );
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [cat, gender, tag, sort, products]);

  return (
    <div>
      <section className="bg-hero border-b border-border/60 px-6 py-14">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">Shop</p>
          <h1 className="mt-2 font-display text-4xl text-cocoa md:text-5xl">
            The whole playful wardrobe.
          </h1>
          <p className="mt-3 max-w-xl text-cocoa/80">
            Filter by mood, age or gender — every piece is designed for real,
            wiggly, jumpy, snack-y childhood.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center z-20">
            <span className="text-sm font-semibold text-cocoa">Category:</span>
            <CustomSelect
              value={cat}
              onChange={setCat}
              options={[
                { v: "all", l: "All" },
                ...dbCategories.map((c) => ({ v: c.slug, l: c.name })),
              ]}
            />
          </div>
          <FilterGroup
            label="Collection"
            options={[
              { v: "all", l: "All" },
              { v: "new", l: "New Arrivals" },
              { v: "bestseller", l: "Bestsellers" },
              { v: "sale", l: "Sale" }
            ]}
            value={tag}
            onChange={setTag}
          />
          <FilterGroup label="For" options={genders as any} value={gender} onChange={setGender} />
          <div className="mt-2 flex w-full flex-col gap-2 sm:ml-auto sm:mt-0 sm:w-auto sm:flex-row sm:items-center z-10">
            <span className="text-sm font-semibold text-cocoa">Sort:</span>
            <CustomSelect
              value={sort}
              onChange={setSort}
              options={[
                { v: "featured", l: "Featured" },
                { v: "price-asc", l: "Price: low to high" },
                { v: "price-desc", l: "Price: high to low" },
              ]}
            />
          </div>
        </div>

        {isLoading ? (
          <p className="mt-6 text-sm text-muted-foreground">Loading products...</p>
        ) : (
          <p className="mt-6 text-sm text-muted-foreground">{items.length} products</p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
        {!isLoading && items.length === 0 && (
          <div className="mt-16 rounded-3xl bg-card p-10 text-center shadow-cute">
            <p className="font-display text-2xl text-cocoa">Nothing here yet 🌱</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing filters — new drops arrive every fortnight.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { v: string; l: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <span className="text-sm font-semibold text-cocoa">{label}:</span>
      <div className="flex flex-wrap gap-1.5 rounded-[1.25rem] bg-card p-1 shadow-cute">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${value === o.v
                ? "bg-primary text-primary-foreground"
                : "text-cocoa/70 hover:text-cocoa"
              }`}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}

function CustomSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o) => o.v === value) || options[0];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative w-full sm:w-48" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-[1.25rem] bg-card px-4 py-1.5 text-sm font-bold text-cocoa shadow-cute transition-colors hover:text-primary focus:outline-none"
      >
        <span className="truncate">{selected.l}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </button>

      {isOpen && (
        <div className="absolute top-[calc(100%+8px)] z-50 max-h-60 w-full overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-cute">
          {options.map((o) => (
            <button
              key={o.v}
              onClick={() => {
                onChange(o.v);
                setIsOpen(false);
              }}
              className={`flex w-full items-center rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                value === o.v
                  ? "bg-primary text-primary-foreground font-bold"
                  : "font-semibold text-cocoa/70 hover:bg-muted hover:text-cocoa"
              }`}
            >
              {o.l}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
