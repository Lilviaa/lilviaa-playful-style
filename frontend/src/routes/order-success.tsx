import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/lib/cart";

export const Route = createFileRoute("/order-success")({
  head: () => ({
    meta: [
      { title: "Order Successful! — lilviaa" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { clear } = useCart();
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    // Generate order number only once on mount to avoid hydration mismatch
    setOrderNumber(`LV-${Math.floor(100000 + Math.random() * 900000)}`);
    // Clear the cart
    clear();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-butter text-primary shadow-cute animate-in zoom-in duration-500">
        <CheckCircle2 className="h-12 w-12" />
      </div>
      <h1 className="mt-8 font-display text-4xl text-cocoa md:text-5xl">Yay! Order placed.</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        Thank you for shopping with lilviaa. We've received your order and are getting it ready for your little one.
      </p>
      
      {orderNumber && (
        <div className="mt-8 rounded-3xl bg-card p-6 shadow-cute">
          <h3 className="font-semibold text-cocoa">Order number: #{orderNumber}</h3>
          <p className="mt-2 text-sm text-muted-foreground">You will receive an email confirmation shortly.</p>
        </div>
      )}

      <Link
        to="/shop"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-bold text-primary-foreground shadow-pop transition-transform hover:scale-105 active:scale-95"
      >
        <ShoppingBag className="h-5 w-5" /> Continue Shopping
      </Link>
    </div>
  );
}
