import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// ==========================================
// TYPES
// ==========================================
export type CouponType = "flat" | "percent" | "free_shipping" | "bogo";
export type CouponScope = "store_wide" | "category" | "product";

export interface Coupon {
  id: string;
  code: string; // always uppercase
  type: CouponType;
  value: number; // e.g., 100 for ₹100 flat or 10 for 10%
  max_discount_cap: number | null; // for percent type: cap at e.g. ₹500
  min_cart_value: number;
  usage_limit_total: number | null;
  usage_limit_per_customer: number | null;
  scope: CouponScope;
  scope_ids: string[] | null; // category slugs or product IDs
  start_date: string;
  end_date: string;
  active: boolean;
  created_at: string;
  // Computed
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
// MOCK DATABASE STATE
// ==========================================
export let MOCK_COUPONS: Coupon[] = [
  {
    id: "CPN-001",
    code: "WELCOME10",
    type: "percent",
    value: 10,
    max_discount_cap: 200,
    min_cart_value: 500,
    usage_limit_total: 100,
    usage_limit_per_customer: 1,
    scope: "store_wide",
    scope_ids: null,
    start_date: new Date(Date.now() - 86400000 * 30).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 60).toISOString(),
    active: true,
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: "CPN-002",
    code: "FLAT200",
    type: "flat",
    value: 200,
    max_discount_cap: null,
    min_cart_value: 999,
    usage_limit_total: 50,
    usage_limit_per_customer: 1,
    scope: "store_wide",
    scope_ids: null,
    start_date: new Date(Date.now() - 86400000 * 10).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 20).toISOString(),
    active: true,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: "CPN-003",
    code: "FREESHIP",
    type: "free_shipping",
    value: 0,
    max_discount_cap: null,
    min_cart_value: 700,
    usage_limit_total: null,
    usage_limit_per_customer: null,
    scope: "store_wide",
    scope_ids: null,
    start_date: new Date(Date.now() - 86400000 * 5).toISOString(),
    end_date: new Date(Date.now() - 86400000 * 1).toISOString(), // EXPIRED
    active: true,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "CPN-004",
    code: "KIDSWEAR15",
    type: "percent",
    value: 15,
    max_discount_cap: 300,
    min_cart_value: 0,
    usage_limit_total: 200,
    usage_limit_per_customer: 2,
    scope: "category",
    scope_ids: ["Shirts", "Kurtas"],
    start_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    end_date: new Date(Date.now() + 86400000 * 90).toISOString(),
    active: false, // manually deactivated
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export let MOCK_COUPON_USAGES: CouponUsage[] = [
  {
    id: "USAGE-001",
    coupon_id: "CPN-001",
    coupon_code: "WELCOME10",
    customer_name: "Priya Sharma",
    order_id: "ORD-8823",
    discount_applied: 150,
    used_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "USAGE-002",
    coupon_id: "CPN-001",
    coupon_code: "WELCOME10",
    customer_name: "Rahul Verma",
    order_id: "ORD-8801",
    discount_applied: 199,
    used_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "USAGE-003",
    coupon_id: "CPN-002",
    coupon_code: "FLAT200",
    customer_name: "Anita Desai",
    order_id: "ORD-8799",
    discount_applied: 200,
    used_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "USAGE-004",
    coupon_id: "CPN-003",
    coupon_code: "FREESHIP",
    customer_name: "Priya Sharma",
    order_id: "ORD-8788",
    discount_applied: 99,
    used_at: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
];

// ==========================================
// HELPERS
// ==========================================
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/** Compute a coupon's effective status for display */
export function getCouponStatus(coupon: Coupon): "active" | "expired" | "inactive" | "scheduled" {
  const now = new Date();
  const start = new Date(coupon.start_date);
  const end = new Date(coupon.end_date);

  // ⚠️  NOTE: True auto-expiry (past end_date) requires a Supabase pg_cron job or Edge Function
  // running on the backend — client-side checks are for display only and cannot be trusted
  // for enforcement. Flag this when integrating with real Supabase.
  if (!coupon.active) return "inactive";
  if (now > end) return "expired";
  if (now < start) return "scheduled";
  return "active";
}

function withUsage(coupon: Coupon): Coupon {
  const usages = MOCK_COUPON_USAGES.filter((u) => u.coupon_id === coupon.id);
  return {
    ...coupon,
    times_used: usages.length,
    total_discount_given: usages.reduce((s, u) => s + u.discount_applied, 0),
  };
}

// ==========================================
// VALIDATE COUPON — Single source of truth
// Also import this in src/routes/checkout.tsx
// instead of reimplementing validation logic.
// ==========================================
export interface CartItem {
  productId: string;
  category: string;
  quantity: number;
  price: number;
}

export interface ValidationResult {
  valid: boolean;
  discountAmount: number;
  freeShipping: boolean;
  message: string;
}

export function validateCoupon(
  code: string,
  cartTotal: number,
  customerId: string | null,
  cartItems: CartItem[]
): ValidationResult {
  const coupon = MOCK_COUPONS.find(
    (c) => c.code.toUpperCase() === code.toUpperCase()
  );

  if (!coupon) {
    return { valid: false, discountAmount: 0, freeShipping: false, message: "Coupon not found." };
  }

  const status = getCouponStatus(coupon);
  if (status === "expired") {
    return { valid: false, discountAmount: 0, freeShipping: false, message: "This coupon has expired." };
  }
  if (status === "inactive") {
    return { valid: false, discountAmount: 0, freeShipping: false, message: "This coupon is not active." };
  }
  if (status === "scheduled") {
    return { valid: false, discountAmount: 0, freeShipping: false, message: "This coupon is not yet valid." };
  }

  if (cartTotal < coupon.min_cart_value) {
    return {
      valid: false,
      discountAmount: 0,
      freeShipping: false,
      message: `Minimum cart value of ₹${coupon.min_cart_value} required.`,
    };
  }

  // Usage limit check
  if (coupon.usage_limit_total !== null) {
    const totalUsed = MOCK_COUPON_USAGES.filter((u) => u.coupon_id === coupon.id).length;
    if (totalUsed >= coupon.usage_limit_total) {
      return { valid: false, discountAmount: 0, freeShipping: false, message: "This coupon has reached its usage limit." };
    }
  }

  // Per customer usage check
  if (coupon.usage_limit_per_customer !== null && customerId) {
    // In real code, this would be checked against the DB
    // For now, we skip this check client-side
  }

  // Scope check
  if (coupon.scope === "category" && coupon.scope_ids?.length) {
    const hasMatchingItem = cartItems.some((item) =>
      coupon.scope_ids!.includes(item.category)
    );
    if (!hasMatchingItem) {
      return {
        valid: false,
        discountAmount: 0,
        freeShipping: false,
        message: `Coupon only applies to: ${coupon.scope_ids.join(", ")}.`,
      };
    }
  }
  if (coupon.scope === "product" && coupon.scope_ids?.length) {
    const hasMatchingItem = cartItems.some((item) =>
      coupon.scope_ids!.includes(item.productId)
    );
    if (!hasMatchingItem) {
      return {
        valid: false,
        discountAmount: 0,
        freeShipping: false,
        message: "Coupon does not apply to any item in your cart.",
      };
    }
  }

  // Calculate discount
  let discountAmount = 0;
  let freeShipping = false;

  if (coupon.type === "flat") {
    discountAmount = Math.min(coupon.value, cartTotal);
  } else if (coupon.type === "percent") {
    discountAmount = (cartTotal * coupon.value) / 100;
    if (coupon.max_discount_cap !== null) {
      discountAmount = Math.min(discountAmount, coupon.max_discount_cap);
    }
  } else if (coupon.type === "free_shipping") {
    freeShipping = true;
    discountAmount = 0;
  } else if (coupon.type === "bogo") {
    // BOGO: simplest implementation - discount cheapest item in cart
    if (cartItems.length >= 2) {
      const prices = cartItems.map((i) => i.price).sort((a, b) => a - b);
      discountAmount = prices[0];
    }
  }

  return {
    valid: true,
    discountAmount: Math.round(discountAmount),
    freeShipping,
    message: `Coupon applied! You saved ₹${Math.round(discountAmount)}${freeShipping ? " + free shipping" : ""}.`,
  };
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================
export function useCoupons() {
  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      await delay(400);
      return MOCK_COUPONS.map(withUsage);
    },
  });
}

