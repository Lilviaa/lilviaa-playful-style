import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { MapPin, Package, User } from "lucide-react";
import { formatINR } from "@/lib/cart";

export const Route = createFileRoute("/account/")({
  component: AccountIndexPage,
});

const recentOrder = {
  id: "#LV-928374",
  date: "July 12, 2026",
  status: "Delivered",
  total: 2499,
  items: [
    { name: "Sunshine Linen Kurta", qty: 1, size: "2-3Y" },
    { name: "Playful Prints Shirt", qty: 2, size: "3-4Y" }
  ]
};

function AccountIndexPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl bg-card p-6 shadow-cute">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa">
              <User className="h-5 w-5 text-primary" /> Profile Overview
            </h2>
            <Link to="/account/settings" className="text-sm font-semibold text-primary hover:underline">
              Edit
            </Link>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Full Name</p>
              <p className="font-medium text-cocoa mt-0.5">{user.name}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs uppercase tracking-wider">Email Address</p>
              <p className="font-medium text-cocoa mt-0.5">{user.email}</p>
            </div>
            {user.phone && (
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">Phone Number</p>
                <p className="font-medium text-cocoa mt-0.5">{user.phone}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-card p-6 shadow-cute">
          <div className="flex items-center justify-between mb-4">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa">
              <MapPin className="h-5 w-5 text-primary" /> Default Address
            </h2>
            <Link to="/account/settings" className="text-sm font-semibold text-primary hover:underline">
              Manage
            </Link>
          </div>
          <div className="space-y-1 text-sm text-cocoa">
            <p className="font-medium">Home</p>
            <p className="text-muted-foreground">123 Playful Lane, Apt 4B</p>
            <p className="text-muted-foreground">Mumbai, Maharashtra 400001</p>
            <p className="text-muted-foreground">India</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-card p-6 shadow-cute">
        <div className="flex items-center justify-between mb-6">
          <h2 className="flex items-center gap-2 font-display text-2xl text-cocoa">
            <Package className="h-6 w-6 text-primary" /> Recent Order
          </h2>
          <Link to="/account/orders" className="text-sm font-semibold text-primary hover:underline">
            View All Orders
          </Link>
        </div>
        
        <div className="rounded-2xl border border-border bg-background p-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
            <div>
              <p className="text-sm font-semibold text-cocoa">{recentOrder.id}</p>
              <p className="text-xs text-muted-foreground">{recentOrder.date}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-cocoa">{formatINR(recentOrder.total)}</p>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                recentOrder.status === 'Delivered' ? 'bg-green-100 text-green-800' : 'bg-butter text-primary'
              }`}>
                {recentOrder.status}
              </span>
            </div>
          </div>
          
          <ul className="mt-4 space-y-2">
            {recentOrder.items.map((item, idx) => (
              <li key={idx} className="flex justify-between text-sm">
                <span className="text-cocoa">
                  <span className="font-medium">{item.qty}x</span> {item.name} <span className="text-muted-foreground">(Size: {item.size})</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
