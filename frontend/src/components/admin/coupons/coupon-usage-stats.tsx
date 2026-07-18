import { useCoupon, useCouponUsages, getCouponStatus } from "@/lib/admin/coupons-api";
import { formatINR } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Users, ShoppingBag, Clock } from "lucide-react";

interface CouponUsageStatsProps {
  couponId: string;
}

export function CouponUsageStats({ couponId }: CouponUsageStatsProps) {
  const { data: coupon, isLoading: loadingCoupon } = useCoupon(couponId);
  const { data: usages = [], isLoading: loadingUsages } = useCouponUsages(couponId);

  if (loadingCoupon || loadingUsages) {
    return <div className="text-muted-foreground text-sm p-4">Loading stats...</div>;
  }
  if (!coupon) return null;

  const totalRedemptions = usages.length;
  const totalDiscount = usages.reduce((s, u) => s + u.discount_applied, 0);
  const uniqueCustomers = new Set(usages.map((u) => u.customer_name)).size;
  const limitPct =
    coupon.usage_limit_total
      ? Math.min(100, Math.round((totalRedemptions / coupon.usage_limit_total) * 100))
      : null;

  const stats = [
    {
      label: "Total Redemptions",
      value: totalRedemptions,
      icon: ShoppingBag,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Total Discount Given",
      value: formatINR(totalDiscount),
      icon: TrendingDown,
      color: "bg-red-50 text-red-700",
    },
    {
      label: "Unique Customers",
      value: uniqueCustomers,
      icon: Users,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`rounded-2xl p-5 ${stat.color.replace("text-", "border-").replace("700", "200")} border flex items-center gap-4`}>
            <div className={`p-3 rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold text-cocoa">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Usage Progress Bar */}
      {limitPct !== null && (
        <div className="bg-white rounded-2xl border border-cocoa/10 shadow-sm p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-cocoa">Usage vs. Limit</p>
            <p className="text-sm text-muted-foreground">
              {totalRedemptions} / {coupon.usage_limit_total}
            </p>
          </div>
          <div className="h-3 rounded-full bg-sand/50 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${limitPct >= 90 ? "bg-red-500" : limitPct >= 60 ? "bg-amber-500" : "bg-emerald-500"}`}
              style={{ width: `${limitPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{limitPct}% used</p>
        </div>
      )}

      {/* Recent Redemptions Table */}
      <div className="bg-white rounded-2xl border border-cocoa/10 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-cocoa/10 flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-cocoa">Recent Redemptions</h3>
        </div>

        {usages.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No redemptions yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-sand/30 border-b border-cocoa/10">
              <tr>
                {["Customer", "Order ID", "Discount Applied", "Used At"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 font-semibold text-cocoa">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usages.map((usage) => (
                <tr key={usage.id} className="border-b border-cocoa/5 hover:bg-sand/20">
                  <td className="px-4 py-3 font-medium text-cocoa">{usage.customer_name}</td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-sand/50 px-1.5 py-0.5 rounded font-mono">{usage.order_id}</code>
                  </td>
                  <td className="px-4 py-3 font-semibold text-red-600">
                    -{formatINR(usage.discount_applied)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(usage.used_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
