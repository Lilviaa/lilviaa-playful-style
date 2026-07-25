import { useQuery } from "@tanstack/react-query";
import type { Product } from "./products";
export const API_URL = "http://localhost:8000/api/v1";

export async function fetchProducts(category?: string, sort?: string): Promise<Product[]> {
  const url = new URL(`${API_URL}/products/`);
  if (category && category !== "all") url.searchParams.append("category", category);
  if (sort && sort !== "featured") {
    // Map frontend sort values to backend expected values
    const backendSort = sort.replace("-", "_");
    url.searchParams.append("sort", backendSort);
  }
  const res = await fetch(url.toString());
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
export function useProducts(category?: string, sort?: string) {
  return useQuery({
    queryKey: ["products", category, sort],
    queryFn: () => fetchProducts(category, sort),
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

export type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  emoji?: string;
  applicable_genders: string[];
};

export async function fetchCategories(): Promise<Category[]> {
  const res = await fetch(`${API_URL}/categories/`);
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });
}
