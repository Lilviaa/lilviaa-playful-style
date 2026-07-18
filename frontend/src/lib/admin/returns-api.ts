import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MOCK_ORDERS, Order, OrderItem } from "./orders-api";

// ==========================================
// TYPES
// ==========================================
export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "in_transit"
  | "received"
  | "refund_processed";

export type ReturnReason =
  | "size_issue"
  | "damaged"
  | "wrong_item"
  | "quality"
  | "changed_mind";

export type RefundMethod =
  | "original_payment"
  | "store_credit"
  | "bank_transfer";

export interface ReturnItem {
  id: string;
  return_id: string;
  order_item_id: string;
  quantity: number;
}

export interface Return {
  id: string;
  order_id: string;
  customer_name: string;
  customer_email: string;
  status: ReturnStatus;
  reason: ReturnReason;
  reason_note: string;
  unboxing_video_provided: boolean;
  refund_method: RefundMethod;
  refund_amount: number;
  rejection_note?: string;
  bank_account_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  created_at: string;
  items: ReturnItem[];
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
export let MOCK_RETURNS: Return[] = [
  {
    id: "RET-001",
    order_id: "ORD-8823",
    customer_name: "Priya Sharma",
    customer_email: "priya@example.com",
    status: "requested",
    reason: "size_issue",
    reason_note: "The shirt was too big, I need a smaller size.",
    unboxing_video_provided: true,
    refund_method: "store_credit",
    refund_amount: 1299,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    items: [
      { id: "RI-001", return_id: "RET-001", order_item_id: "OI-001", quantity: 1 },
    ],
  },
  {
    id: "RET-002",
    order_id: "ORD-8801",
    customer_name: "Rahul Verma",
    customer_email: "rahul.v@example.com",
    status: "approved",
    reason: "damaged",
    reason_note: "The kurta arrived with a torn sleeve.",
    unboxing_video_provided: true,
    refund_method: "original_payment",
    refund_amount: 1999,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    items: [
      { id: "RI-002", return_id: "RET-002", order_item_id: "OI-002", quantity: 1 },
    ],
  },
  {
    id: "RET-003",
    order_id: "ORD-8799",
    customer_name: "Anita Desai",
    customer_email: "anita.d@example.com",
    status: "rejected",
    reason: "changed_mind",
    reason_note: "I changed my mind about the color.",
    unboxing_video_provided: false,
    refund_method: "store_credit",
    refund_amount: 0,
    rejection_note: "Return rejected — no unboxing video provided and reason does not qualify under our returns policy.",
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    items: [
      { id: "RI-003", return_id: "RET-003", order_item_id: "OI-003", quantity: 2 },
    ],
  },
  {
    id: "RET-004",
    order_id: "ORD-8788",
    customer_name: "Priya Sharma",
    customer_email: "priya@example.com",
    status: "refund_processed",
    reason: "wrong_item",
    reason_note: "Received wrong color.",
    unboxing_video_provided: true,
    refund_method: "bank_transfer",
    refund_amount: 899,
    bank_account_name: "Priya Sharma",
    bank_account_number: "9876543210123456",
    bank_ifsc: "SBIN0001234",
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    items: [
      { id: "RI-004", return_id: "RET-004", order_item_id: "OI-004", quantity: 1 },
    ],
  },
];

// ==========================================
// HELPERS
// ==========================================
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const REASON_LABELS: Record<ReturnReason, string> = {
  size_issue: "Size Issue",
  damaged: "Damaged / Defective",
  wrong_item: "Wrong Item",
  quality: "Quality Issue",
  changed_mind: "Changed Mind",
};

export const STATUS_STEPS: ReturnStatus[] = [
  "requested",
  "approved",
  "in_transit",
  "received",
  "refund_processed",
];

/** Look up an order from our shared mock orders */
export function getOrderForReturn(orderId: string): Order | undefined {
  return MOCK_ORDERS.find((o) => o.id === orderId);
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================
export function useReturns(status?: ReturnStatus | "all") {
  return useQuery({
    queryKey: ["admin-returns", status],
    queryFn: async (): Promise<Return[]> => {
      await delay(400);
      let results = [...MOCK_RETURNS];
      if (status && status !== "all") {
        results = results.filter((r) => r.status === status);
      }
      return results.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function useReturn(id: string) {
  return useQuery({
    queryKey: ["admin-return", id],
    queryFn: async (): Promise<Return> => {
      await delay(300);
      const r = MOCK_RETURNS.find((r) => r.id === id);
      if (!r) throw new Error("Return not found");
      return r;
    },
  });
}

export function useUpdateReturnStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      rejectionNote,
    }: {
      id: string;
      status: ReturnStatus;
      rejectionNote?: string;
    }) => {
      await delay(400);
      const ret = MOCK_RETURNS.find((r) => r.id === id);
      if (!ret) throw new Error("Return not found");
      ret.status = status;
      if (rejectionNote) ret.rejection_note = rejectionNote;
      return ret;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-return", data.id] });
      toast.success("Return status updated!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRefundDetails() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      refund_method,
      refund_amount,
      bank_account_name,
      bank_account_number,
      bank_ifsc,
    }: {
      id: string;
      refund_method: RefundMethod;
      refund_amount: number;
      bank_account_name?: string;
      bank_account_number?: string;
      bank_ifsc?: string;
    }) => {
      await delay(350);
      const ret = MOCK_RETURNS.find((r) => r.id === id);
      if (!ret) throw new Error("Return not found");
      ret.refund_method = refund_method;
      ret.refund_amount = refund_amount;
      if (bank_account_name) ret.bank_account_name = bank_account_name;
      if (bank_account_number) ret.bank_account_number = bank_account_number;
      if (bank_ifsc) ret.bank_ifsc = bank_ifsc;
      return ret;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-return", data.id] });
      toast.success("Refund details saved!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useMarkVideoReceived() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, received }: { id: string; received: boolean }) => {
      await delay(300);
      const ret = MOCK_RETURNS.find((r) => r.id === id);
      if (!ret) throw new Error("Return not found");
      ret.unboxing_video_provided = received;
      return ret;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      queryClient.invalidateQueries({ queryKey: ["admin-return", data.id] });
      toast.success(
        data.unboxing_video_provided
          ? "Video marked as received via WhatsApp ✓"
          : "Video marked as not received"
      );
    },
  });
}

export function useCreateReturn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Omit<Return, "id" | "created_at">) => {
      await delay(500);
      const newReturn: Return = {
        ...data,
        id: `RET-${Date.now()}`,
        created_at: new Date().toISOString(),
      };
      MOCK_RETURNS.unshift(newReturn);
      return newReturn;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-returns"] });
      toast.success("Return request created!");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
