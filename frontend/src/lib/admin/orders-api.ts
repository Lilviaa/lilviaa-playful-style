import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatOrderId } from "../utils";
import { apiFetch } from "@/lib/api";

export type OrderStatus = 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
export type PaymentMethod = 'cod' | 'razorpay';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface ShippingAddress {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string;
  product_name_snapshot: string;
  product_image_snapshot?: string;
  size: string;
  color: string;
  quantity: number;
  price_at_purchase: number;
}

export interface Order {
  id: string;
  customer_id?: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  shipping_address: ShippingAddress;
  tracking_number: string | null;
  call_confirmed: boolean;
  created_at: string;
  items?: OrderItem[];
}

export interface OrderFilters {
  status?: string;
  paymentMethod?: string;
  dateRange?: { from: Date; to: Date } | null;
  search?: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
}

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: async (): Promise<OrdersResponse> => {
      const params = new URLSearchParams();
      if (filters?.status && filters.status !== "all") params.set("status", filters.status);
      if (filters?.paymentMethod && filters.paymentMethod !== "all") params.set("paymentMethod", filters.paymentMethod);
      if (filters?.search) params.set("search", filters.search);

      const qs = params.toString();
      const res = await apiFetch(`/admin/orders/${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      const res = await apiFetch(`/admin/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update status");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Order ${formatOrderId(data.id)} marked as ${data.status}`);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });
}

export function useUpdateTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, trackingNumber }: { orderId: string, trackingNumber: string }) => {
      const res = await apiFetch(`/admin/orders/${orderId}/tracking`, {
        method: "PATCH",
        body: JSON.stringify({ tracking_number: trackingNumber }),
      });
      if (!res.ok) throw new Error("Failed to update tracking");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Tracking number updated");
    }
  });
}

export function useUpdateCallConfirmed() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, confirmed }: { orderId: string, confirmed: boolean }) => {
      const res = await apiFetch(`/admin/orders/${orderId}/call-confirmed`, {
        method: "PATCH",
        body: JSON.stringify({ call_confirmed: confirmed }),
      });
      if (!res.ok) throw new Error("Failed to update call confirmation");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Call confirmation updated");
    }
  });
}
