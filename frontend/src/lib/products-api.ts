import { useQuery } from "@tanstack/react-query";
import type { Product } from "./products";
export const API_URL = "http://127.0.0.1:8000/api/v1";

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products/`);
  if (!res.ok) throw new Error("Failed to fetch products");
  return res.json();
}

export async function fetchFeaturedProducts(): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products/featured`);
  if (!res.ok) throw new Error("Failed to fetch featured products");
  return res.json();
}

export async function fetchProduct(slug: string): Promise<Product> {
  const res = await fetch(`${API_URL}/products/${slug}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Product not found");
    throw new Error("Failed to fetch product");
  }
  return res.json();
}

// React Query Hooks
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
  });
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["products", slug],
    queryFn: () => fetchProduct(slug),
    enabled: !!slug,
  });
}
