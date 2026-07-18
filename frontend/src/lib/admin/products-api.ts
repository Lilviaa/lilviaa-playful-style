import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ProductStatus = "draft" | "published" | "archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabric: string;
  wash_care: string;
  category: string;
  base_price: number;
  sale_price: number | null;
  sale_start: string | null;
  sale_end: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  sales: number;
  price_override: number | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  sort_order: number;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  total_stock: number;
}

// ==========================================
// MOCK DATABASE STATE (Simulating Supabase)
// ==========================================
export let MOCK_PRODUCTS: Product[] = [
  {
    id: "p_1",
    name: "Sunny Picnic Shirt",
    slug: "sunny-picnic-shirt",
    description: "A breezy cotton shirt perfect for sunny days.",
    fabric: "100% Cotton",
    wash_care: "Machine wash cold, tumble dry low.",
    category: "Shirts",
    base_price: 1299,
    sale_price: null,
    sale_start: null,
    sale_end: null,
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p_2",
    name: "Midnight Leaf Kurta",
    slug: "midnight-leaf-kurta",
    description: "An elegant dark kurta with subtle leaf embroidery.",
    fabric: "Cotton Silk Blend",
    wash_care: "Dry clean only.",
    category: "Kurtas",
    base_price: 2499,
    sale_price: 1999,
    sale_start: new Date().toISOString(),
    sale_end: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: "published",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "p_3",
    name: "Sunset Orange Romper",
    slug: "sunset-orange-romper",
    description: "Cute and comfortable romper for playdates.",
    fabric: "Organic Cotton",
    wash_care: "Hand wash cold.",
    category: "Rompers",
    base_price: 899,
    sale_price: null,
    sale_start: null,
    sale_end: null,
    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export let MOCK_VARIANTS: ProductVariant[] = [
  {
    id: "v_1",
    product_id: "p_1",
    size: "2-3 Yrs",
    color: "Yellow",
    sku: "SUN-SHRT-2-YEL",
    stock: 15,
    sales: 42,
    price_override: null,
  },
  {
    id: "v_2",
    product_id: "p_1",
    size: "3-4 Yrs",
    color: "Yellow",
    sku: "SUN-SHRT-3-YEL",
    stock: 8,
    sales: 15,
    price_override: null,
  },
  {
    id: "v_3",
    product_id: "p_2",
    size: "4-5 Yrs",
    color: "Navy",
    sku: "MID-KUR-4-NAV",
    stock: 3,
    sales: 89,
    price_override: null,
  }, // low stock
  {
    id: "v_4",
    product_id: "p_3",
    size: "1-2 Yrs",
    color: "Orange",
    sku: "SUN-RMP-1-ORG",
    stock: 0,
    sales: 12,
    price_override: null,
  }, // out of stock
];

export let MOCK_IMAGES: ProductImage[] = [
  {
    id: "i_1",
    product_id: "p_1",
    url: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=400",
    sort_order: 0,
  },
  {
    id: "i_2",
    product_id: "p_2",
    url: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=400",
    sort_order: 0,
  },
  {
    id: "i_3",
    product_id: "p_3",
    url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=400",
    sort_order: 0,
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ==========================================
// API HOOKS
// ==========================================

export function useProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<ProductWithDetails[]> => {
      await delay(600);
      return MOCK_PRODUCTS.map((product) => {
        const variants = MOCK_VARIANTS.filter((v) => v.product_id === product.id);
        const images = MOCK_IMAGES.filter((i) => i.product_id === product.id).sort(
          (a, b) => a.sort_order - b.sort_order,
        );
        const total_stock = variants.reduce((sum, v) => sum + v.stock, 0);
        return { ...product, variants, images, total_stock };
      });
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: async (): Promise<ProductWithDetails | null> => {
      await delay(400);
      const product = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!product) return null;

      const variants = MOCK_VARIANTS.filter((v) => v.product_id === product.id);
      const images = MOCK_IMAGES.filter((i) => i.product_id === product.id).sort(
        (a, b) => a.sort_order - b.sort_order,
      );
      const total_stock = variants.reduce((sum, v) => sum + v.stock, 0);

      return { ...product, variants, images, total_stock };
    },
    enabled: !!id && id !== "new",
  });
}

export function useBulkUpdateProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: Partial<Product> & { discount_percentage?: number; clear_discount?: boolean };
    }) => {
      await delay(800);
      MOCK_PRODUCTS = MOCK_PRODUCTS.map((p) => {
        if (ids.includes(p.id)) {
          let updatedProduct = { ...p, ...updates, updated_at: new Date().toISOString() };

          if (updates.discount_percentage) {
            updatedProduct.sale_price = Math.round(
              p.base_price * (1 - updates.discount_percentage / 100),
            );
          }
          if (updates.clear_discount) {
            updatedProduct.sale_price = null;
            updatedProduct.sale_start = null;
            updatedProduct.sale_end = null;
          }

          // Clean up custom fields before saving back to Product type
          delete (updatedProduct as any).discount_percentage;
          delete (updatedProduct as any).clear_discount;

          return updatedProduct;
        }
        return p;
      });
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Products updated successfully");
    },
    onError: () => {
      toast.error("Failed to update products");
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ProductStatus }) => {
      await delay(400);
      MOCK_PRODUCTS = MOCK_PRODUCTS.map((p) =>
        p.id === id ? { ...p, status, updated_at: new Date().toISOString() } : p,
      );
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Status updated");
    },
  });
}

export function useDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      await delay(500);
      MOCK_PRODUCTS = MOCK_PRODUCTS.filter((p) => !ids.includes(p.id));
      MOCK_VARIANTS = MOCK_VARIANTS.filter((v) => !ids.includes(v.product_id));
      MOCK_IMAGES = MOCK_IMAGES.filter((i) => !ids.includes(i.product_id));
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Products deleted successfully");
    },
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductWithDetails, "total_stock">) => {
      await delay(1000);
      const isNew = !MOCK_PRODUCTS.find((p) => p.id === data.id);

      // Save product
      const productData: Product = {
        id: data.id,
        name: data.name,
        slug: data.slug,
        description: data.description,
        fabric: data.fabric,
        wash_care: data.wash_care,
        category: data.category,
        base_price: data.base_price,
        sale_price: data.sale_price,
        sale_start: data.sale_start,
        sale_end: data.sale_end,
        status: data.status,
        created_at: isNew
          ? new Date().toISOString()
          : MOCK_PRODUCTS.find((p) => p.id === data.id)?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (isNew) {
        MOCK_PRODUCTS.push(productData);
      } else {
        MOCK_PRODUCTS = MOCK_PRODUCTS.map((p) => (p.id === data.id ? productData : p));
      }

      // Save variants
      MOCK_VARIANTS = MOCK_VARIANTS.filter((v) => v.product_id !== data.id);
      MOCK_VARIANTS.push(...data.variants);

      // Save images
      MOCK_IMAGES = MOCK_IMAGES.filter((i) => i.product_id !== data.id);
      MOCK_IMAGES.push(...data.images);

      return data.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      toast.success("Product saved successfully");
    },
  });
}
