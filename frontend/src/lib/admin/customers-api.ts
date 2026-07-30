import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export type CustomerTag = 'repeat' | 'high_value' | 'vip' | string;

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  is_guest: boolean;
  created_at: string;
  tags: CustomerTag[];
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

export function useCustomers(search?: string, sortBy: 'spend' | 'recent' = 'recent') {
  return useQuery({
    queryKey: ["admin-customers", search, sortBy],
    queryFn: async (): Promise<Customer[]> => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sortBy) params.set("sort", sortBy);
      const qs = params.toString();
      const res = await apiFetch(`/admin/customers/${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      return res.json();
    }
  });
}

export function useCustomer(id: string) {
  return useQuery({
    queryKey: ["admin-customer", id],
    queryFn: async () => {
      const res = await apiFetch(`/admin/customers/${id}`);
      if (!res.ok) throw new Error("Customer not found");
      const data = await res.json();
      return data.customer as Customer;
    }
  });
}

export function useCustomerAddresses(id: string) {
  return useQuery({
    queryKey: ["admin-customer-addresses", id],
    queryFn: async (): Promise<CustomerAddress[]> => {
      const res = await apiFetch(`/admin/customers/${id}`);
      if (!res.ok) throw new Error("Customer not found");
      const data = await res.json();
      return data.addresses || [];
    }
  });
}

export function useCustomerOrders(email: string) {
  // We now fetch by customer ID from the detail endpoint instead of email.
  // The component using this should pass the customer ID.
  // For backward compatibility, we keep the hook signature but note:
  // this is now a no-op if email is empty.
  return useQuery({
    queryKey: ["admin-customer-orders", email],
    queryFn: async () => {
      // This data is already included in the useCustomer detail call.
      // Return empty array — the customer detail page fetches orders itself.
      return [];
    },
    enabled: !!email
  });
}

export function useUpdateCustomerTags() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, tags }: { id: string, tags: CustomerTag[] }) => {
      const res = await apiFetch(`/admin/customers/${id}/tags`, {
        method: "PATCH",
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) throw new Error("Failed to update tags");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-customers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-customer", data.id] });
      toast.success("Customer tags updated");
    }
  });
}
