import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Order, OrderStatus } from "@/lib/admin/orders-api";
import { OrderStatusStepper } from "./order-status-stepper";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Printer, RefreshCcw, XCircle, RotateCcw, Loader2 } from "lucide-react";
import {
  useUpdateOrderStatus,
  useUpdateTracking,
  useUpdateCallConfirmed,
} from "@/lib/admin/orders-api";
import { useCreateReturn, ReturnReason, RefundMethod } from "@/lib/admin/returns-api";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox as CheckboxUI } from "@/components/ui/checkbox";

interface OrderDetailDrawerProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onPrint: () => void;
}

export function OrderDetailDrawer({ order, isOpen, onClose, onPrint }: OrderDetailDrawerProps) {
  const { mutate: updateStatus, isPending: updatingStatus } = useUpdateOrderStatus();
  const { mutate: updateTracking } = useUpdateTracking();
  const { mutate: updateCallConfirmed } = useUpdateCallConfirmed();
  const { mutate: createReturn, isPending: creatingReturn } = useCreateReturn();

  const [trackingNumber, setTrackingNumber] = useState(order?.tracking_number || "");
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnReason, setReturnReason] = useState<ReturnReason>("size_issue");
  const [returnNote, setReturnNote] = useState("");
  const [hasVideo, setHasVideo] = useState(false);

  // Sync tracking input when order changes
  if (
    order &&
    order.tracking_number !== trackingNumber &&
    trackingNumber === "" &&
    !order.tracking_number
  ) {
    // Only reset if both are effectively empty
  }

  if (!order) return null;

  const handleUpdateStatus = (newStatus: OrderStatus) => {
    updateStatus({ orderId: order.id, status: newStatus });
  };

  const handleSaveTracking = () => {
    updateTracking({ orderId: order.id, trackingNumber });
  };

  const isCOD = order.payment_method === "cod";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl bg-white overflow-y-auto p-6 z-50 shadow-2xl">
        {updatingStatus && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        <SheetHeader className="p-6 sm:p-0 pb-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="font-display text-2xl text-cocoa">Order {formatOrderId(order.id)}</SheetTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-2 border-cocoa/20 text-cocoa hover:bg-cocoa/5 rounded-full"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
            </div>
          </div>
          <SheetDescription>
            Placed on {new Date(order.created_at).toLocaleString()}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 sm:px-0 py-6 space-y-8">
          {/* Status Stepper */}
          <section className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
            <h3 className="font-semibold text-cocoa mb-2">Order Status</h3>
            <OrderStatusStepper order={order} onUpdateStatus={handleUpdateStatus} />

            {isCOD && order.status === "confirmed" && (
              <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3">
                <Checkbox
                  id="callConfirmed"
                  checked={order.call_confirmed}
                  onCheckedChange={(checked) =>
                    updateCallConfirmed({ orderId: order.id, confirmed: checked as boolean })
                  }
                  className="mt-1 border-amber-400 data-[state=checked]:bg-amber-500"
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="callConfirmed"
                    className="text-sm font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-amber-900"
                  >
                    Call Confirmed (COD Requirement)
                  </label>
                  <p className="text-sm text-amber-700">
                    You must call the customer to confirm this COD order before you can pack it.
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Customer & Shipping */}
          <section className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-cocoa/10 shadow-sm">
              <h3 className="font-semibold text-cocoa text-sm mb-3">Customer</h3>
              <p className="font-medium text-cocoa">{order.shipping_address.fullName}</p>
              <p className="text-sm text-muted-foreground mt-1">{order.shipping_address.email}</p>
              <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-cocoa/10 shadow-sm">
              <h3 className="font-semibold text-cocoa text-sm mb-3">Shipping Address</h3>
              <p className="text-sm text-cocoa leading-relaxed">
                {order.shipping_address.address}
                <br />
                {order.shipping_address.city}, {order.shipping_address.state}
                <br />
                {order.shipping_address.zip}
              </p>
            </div>
          </section>

          {/* Line Items */}
          <section className="bg-white rounded-2xl border border-cocoa/10 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-cocoa/10 bg-sand/30">
              <h3 className="font-semibold text-cocoa">Order Items</h3>
            </div>
            <div className="divide-y divide-cocoa/5">
              {order.items?.map((item) => (
                <div key={item.id} className="p-4 flex gap-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden bg-slate-100 border border-cocoa/10">
                    <img
                      src={item.product_image_snapshot || "https://placehold.co/100"}
                      alt={item.product_name_snapshot}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-cocoa truncate">{item.product_name_snapshot}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.color} • {item.size}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Qty: {item.quantity} × {formatINR(item.price_at_purchase)}
                    </p>
                  </div>
                  <div className="text-right font-semibold text-cocoa shrink-0">
                    {formatINR(item.price_at_purchase * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Payment & Tracking */}
          <section className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm space-y-6">
            <div>
              <h3 className="font-semibold text-cocoa mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatINR(order.subtotal)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount</span>
                    <span>-{formatINR(order.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>{order.shipping_fee === 0 ? "Free" : formatINR(order.shipping_fee)}</span>
                </div>
                <div className="flex justify-between font-bold text-base text-cocoa pt-2 border-t border-cocoa/10 mt-2">
                  <span>Total</span>
                  <span>{formatINR(order.total)}</span>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800 uppercase border border-slate-200">
                  {order.payment_method}
                </span>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 capitalize border border-emerald-200">
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-cocoa/10">
              <h3 className="font-semibold text-cocoa mb-3">Tracking Information</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter tracking number"
                  defaultValue={order.tracking_number || ""}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="bg-sand/30 border-cocoa/20"
                />
                <Button onClick={handleSaveTracking} className="rounded-full shrink-0">
                  Save
                </Button>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          {order.status !== "cancelled" && order.status !== "returned" && (
            <section className="flex flex-wrap gap-3 pt-4 border-t border-cocoa/10">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                onClick={() => handleUpdateStatus("cancelled")}
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
              {order.status === "delivered" && (
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 border-amber-200"
                  onClick={() => handleUpdateStatus("returned")}
                >
                  <RefreshCcw className="h-4 w-4" />
                  Mark Returned
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1 gap-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 border-purple-200"
                onClick={() => setShowReturnModal(true)}
              >
                <RotateCcw className="h-4 w-4" />
                New Return
              </Button>
            </section>
          )}

          {/* New Return Modal */}
          <Dialog open={showReturnModal} onOpenChange={setShowReturnModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Return Request</DialogTitle>
                <DialogDescription>
                  Manually create a return for <strong>{formatOrderId(order.id)}</strong>. Use this for phone or WhatsApp requests.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Reason</Label>
                  <Select value={returnReason} onValueChange={(v) => setReturnReason(v as ReturnReason)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="size_issue">Size Issue</SelectItem>
                      <SelectItem value="damaged">Damaged / Defective</SelectItem>
                      <SelectItem value="wrong_item">Wrong Item</SelectItem>
                      <SelectItem value="quality">Quality Issue</SelectItem>
                      <SelectItem value="changed_mind">Changed Mind</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Note (Optional)</Label>
                  <Textarea
                    placeholder="Customer's description of the issue..."
                    value={returnNote}
                    onChange={(e) => setReturnNote(e.target.value)}
                    className="rounded-xl"
                    rows={3}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <CheckboxUI
                    id="hasVideo"
                    checked={hasVideo}
                    onCheckedChange={(v) => setHasVideo(Boolean(v))}
                  />
                  <Label htmlFor="hasVideo">Customer provided unboxing video</Label>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                  Items for return will default to all items in this order. Refund amount defaults to order total.
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowReturnModal(false)}>Cancel</Button>
                <Button
                  disabled={creatingReturn}
                  onClick={() => {
                    createReturn({
                      order_id: order.id,
                      customer_name: order.shipping_address.fullName,
                      customer_email: order.shipping_address.email,
                      status: "requested",
                      reason: returnReason,
                      reason_note: returnNote,
                      unboxing_video_provided: hasVideo,
                      refund_method: order.payment_method === "cod" ? "bank_transfer" : "original_payment",
                      refund_amount: order.total,
                      items: (order.items || []).map((item, i) => ({
                        id: `RI-new-${i}`,
                        return_id: "",
                        order_item_id: item.id,
                        quantity: item.quantity,
                      })),
                    }, { onSuccess: () => setShowReturnModal(false) });
                  }}
                >
                  {creatingReturn ? "Creating..." : "Create Return"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
