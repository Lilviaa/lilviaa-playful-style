import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { useCart, formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";

const searchSchema = z.object({
  order_id: z.string().optional(),
  amount: z.number().optional(),
});

export const Route = createFileRoute("/order-success")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      order_id: search.order_id as string | undefined,
      amount: search.amount ? Number(search.amount) : undefined,
    }
  },
  head: () => ({
    meta: [
      { title: "Payment Successful! — lilviaa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const search = Route.useSearch();
  const { clear } = useCart();
  const [orderNumber, setOrderNumber] = useState("");
  const amount = search.amount || 0;

  useEffect(() => {
    if (search.order_id) {
      setOrderNumber(formatOrderId(search.order_id));
    } else {
      setOrderNumber(`ORD-LV-${Math.floor(100000 + Math.random() * 900000)}`);
    }
    // Clear the cart if not Buy It Now
    const wasBuyNow = sessionStorage.getItem("wasBuyNow");
    if (!wasBuyNow) {
      clear();
    }
    sessionStorage.removeItem("wasBuyNow");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.order_id]);

  // Calculate estimated delivery dates
  const today = new Date();
  const deliveryStart = new Date(today);
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date(today);
  deliveryEnd.setDate(deliveryEnd.getDate() + 4);
  const deliveryString = `${deliveryStart.getDate()} ${deliveryStart.toLocaleString('default', { month: 'short' })} – ${deliveryEnd.getDate()} ${deliveryEnd.toLocaleString('default', { month: 'short' })}`;

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 text-green-600 shadow-sm animate-in zoom-in duration-500 mb-8">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-3">Payment Successful</h1>
      <p className="text-lg text-muted-foreground mb-8">
        Thank you for shopping with Lil Viaa. We've received your order.
      </p>
      
      {orderNumber && (
        <div className="rounded-3xl bg-card border border-border p-6 shadow-cute mb-10 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-border pb-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Order ID</span>
            <span className="font-bold text-cocoa text-lg">{orderNumber}</span>
          </div>
          <div className="flex justify-between items-center border-b border-border pb-4">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Amount Paid</span>
            <span className="font-bold text-cocoa text-lg">{formatINR(amount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2">
            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Estimated Delivery</span>
            <span className="font-bold text-cocoa">{deliveryString}</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          to="/account/orders"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent px-8 py-4 text-base font-bold text-primary transition-colors hover:bg-primary/5 active:scale-95"
        >
          <FileText className="h-5 w-5" /> View Order
        </Link>
        <Link
          to="/shop"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <ShoppingBag className="h-5 w-5" /> Continue Shopping
        </Link>
      </div>
    </div>
  );
}
