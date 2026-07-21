import { apiFetch } from "./api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export interface Address {
  id: string;
  type: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
}

export type AddressInput = Omit<Address, "id">;

export async function getAddresses(): Promise<Address[]> {
  const res = await apiFetch("/addresses/");
  if (!res.ok) {
    throw new Error("Failed to fetch addresses");
  }
  return res.json();
}

export async function createAddress(data: AddressInput): Promise<Address> {
  const res = await apiFetch("/addresses/", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create address");
  }
  return res.json();
}

export async function updateAddress(id: string, data: Partial<AddressInput>): Promise<Address> {
  const res = await apiFetch(`/addresses/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update address");
  }
  return res.json();
}

export async function deleteAddress(id: string): Promise<void> {
  const res = await apiFetch(`/addresses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to delete address");
  }
}

// React Query Hooks

export function useAddresses() {
  return useQuery({
    queryKey: ["addresses"],
    queryFn: getAddresses,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address added successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add address");
    }
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AddressInput> }) => updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address updated successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update address");
    }
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      toast.success("Address removed");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete address");
    }
  });
}
