import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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

// ==========================================
// MOCK DATABASE STATE (Simulating Supabase)
// ==========================================
export let MOCK_ORDERS: Order[] = [
  {
    id: "ORD-2026-001",
    status: "pending",
    payment_method: "cod",
    payment_status: "pending",
    subtotal: 1299,
    discount: 0,
    shipping_fee: 79,
    total: 1378,
    shipping_address: {
      fullName: "Priya Sharma",
      email: "priya@example.com",
      phone: "9876543210",
      address: "123 MG Road, Apt 4B",
      city: "Bangalore",
      state: "Karnataka",
      zip: "560001"
    },
    tracking_number: null,
    call_confirmed: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    items: [
      {
        id: "oi_1",
        order_id: "ORD-2026-001",
        product_id: "p_1",
        variant_id: "v_1",
        product_name_snapshot: "Sunny Picnic Shirt",
        product_image_snapshot: "https://images.unsplash.com/photo-1519241047957-be31d7379a5d?auto=format&fit=crop&q=80&w=400",
        size: "2-3 Yrs",
        color: "Yellow",
        quantity: 1,
        price_at_purchase: 1299,
      }
    ]
  },
  {
    id: "ORD-2026-002",
    status: "packed",
    payment_method: "razorpay",
    payment_status: "paid",
    subtotal: 2499,
    discount: 500,
    shipping_fee: 0,
    total: 1999,
    shipping_address: {
      fullName: "Rahul Verma",
      email: "rahul.v@example.com",
      phone: "9988776655",
      address: "45 Lotus Street",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400052"
    },
    tracking_number: null,
    call_confirmed: true,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    items: [
      {
        id: "oi_2",
        order_id: "ORD-2026-002",
        product_id: "p_2",
        variant_id: "v_3",
        product_name_snapshot: "Midnight Leaf Kurta",
        product_image_snapshot: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?auto=format&fit=crop&q=80&w=400",
        size: "4-5 Yrs",
        color: "Navy",
        quantity: 1,
        price_at_purchase: 1999,
      }
    ]
  },
  {
    id: "ORD-2026-003",
    status: "shipped",
    payment_method: "razorpay",
    payment_status: "paid",
    subtotal: 1798,
    discount: 0,
    shipping_fee: 0,
    total: 1798,
    shipping_address: {
      fullName: "Anita Desai",
      email: "anita.d@example.com",
      phone: "9123456780",
      address: "88 Park Avenue",
      city: "Delhi",
      state: "Delhi",
      zip: "110001"
    },
    tracking_number: "DEL123456789",
    call_confirmed: true,
    created_at: new Date(Date.now() - 172800000).toISOString(),
    items: [
      {
        id: "oi_3",
        order_id: "ORD-2026-003",
        product_id: "p_3",
        variant_id: "v_4",
        product_name_snapshot: "Sunset Orange Romper",
        product_image_snapshot: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=400",
        size: "1-2 Yrs",
        color: "Orange",
        quantity: 2,
        price_at_purchase: 899,
      }
    ]
  }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export interface OrderFilters {
  status?: string;
  paymentMethod?: string;
  dateRange?: { from: Date; to: Date } | null;
  search?: string;
}

export function useOrders(filters?: OrderFilters) {
  return useQuery({
    queryKey: ["admin-orders", filters],
    queryFn: async (): Promise<Order[]> => {
      await delay(400);
      
      let filtered = [...MOCK_ORDERS];
      
      if (filters?.status && filters.status !== "all") {
        filtered = filtered.filter(o => o.status === filters.status);
      }
      
      if (filters?.paymentMethod && filters.paymentMethod !== "all") {
        filtered = filtered.filter(o => o.payment_method === filters.paymentMethod);
      }
      
      if (filters?.search) {
        const query = filters.search.toLowerCase();
        filtered = filtered.filter(o => 
          o.id.toLowerCase().includes(query) ||
          o.shipping_address.fullName.toLowerCase().includes(query) ||
          o.shipping_address.phone.includes(query)
        );
      }

      // We skip exact dateRange filtering in mock for simplicity unless needed,
      // but you can add it here.
      
      // Sort by newest first
      return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      await delay(500);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      
      if (status === 'packed' && order.payment_method === 'cod' && !order.call_confirmed) {
        throw new Error("COD orders require call confirmation before packing.");
      }
      
      order.status = status;
      return order;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success(`Order ${data.id} marked as ${data.status}`);
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
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      order.tracking_number = trackingNumber;
      return order;
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
      await delay(300);
      const order = MOCK_ORDERS.find(o => o.id === orderId);
      if (!order) throw new Error("Order not found");
      order.call_confirmed = confirmed;
      return order;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast.success("Call confirmation updated");
    }
  });
}
