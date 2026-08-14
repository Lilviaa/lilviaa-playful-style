import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ==========================================
// TYPES
// ==========================================
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  customer_id: string;
  customer_name: string;
  order_item_id: string | null;
  rating: number; // 1-5
  text: string;
  status: ReviewStatus;
  is_featured: boolean;
  created_at: string;
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================
export function useReviews(status?: ReviewStatus | "all") {
  return useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: async (): Promise<Review[]> => {
      let url = `/admin/reviews/`;
      if (status && status !== "all") {
        url += `?status=${status}`;
      }
      
      const res = await apiFetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch reviews");
      }
      return res.json();
    },
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ["admin-reviews-pending-count"],
    queryFn: async () => {
      const res = await apiFetch(`/admin/reviews/pending-count`);
      if (!res.ok) return 0;
      const data = await res.json();
      return data.count || 0;
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      const res = await apiFetch(`/admin/reviews/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to update review status");
      }
      return { id, status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-pending-count"] });
      const msg = data.status === "approved" ? "Review approved ✓" : "Review rejected";
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      const res = await apiFetch(`/admin/reviews/${id}/feature`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to feature review");
      }
      return { id, is_featured: featured };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(data.is_featured ? "Pinned to top of product reviews!" : "Unpinned from featured.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEditReviewText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const res = await apiFetch(`/admin/reviews/${id}/text`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to update review text");
      }
      return { id, text };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review text saved (typo fix applied).");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
export function useDeleteReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/reviews/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.detail || "Failed to delete review");
      }
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-pending-count"] });
      toast.success("Review permanently deleted.");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
