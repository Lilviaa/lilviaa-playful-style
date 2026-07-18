import { useQuery } from "@tanstack/react-query";
import { MOCK_PRODUCTS, MOCK_VARIANTS, MOCK_IMAGES, Product, ProductVariant } from "./products-api";

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
      await delay(400);
      
      return MOCK_VARIANTS.map(variant => {
        const product = MOCK_PRODUCTS.find(p => p.id === variant.product_id);
        const images = MOCK_IMAGES.filter(i => i.product_id === variant.product_id).sort((a, b) => a.sort_order - b.sort_order);
        
        return {
          ...variant,
          product_name: product?.name || "Unknown Product",
          product_category: product?.category || "Uncategorized",
          product_image: images.length > 0 ? images[0].url : undefined,
          product_status: product?.status || "draft",
        };
      });
    }
  });
}
