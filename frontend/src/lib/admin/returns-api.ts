import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export type ReturnStatus = "requested" | "approved" | "rejected" | "received" | "refunded";
export type ReturnReason = "size_issue" | "damaged" | "wrong_item" | "quality" | "changed_mind";
export type RefundMethod = "original_payment" | "store_credit" | "bank_transfer";

export const REASON_LABELS: Record<ReturnReason, string> = {
  size_issue: "Size Issue",
  damaged: "Damaged / Defective",
  wrong_item: "Wrong Item",
  quality: "Quality Issue",
  changed_mind: "Changed Mind",
};

export const STATUS_STEPS: ReturnStatus[] = ["requested", "approved", "received", "refunded"];

export interface Return {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  status: ReturnStatus;
  reason: ReturnReason;
  reason_note?: string;
  unboxing_video_provided: boolean;
  unboxing_video_received: boolean;
  refund_method: RefundMethod;
  refund_amount: number;
  items: any[];
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Return>) => {
      // Mock API call
      return new Promise((resolve) => setTimeout(() => resolve(data), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return created successfully");
    }
  });
}

export function useReturns() {
  return useQuery({
    queryKey: ["admin-returns"],
    queryFn: async (): Promise<Return[]> => {
      return [];
    }
  });
}

export function useMarkVideoReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, received }: { id: string, received: boolean }) => {
      return new Promise((resolve) => setTimeout(() => resolve({ id, received }), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Video status updated");
    }
  });
}

export function useUpdateRefundDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, method, amount }: { id: string, method: RefundMethod, amount: number }) => {
      return new Promise((resolve) => setTimeout(() => resolve({ id, method, amount }), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Refund details updated");
    }
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string, status: ReturnStatus }) => {
      return new Promise((resolve) => setTimeout(() => resolve({ id, status }), 500));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return status updated");
    }
  });
}
