import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export interface Banner {
  id: string;
  image_url: string;
  title: string | null;
  subtitle: string | null;
  description?: string | null;
  link_url: string | null;
  sort_order: number;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export function useAdminBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async (): Promise<Banner[]> => {
      const res = await apiFetch("/admin/banners");
      if (!res.ok) throw new Error("Failed to fetch banners");
      return res.json();
    }
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Banner>) => {
      const res = await apiFetch("/admin/banners/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner created successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Banner>) => {
      const res = await apiFetch(`/admin/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner updated successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/banners/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete banner");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner deleted successfully");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReorderBanners() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; sort_order: number }[]) => {
      const res = await apiFetch("/admin/banners/reorder", {
        method: "POST",
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to reorder banners");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banners reordered");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function usePublicBanners() {
  return useQuery({
    queryKey: ["public-banners"],
    queryFn: async (): Promise<Banner[]> => {
      const res = await apiFetch("/banners");
      if (!res.ok) throw new Error("Failed to fetch public banners");
      return res.json();
    }
  });
}

