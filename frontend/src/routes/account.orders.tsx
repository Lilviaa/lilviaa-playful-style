import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { Package } from "lucide-react";
import { formatINR } from "@/lib/cart";

export const Route = createFileRoute("/account/orders")({
  head: () => ({
    meta: [
      { title: "My Orders — lilviaa" },
    ],
  }),
  component: AccountOrdersPage,
});

const dummyOrders = [
  {
    id: "#LV-928374",
    date: "July 12, 2026",
    status: "Delivered",
    total: 2499,
    items: [
      { name: "Sunshine Linen Kurta", qty: 1, size: "2-3Y" },
      { name: "Playful Prints Shirt", qty: 2, size: "3-4Y" }
    ]
  },
  {
    id: "#LV-482910",
    date: "July 16, 2026",
    status: "Processing",
    total: 1299,
    items: [
      { name: "Festive Silk Set", qty: 1, size: "4-5Y" }
    ]
  },
  {
    id: "#LV-102945",
    date: "June 05, 2026",
    status: "Delivered",
    total: 3150,
    items: [
      { name: "Midnight Leaf Mandarin Kurta", qty: 1, size: "5-6Y" },
      { name: "Sunny Picnic Shirt", qty: 1, size: "5-6Y" },
      { name: "Blossom Blush Frock", qty: 1, size: "1-2Y" }
    ]
  }
];

function AccountOrdersPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="rounded-3xl bg-card p-6 shadow-cute md:p-8">
        <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa mb-6">
          <Package className="h-6 w-6 text-primary" /> Order History
        </h2>

        <div className="space-y-6">
          {dummyOrders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
                <div>
                  <p className="text-sm font-semibold text-cocoa">{order.id}</p>
                  <p className="text-xs text-muted-foreground">{order.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-cocoa">{formatINR(order.total)}</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <ul className="mt-4 space-y-2">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between text-sm">
                    <span className="text-cocoa">
                      <span className="font-medium">{item.qty}x</span> {item.name} <span className="text-muted-foreground">(Size: {item.size})</span>
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-5 pt-4 border-t border-border/50 flex flex-wrap gap-4">
                <button className="text-sm font-semibold text-primary hover:underline">
                  Track Package
                </button>
                <button className="text-sm font-semibold text-muted-foreground hover:text-cocoa hover:underline">
                  View Invoice
                </button>
                {order.status === 'Delivered' && (
                  <button className="text-sm font-semibold text-muted-foreground hover:text-cocoa hover:underline">
                    Write Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center border-t border-border pt-8">
          <Link to="/shop" className="inline-flex items-center justify-center rounded-full bg-butter px-6 py-3 text-sm font-bold text-cocoa shadow-sm hover:bg-sand transition-colors">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
