import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import logoAsset from "@/assets/lilviaa-logo.png.asset.json";
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Users,
  Ticket,
  Undo2,
  Star,
  Image as ImageIcon,
  Settings,
  MonitorSmartphone,
  Building2,
} from "lucide-react";

import { usePendingReviewCount } from "@/lib/admin/reviews-api";

export const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/reviews", label: "Reviews", icon: Star, hasBadge: true },
  { to: "/admin/banners", label: "Banners", icon: ImageIcon },
  { to: "/admin/shop", label: "Shop", icon: Building2 },
];

export function AdminSidebar({ className }: { className?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: pendingReviewsCount = 0 } = usePendingReviewCount();

  return (
    <aside
      className={cn(
        "flex w-64 flex-col border-r border-border bg-card",
        className
      )}
    >
      <div className="flex h-16 items-center px-6 border-b border-border">
        <Link to="/admin/dashboard" className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt="lilviaa"
            className="h-8 w-auto"
          />
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-primary">
            ADMIN
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {ADMIN_LINKS.map((link) => {
          const isActive = pathname === link.to || pathname.startsWith(link.to + "/");
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-sand/50 hover:text-cocoa"
              )}
            >
              <div className="flex items-center gap-3">
                <link.icon className="h-5 w-5" />
                {link.label}
              </div>
              {link.hasBadge && pendingReviewsCount > 0 && (
                <span className="rounded-full bg-amber-500 text-white px-2 py-0.5 text-xs font-bold shrink-0">
                  {pendingReviewsCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border">
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-primary/20">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-20"></span>
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            </div>
            <div>
              <p className="text-sm font-bold text-cocoa">Store Online</p>
              <p className="text-xs font-medium text-primary">Accepting orders</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
