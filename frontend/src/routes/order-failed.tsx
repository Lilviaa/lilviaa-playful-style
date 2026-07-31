import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/order-failed")({
  head: () => ({
    meta: [
      { title: "Payment Failed — lilviaa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderFailedPage,
});

function OrderFailedPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-lg px-6 py-20 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 text-red-600 shadow-sm animate-in zoom-in duration-500 mb-8">
        <XCircle className="h-12 w-12" />
      </div>
      <h1 className="font-display text-4xl text-cocoa md:text-5xl mb-3">Payment Failed</h1>
      <p className="text-lg text-muted-foreground mb-8">
        We couldn't process your payment. Don't worry, no money was deducted and your cart is saved.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
        <button
          onClick={() => navigate({ to: "/checkout" })}
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          <RefreshCw className="h-5 w-5" /> Try Again
        </button>
        <Link
          to="/cart"
          className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border-2 border-primary bg-transparent px-8 py-4 text-base font-bold text-primary transition-colors hover:bg-primary/5 active:scale-95"
        >
          <ArrowLeft className="h-5 w-5" /> Return to Cart
        </Link>
      </div>
    </div>
  );
}
