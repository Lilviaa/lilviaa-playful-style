import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect } from "react";
import { LogOut, MapPin, Package, User } from "lucide-react";
import { formatINR } from "@/lib/cart";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "My Account — lilviaa" },
    ],
  }),
  component: AccountPage,
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
  }
];

function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
    }
  }, [user, navigate]);

  if (!user) return null; // Prevent flicker before redirect

  function handleLogout() {
    logout();
    navigate({ to: "/login" });
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-4xl text-cocoa md:text-5xl">My Account</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Welcome back, {user.name}!
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-2 text-sm font-semibold text-cocoa transition-colors hover:bg-sand hover:text-primary w-fit"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_2fr]">
        {/* Profile Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-cute">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa mb-4">
              <User className="h-5 w-5 text-primary" /> Profile Details
            </h2>
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
            <button className="mt-6 text-sm font-semibold text-primary hover:underline">
              Edit profile
            </button>
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-cute">
            <h2 className="flex items-center gap-2 font-display text-xl text-cocoa mb-4">
              <MapPin className="h-5 w-5 text-primary" /> Saved Addresses
            </h2>
            <div className="space-y-1 text-sm text-cocoa">
              <p className="font-medium">Home</p>
              <p className="text-muted-foreground">123 Playful Lane, Apt 4B</p>
              <p className="text-muted-foreground">Mumbai, Maharashtra 400001</p>
            </div>
            <button className="mt-4 text-sm font-semibold text-primary hover:underline">
              Manage addresses
            </button>
          </div>
        </aside>

        {/* Order History */}
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
                
                <div className="mt-5 pt-4 border-t border-border/50 flex gap-4">
                  <button className="text-sm font-semibold text-primary hover:underline">
                    Track Package
                  </button>
                  <button className="text-sm font-semibold text-muted-foreground hover:text-cocoa hover:underline">
                    View Invoice
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/shop" className="inline-flex items-center justify-center rounded-full bg-butter px-6 py-3 text-sm font-bold text-cocoa shadow-sm hover:bg-sand transition-colors">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
