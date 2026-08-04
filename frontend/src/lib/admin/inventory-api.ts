import { useQuery } from "@tanstack/react-query";
import { ProductVariant, ProductWithDetails } from "./products-api";
import { apiFetch } from "@/lib/api";

export interface InventoryItem extends ProductVariant {
  product_name: string;
  product_category: string;
  product_image?: string;
  product_status: string;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function useInventoryVariants() {
  return useQuery({
    queryKey: ["admin-inventory-variants"],
    queryFn: async (): Promise<InventoryItem[]> => {
      const res = await apiFetch("/admin/products/");
      if (!res.ok) throw new Error("Failed to fetch products");
      const products: ProductWithDetails[] = await res.json();
      
      const activeProducts = products.filter(p => p.status !== "archived");
      
      const items: InventoryItem[] = [];
      for (const product of activeProducts) {
        if (!product.variants) continue;
        for (const variant of product.variants) {
          items.push({
            ...variant,
            product_name: product.name,
            product_category: typeof product.category === 'object' && product.category ? (product.category as any).name : (product.category || "Uncategorized"),
            product_image: product.images?.[0]?.url,
            product_status: product.status,
          });
        }
      }
      return items;
    }
  });
}
