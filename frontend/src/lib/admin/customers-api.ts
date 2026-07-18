import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MOCK_ORDERS } from "./orders-api";

export type CustomerTag = 'repeat' | 'high_value' | 'vip' | string;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_guest: boolean;
  created_at: string;
  tags: CustomerTag[];
  // Computed fields (in a real app, aggregated on the server)
  total_orders?: number;
  total_spend?: number;
  last_order_date?: string | null;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  full_address: {
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  is_default: boolean;
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
export let MOCK_CUSTOMERS: Customer[] = [
  {
    id: "CUST-001",
    name: "Priya Sharma",
    email: "priya@example.com",
    phone: "9876543210",
    is_guest: true,
    created_at: new Date(Date.now() - 5000000).toISOString(),
    tags: [],
  },
  {
    id: "CUST-002",
    name: "Rahul Verma",
    email: "rahul.v@example.com",
    phone: "9988776655",
    is_guest: false,
    created_at: new Date(Date.now() - 100000000).toISOString(),
    tags: ["vip", "repeat"],
  },
  {
    id: "CUST-003",
    name: "Anita Desai",
    email: "anita.d@example.com",
    phone: "9123456780",
    is_guest: false,
    created_at: new Date(Date.now() - 200000000).toISOString(),
    tags: ["high_value"],
  }
];

export const MOCK_ADDRESSES: CustomerAddress[] = [
  {
    id: "ADDR-001",
    customer_id: "CUST-002", // Rahul
    label: "Home",
    full_address: {
      address: "45 Lotus Street",
      city: "Mumbai",
      state: "Maharashtra",
      zip: "400052"
    },
    is_default: true,
  },
  {
    id: "ADDR-002",
    customer_id: "CUST-003", // Anita
    label: "Work",
    full_address: {
      address: "88 Park Avenue",
      city: "Delhi",
      state: "Delhi",
      zip: "110001"
    },
    is_default: true,
  }
];

// Helper to compute stats for a customer based on MOCK_ORDERS
const computeCustomerStats = (customer: Customer): Customer => {
  // We identify orders by matching email since mock orders don't strictly have customer_id set.
  // In reality, orders would strictly tie to customer_id.
  const customerOrders = MOCK_ORDERS.filter(o => o.shipping_address.email === customer.email);
  
  const total_orders = customerOrders.length;
  // Sum only successful/paid/delivered type orders usually, but for now we sum all non-cancelled
  const total_spend = customerOrders
    .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
    .reduce((sum, o) => sum + o.total, 0);
    
  // Sort orders to find the most recent one
  const sortedOrders = [...customerOrders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const last_order_date = sortedOrders.length > 0 ? sortedOrders[0].created_at : null;

  return {
    ...customer,
    total_orders,
    total_spend,
    last_order_date
  };
};

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export function useCustomers(search?: string, sortBy: 'spend' | 'recent' = 'recent') {
  return useQuery({
    queryKey: ["admin-customers", search, sortBy],
    queryFn: async (): Promise<Customer[]> => {
      await delay(400);
      
      let results = MOCK_CUSTOMERS.map(computeCustomerStats);
      
      if (search) {
        const q = search.toLowerCase();
        results = results.filter(c => 
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
        );
      }

      if (sortBy === 'spend') {
        results.sort((a, b) => (b.total_spend || 0) - (a.total_spend || 0));
      } else {
        // default recent
        results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      }

      return results;
    }
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async (): Promise<Customer> => {
      await delay(300);
      const customer = MOCK_CUSTOMERS.find(c => c.id === id);
      if (!customer) throw new Error("Customer not found");
      return computeCustomerStats(customer);
    }
  });
}

export function useCustomerAddresses(id: string) {
  return useQuery({
    queryKey: ["admin-customer-addresses", id],
    queryFn: async (): Promise<CustomerAddress[]> => {
      await delay(200);
      return MOCK_ADDRESSES.filter(a => a.customer_id === id);
    }
  });
}

export function useCustomerOrders(email: string) {
  return useQuery({
    queryKey: ["admin-customer-orders", email],
    queryFn: async () => {
      await delay(300);
      return MOCK_ORDERS.filter(o => o.shipping_address.email === email)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!email
  });
}

export function useUpdateCustomerTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tags }: { id: string, tags: CustomerTag[] }) => {
      await delay(400);
      const customer = MOCK_CUSTOMERS.find(c => c.id === id);
      if (!customer) throw new Error("Customer not found");
      customer.tags = tags;
      return customer;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-customer", data.id] });
      toast.success("Customer tags updated");
    }
  });
}
