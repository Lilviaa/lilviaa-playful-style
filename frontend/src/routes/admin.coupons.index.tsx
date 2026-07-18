import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin/admin-auth";
import { useCoupons } from "@/lib/admin/coupons-api";
import { CouponTable } from "@/components/admin/coupons/coupon-table";
import { Button } from "@/components/ui/button";
import { Plus, Lock } from "lucide-react";

export const Route = createFileRoute("/admin/coupons/")({
  component: CouponsIndexPage,
});

function CouponsIndexPage() {
  const { isOwner, isLoading: authLoading } = useAdminAuth();
  const { data: coupons = [], isLoading } = useCoupons();

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Checking permissions...
      </div>
    );
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-600">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-cocoa">Owner Access Only</h2>
        <p className="text-muted-foreground max-w-sm">
          Coupon management is restricted to the store owner. Please contact your admin.
        </p>
      </div>
    );
  }

  const active = coupons.filter((c) => c.active).length;
  const expired = coupons.filter((c) => {
    const now = new Date();
    return new Date(c.end_date) < now;
  }).length;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Coupons</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage discount codes. Active:{" "}
            <span className="font-semibold text-emerald-700">{active}</span> · Expired:{" "}
            <span className="font-semibold text-red-600">{expired}</span>
          </p>
        </div>
        <Button asChild className="rounded-full gap-2">
          <Link to="/admin/coupons/new">
            <Plus className="h-4 w-4" />
            New Coupon
          </Link>
        </Button>
      </div>

      <CouponTable data={coupons} isLoading={isLoading} />
    </div>
  );
}
