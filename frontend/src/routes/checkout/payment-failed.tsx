import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ShieldAlert, RefreshCcw, ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiFetch } from "@/lib/api";

const searchSchema = z.object({
  order_id: z.string(),
  reason: z.string().optional(),
});

export const Route = createFileRoute("/checkout/payment-failed")({
  component: PaymentFailedPage,
  validateSearch: searchSchema,
});

function PaymentFailedPage() {
  const { order_id, reason } = Route.useSearch();
  const navigate = useNavigate();
  const [isRetrying, setIsRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setIsRetrying(true);
    setError(null);
    try {
      const res = await apiFetch(`/orders/${order_id}/retry-payment`, {
        method: "POST"
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Failed to retry payment");
      }

      // Initialize Razorpay with new order
      const options = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: "Lilviaa",
        description: "Order Payment Retry",
        order_id: data.razorpay_order_id,
        handler: async function (response: any) {
          setIsRetrying(true);
          try {
            const verifyRes = await apiFetch("/orders/verify-payment", {
              method: "POST",
              body: JSON.stringify({
                order_id: data.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (!verifyRes.ok) {
              throw new Error("Payment verification failed");
            }
            navigate({ to: "/order-success" });
          } catch (err: any) {
            setError(err.message || "Failed to verify payment");
            setIsRetrying(false);
          }
        },
        theme: {
          color: "#9C6644",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        setError("Payment failed: " + response.error.description);
        setIsRetrying(false);
      });
      rzp.open();

    } catch (err: any) {
      setError(err.message);
      setIsRetrying(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center animate-in fade-in duration-500">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm mb-8">
        <ShieldAlert className="h-12 w-12" />
      </div>
      
      <h1 className="font-display text-3xl font-bold text-cocoa mb-4">Payment Failed</h1>
      
      <p className="text-muted-foreground mb-8">
        {reason || "Your payment could not be completed. Your order has been saved and your items are still reserved."}
      </p>

      {error && (
        <div className="mb-8 rounded-xl bg-red-50 p-4 text-sm text-red-800 text-left">
          <p className="font-bold flex items-center gap-2 mb-1">
            <ShieldAlert className="h-4 w-4" />
            Retry Failed
          </p>
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="w-full rounded-2xl bg-[#9C6644] px-8 py-4 font-bold text-white transition-all hover:bg-[#8A5A3C] disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          {isRetrying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              <RefreshCcw className="h-5 w-5" />
              <span>Retry Payment</span>
            </>
          )}
        </button>

        <Link 
          to="/cart"
          className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-border bg-white px-8 py-4 font-bold text-cocoa transition-all hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Cart</span>
        </Link>
      </div>
      
      <p className="mt-8 text-xs text-muted-foreground">
        Order Reference: #{order_id.split('-')[0]}
      </p>
    </div>
  );
}
