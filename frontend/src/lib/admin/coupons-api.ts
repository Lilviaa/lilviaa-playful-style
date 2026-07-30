import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// ==========================================
// TYPES
// ==========================================
export type CouponType = "flat" | "percent" | "free_shipping";
export type CouponScope = "store_wide" | "category" | "product";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  max_discount_cap: number | null;
  min_cart_value: number;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  scope: CouponScope;
  scope_ids: string[] | null;
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  times_used?: number;
  total_discount_given?: number;
}

export interface CouponUsage {
  id: string;
  coupon_id: string;
  coupon_code: string;
  customer_name: string;
  order_id: string;
  discount_applied: number;
  used_at: string;
}

// ==========================================
// HELPERS
// ==========================================

/** Compute a coupon's effective status for display */
export function getCouponStatus(coupon: Coupon): "active" | "expired" | "inactive" | "scheduled" {
  const now = new Date();
  const start = new Date(coupon.start_date);
  const end = new Date(coupon.end_date);

  if (!coupon.active) return "inactive";
  if (now > end) return "expired";
  if (now < start) return "scheduled";
  return "active";
}

export interface ValidationResult {
  valid: boolean;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
  coupon_id?: string;
}

export interface CartItem {
  productId: string;
  category: string;
  quantity: number;
  price: number;
}

export async function validateCoupon(
  code: string,
  cartTotal: number,
  userId: string | null,
): Promise<ValidationResult> {
  const res = await apiFetch("/orders/validate-coupon", {
    method: "POST",
    body: JSON.stringify({
      code,
      cart_total: cartTotal,
      user_id: userId,
    }),
  });
  if (!res.ok) {
    return { valid: false, discountAmount: 0, freeShipping: false, message: "Failed to validate coupon." };
  }
  return res.json();
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================
export function useCoupons() {
  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const res = await apiFetch("/admin/coupons/");
      if (!res.ok) throw new Error("Failed to fetch coupons");
      return res.json();
    },
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: ["admin-coupon", id],
    queryFn: async (): Promise<Coupon> => {
      const res = await apiFetch(`/admin/coupons/${id}`);
      if (!res.ok) throw new Error("Coupon not found");
      return res.json();
    },
  });
}

export function useCouponUsages(couponId: string) {
  return useQuery({
    queryKey: ["admin-coupon-usages", couponId],
    queryFn: async (): Promise<CouponUsage[]> => {
      const res = await apiFetch(`/admin/coupons/${couponId}/usages`);
      if (!res.ok) throw new Error("Failed to fetch usages");
      return res.json();
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Coupon, "id" | "created_at" | "times_used" | "total_discount_given">) => {
      const res = await apiFetch("/admin/coupons/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to create coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & Partial<Coupon>) => {
      const res = await apiFetch(`/admin/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to update coupon");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coupon", data.id] });
      toast.success("Coupon updated!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}

export function useToggleCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const res = await apiFetch(`/admin/coupons/${id}`, {
        method: "PUT",
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error("Failed to toggle coupon");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon status updated");
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/admin/coupons/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to delete coupon");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted!");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
}
