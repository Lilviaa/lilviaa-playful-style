import { createFileRoute, Link } from "@tanstack/react-router";
import { useReturn, getOrderForReturn, REASON_LABELS, useMarkVideoReceived } from "@/lib/admin/returns-api";
import { ReturnStatusStepper } from "@/components/admin/returns/return-status-stepper";
import { RefundMethodSelector } from "@/components/admin/returns/refund-method-selector";
import { formatINR } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, MessageCircle, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/returns/$returnId")({
  component: ReturnDetailPage,
});

function ReturnDetailPage() {
  const { returnId } = Route.useParams();
  const { data: ret, isLoading } = useReturn(returnId);
  const { mutate: markVideo, isPending: markingVideo } = useMarkVideoReceived();

  if (isLoading) {
    return <div className="text-muted-foreground p-8">Loading return details...</div>;
  }
  if (!ret) {
    return <div className="text-muted-foreground p-8">Return not found.</div>;
  }

  const order = getOrderForReturn(ret.order_id);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/admin/returns"
          className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-cocoa"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-3xl font-bold text-cocoa">{ret.id}</h1>
            <Badge variant="outline" className="text-sm">
              {REASON_LABELS[ret.reason]}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-0.5">
            For order <code className="font-mono text-sm">{ret.order_id}</code> ·{" "}
            {new Date(ret.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Customer & Return Info */}
        <div className="space-y-5">
          {/* Customer Card */}
          <div className="bg-white rounded-2xl p-5 border border-cocoa/10 shadow-sm space-y-3">
            <h2 className="font-semibold text-cocoa">Customer</h2>
            <div>
              <p className="font-medium text-cocoa">{ret.customer_name}</p>
              <p className="text-sm text-muted-foreground">{ret.customer_email}</p>
            </div>
          </div>

          {/* Return Reason */}
          <div className="bg-white rounded-2xl p-5 border border-cocoa/10 shadow-sm space-y-3">
            <h2 className="font-semibold text-cocoa">Reason</h2>
            <Badge variant="outline" className="capitalize">{REASON_LABELS[ret.reason]}</Badge>
            {ret.reason_note && (
              <p className="text-sm text-muted-foreground italic">"{ret.reason_note}"</p>
            )}
          </div>

          {/* WhatsApp Video Status */}
          <div className={`rounded-2xl p-5 border shadow-sm space-y-3 ${
            ret.unboxing_video_provided
              ? "bg-emerald-50 border-emerald-200"
              : "bg-amber-50 border-amber-200"
          }`}>
            <h2 className="font-semibold text-cocoa flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp Video
            </h2>
            <p className="text-xs text-muted-foreground">
              Customer sends the unboxing video via WhatsApp. Mark it received once you've confirmed it.
            </p>
            {ret.unboxing_video_provided ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Video received via WhatsApp
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs h-7"
                  disabled={markingVideo}
                  onClick={() => markVideo({ id: ret.id, received: false })}
                >
                  Undo
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-amber-700 text-sm font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Awaiting video via WhatsApp
                </div>
                <p className="text-xs text-amber-700">
                  Per our returns policy, a video is required for damage/wrong item claims.
                </p>
                <Button
                  size="sm"
                  className="rounded-full bg-amber-600 hover:bg-amber-700 text-xs h-7 gap-1.5"
                  disabled={markingVideo}
                  onClick={() => markVideo({ id: ret.id, received: true })}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Video Received
                </Button>
              </div>
            )}
          </div>

          {/* Linked Order Summary */}
          {order && (
            <div className="bg-white rounded-2xl p-5 border border-cocoa/10 shadow-sm space-y-3">
              <h2 className="font-semibold text-cocoa">Linked Order</h2>
              <div className="space-y-2 text-sm">
                {order.items?.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-sand/50 border border-cocoa/10 shrink-0">
                      <img
                        src={item.product_image_snapshot || "https://placehold.co/40"}
                        alt={item.product_name_snapshot}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-cocoa font-medium text-xs">{item.product_name_snapshot}</p>
                      <p className="text-xs text-muted-foreground">{item.size} · {item.color} · Qty {item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold shrink-0">
                      {formatINR(item.price_at_purchase * item.quantity)}
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-cocoa/10 flex justify-between font-bold text-cocoa text-sm">
                  <span>Order Total</span>
                  <span>{formatINR(order.total)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Status & Refund */}
        <div className="lg:col-span-2 space-y-5">
          {/* Status Stepper */}
          <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
            <h2 className="font-semibold text-cocoa mb-4">Return Status</h2>
            <ReturnStatusStepper ret={ret} />
          </div>

          {/* Refund Method */}
          {ret.status !== "requested" && ret.status !== "rejected" && (
            <div className="bg-white rounded-2xl p-6 border border-cocoa/10 shadow-sm">
              <h2 className="font-semibold text-cocoa mb-4">Refund Details</h2>
              <RefundMethodSelector ret={ret} order={order} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
