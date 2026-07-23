import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { useProducts } from "@/lib/products-api";
import { ProductCard } from "@/components/product-card";
import { Search as SearchIcon } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: SearchPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      q: (search.q as string) || "",
    };
  },
  head: () => ({
    meta: [{ title: "Search — lilviaa" }],
  }),
});

function SearchPage() {
  const { q } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });

  const { data: allProducts = [], isLoading } = useProducts();
  const results = useMemo(() => {
    if (!q) return [];
    const lowerQ = q.toLowerCase();
    return allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQ) ||
        p.description.toLowerCase().includes(lowerQ) ||
        (p.category && p.category.toLowerCase().includes(lowerQ))
    );
  }, [q, allProducts]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12 md:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="font-display text-4xl text-cocoa md:text-5xl">
          {q ? `Search results for "${q}"` : "Search"}
        </h1>
      </div>

      <div className="mt-16">
        {q ? (
          isLoading ? (
            <p className="text-muted-foreground text-center py-8">Searching...</p>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-lg">No results found for "{q}"</p>
              <p className="mt-2 text-sm">Try checking your spelling or using less specific keywords.</p>
            </div>
          )
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            <p className="text-lg">Type something above to start searching.</p>
          </div>
        )}
      </div>
    </div>
  );
}