export function useCoupon(id: string) {
  return useQuery({
    queryKey: ["admin-coupon", id],
    queryFn: async (): Promise<Coupon> => {
      await delay(250);
      const coupon = MOCK_COUPONS.find((c) => c.id === id);
      if (!coupon) throw new Error("Coupon not found");
      return withUsage(coupon);
    },
  });
}

export function useCouponUsages(couponId: string) {
  return useQuery({
    queryKey: ["admin-coupon-usages", couponId],
    queryFn: async (): Promise<CouponUsage[]> => {
      await delay(200);
      return MOCK_COUPON_USAGES.filter((u) => u.coupon_id === couponId).sort(
        (a, b) => new Date(b.used_at).getTime() - new Date(a.used_at).getTime()
      );
    },
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Coupon, "id" | "created_at">) => {
      await delay(500);
      const existing = MOCK_COUPONS.find(
        (c) => c.code.toUpperCase() === data.code.toUpperCase()
      );
      if (existing) throw new Error("A coupon with this code already exists.");
      const newCoupon: Coupon = {
        ...data,
        code: data.code.toUpperCase(),
        id: `CPN-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      MOCK_COUPONS.push(newCoupon);
      return newCoupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Coupon> }) => {
      await delay(400);
      const idx = MOCK_COUPONS.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Coupon not found");
      MOCK_COUPONS[idx] = { ...MOCK_COUPONS[idx], ...data };
      return MOCK_COUPONS[idx];
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["admin-coupon", data.id] });
      toast.success("Coupon updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await delay(300);
      const coupon = MOCK_COUPONS.find((c) => c.id === id);
      if (!coupon) throw new Error("Coupon not found");
      coupon.active = active;
      return coupon;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon status updated!");
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await delay(400);
      const idx = MOCK_COUPONS.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error("Coupon not found");
      MOCK_COUPONS.splice(idx, 1);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon deleted.");
    },
  });
}
