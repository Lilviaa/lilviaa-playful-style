import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export type ProductStatus = "draft" | "published" | "archived";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  fabric: string;
  wash_care: string;
  category_id: string | null;
  category: string; // The joined category name for display
  category_slug?: string;
  gender: string;
  tag: string | null;
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
  file?: File;
}

export interface ProductWithDetails extends Product {
  variants: ProductVariant[];
  images: ProductImage[];
  total_stock: number;
}



// ==========================================
// API HOOKS
// ==========================================

export function useProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async (): Promise<ProductWithDetails[]> => {
      const res = await apiFetch("/admin/products/");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return data.map((p: any) => ({
        ...p,
        category: p.category?.name || "Uncategorized",
        category_slug: p.category?.slug || "",
        total_stock: p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
      }));
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["admin-product", id],
    queryFn: async (): Promise<ProductWithDetails | null> => {
      const res = await apiFetch("/admin/products/");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data: ProductWithDetails[] = await res.json();
      const cleanId = id.replace(/\s+/g, '-');
      const p: any = data.find((prod) => prod.id === cleanId);
      if (!p) return null;
      p.category_name = p.category?.name || "Uncategorized"; // map correctly
      p.category_slug = p.category?.slug || "";
      p.category = p.category?.name || "Uncategorized"; 
      p.total_stock = p.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0;
      return p;
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
      // Bulk update via individual PUT requests (since we only have single PUT endpoint)
      for (const id of ids) {
        const payload: any = { ...updates };
        
        // Convert pseudo-fields to actual fields
        if (updates.discount_percentage) {
          // We can't do math without the base price, so this is a bit broken in the UI without a dedicated endpoint.
          // For now, we will ignore discount_percentage on bulk unless we fetch the product first.
        }
        if (updates.clear_discount) {
          payload.sale_price = null;
          payload.sale_start = null;
          payload.sale_end = null;
        }
        delete payload.discount_percentage;
        delete payload.clear_discount;

        await apiFetch(`/admin/products/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
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
      const res = await apiFetch(`/admin/products/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status })
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Status updated");
    },
    onError: () => {
      toast.error("Failed to update status");
    }
  });
}

export function useDeleteProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      // Our backend doesn't have a bulk delete or even a single delete endpoint yet,
      // because we only implemented CREATE for Milestone 3! So we'll archive them instead.
      for (const id of ids) {
        await apiFetch(`/admin/products/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: "archived" })
        });
      }
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast.success("Products archived successfully");
    },
  });
}

export function useSaveProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductWithDetails, "total_stock">) => {
      const isNew = data.id.startsWith("p_new_") || data.id.startsWith("new_") || data.id === "new" || !data.id;
      
      const productPayload = {
        name: data.name,
        slug: data.slug,
        description: data.description,
        fabric: data.fabric,
        wash_care: data.wash_care,
        category_id: data.category_id,
        gender: data.gender,
        tag: data.tag,
        base_price: data.base_price,
        sale_price: data.sale_price,
        sale_start: data.sale_start,
        sale_end: data.sale_end,
        status: data.status,
      };

      let productId = data.id;
      let newlyCreated = false;

      if (isNew) {
        const res = await apiFetch(`/admin/products/`, {
          method: "POST",
          body: JSON.stringify(productPayload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to create product");
        }
        const created = await res.json();
        productId = created.id;
        newlyCreated = true;
      } else {
        const res = await apiFetch(`/admin/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(productPayload)
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.detail || "Failed to update product");
        }
      }

      try {
        // Handle variants (creation & updates)
        const incomingVariantIds = new Set(data.variants.map((v) => v.id));

      if (!isNew) {
        // Fetch existing variants to figure out if any were deleted
        const pRes = await apiFetch(`/admin/products/`);
        const pData = await pRes.json();
        const existingProduct = pData.find((prod: any) => prod.id === productId);
        if (existingProduct && existingProduct.variants) {
          for (const ev of existingProduct.variants) {
            if (!incomingVariantIds.has(ev.id)) {
              await apiFetch(`/admin/products/variants/${ev.id}`, { method: 'DELETE' });
            }
          }
        }
      }

      for (const v of data.variants) {
        const variantPayload = {
          size: v.size,
          color: v.color || null,
          sku: v.sku || null,
          stock: v.stock,
          price_override: v.price_override
        };

        if (v.id.includes("new_") || !v.id) {
          const res = await apiFetch(`/admin/products/${productId}/variants`, {
            method: "POST",
            body: JSON.stringify(variantPayload)
          });
          if (!res.ok) {
             const err = await res.json();
             throw new Error(err.detail || "Failed to create variant");
          }
        } else {
          // Update existing variant
          const res = await apiFetch(`/admin/products/variants/${v.id}`, {
            method: "PUT",
            body: JSON.stringify(variantPayload)
          });
          if (!res.ok) {
             const err = await res.json();
             throw new Error(err.detail || "Failed to update variant");
          }
        }
      }

      // For images
      if (data.images) {
        for (const [index, img] of data.images.entries()) {
          if (img.file) {
            // 1. Request presigned URL
            const reqRes = await apiFetch('/admin/products/upload/request-url', {
              method: 'POST',
              body: JSON.stringify({ filename: img.file.name, content_type: img.file.type })
            });
            if (!reqRes.ok) throw new Error("Failed to get upload URL");
            const { upload_url, file_path } = await reqRes.json();
            
            // 2. PUT to Supabase via backend (with apiFetch)
            const uploadRes = await apiFetch(upload_url, {
              method: 'PUT',
              body: img.file,
              headers: { 'Content-Type': img.file.type }
            });
            if (!uploadRes.ok) throw new Error("Failed to upload image");
            
            // 3. Confirm upload
            await apiFetch('/admin/products/upload/confirm', {
              method: 'POST',
              body: JSON.stringify({ file_path, product_id: productId, sort_order: index })
            });
          }
        }
      }
      } catch (err) {
        // Rollback product creation if variants/images fail
        if (newlyCreated && productId) {
          try {
            await apiFetch(`/admin/products/${productId}`, { method: 'DELETE' });
          } catch (rollbackErr) {
            console.error("Failed to rollback product creation", rollbackErr);
          }
        }
        throw err;
      }

      return productId;
    },
    onSuccess: async (id, variables) => {
      await queryClient.refetchQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["admin-product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      if (variables.slug) {
        queryClient.invalidateQueries({ queryKey: ["product", variables.slug] });
      }
      toast.success("Product saved successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save product");
    }
  });
}
