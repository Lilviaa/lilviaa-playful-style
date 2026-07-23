import { apiFetch } from "./api";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
}

export const getCategories = async (): Promise<Category[]> => {
  const res = await apiFetch("/categories/");
  if (!res.ok) throw new Error("Failed to fetch categories");
  return res.json();
};

export const createCategory = async (data: any): Promise<Category> => {
  const res = await apiFetch("/categories/", {
    method: "POST",
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create category");
  }
  return res.json();
};

export const updateCategory = async (id: string, data: any): Promise<Category> => {
  const res = await apiFetch(`/categories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update category");
  }
  return res.json();
};

export const deleteCategory = async (id: string): Promise<void> => {
  const res = await apiFetch(`/categories/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete category");
};
