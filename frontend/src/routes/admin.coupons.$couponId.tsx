import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin/admin-auth";
import { useCoupon, useUpdateCoupon, getCouponStatus } from "@/lib/admin/coupons-api";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { CouponUsageStats } from "@/components/admin/coupons/coupon-usage-stats";
import { ChevronLeft, Lock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

export const Route = createFileRoute("/admin/coupons/$couponId")({
  validateSearch: z.object({ edit: z.boolean().optional() }),
  component: CouponDetailPage,
});

const statusBadge = (status: ReturnType<typeof getCouponStatus>) => {
  const map = {
    active: "bg-emerald-100 text-emerald-800 border-emerald-200",
    expired: "bg-red-100 text-red-800 border-red-200",
    inactive: "bg-slate-100 text-slate-600 border-slate-200",
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
  };
  return (
    <Badge className={`${map[status]} capitalize`}>{status}</Badge>
  );
};

function CouponDetailPage() {
  const { couponId } = Route.useParams();
  const { edit } = Route.useSearch();
  const { isOwner, isLoading: authLoading } = useAdminAuth();
  const { data: coupon, isLoading } = useCoupon(couponId);
  const { mutate: updateCoupon, isPending } = useUpdateCoupon();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(edit === true);

  if (authLoading || isLoading) {
    return <div className="text-muted-foreground p-8">Loading...</div>;
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-600">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-cocoa">Owner Access Only</h2>
        <p className="text-muted-foreground">You need owner permissions to view coupons.</p>
      </div>
    );
  }

  if (!coupon) {
    return <div className="text-muted-foreground p-8">Coupon not found.</div>;
  }

  const status = getCouponStatus(coupon);

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          to="/admin/coupons"
          className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-cocoa mt-1"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <code className="font-mono text-2xl font-bold text-cocoa bg-sand/60 px-3 py-1 rounded-xl">
              {coupon.code}
            </code>
            {statusBadge(status)}
          </div>
          <p className="text-muted-foreground mt-1">
            Created {new Date(coupon.created_at).toLocaleDateString()} · Valid until{" "}
            {new Date(coupon.end_date).toLocaleDateString()}
          </p>
        </div>
        <Button
          variant={isEditing ? "outline" : "default"}
          className="rounded-full gap-2 shrink-0"
          onClick={() => setIsEditing((v) => !v)}
        >
          <Pencil className="h-4 w-4" />
          {isEditing ? "Cancel Edit" : "Edit Coupon"}
        </Button>
      </div>

      {isEditing ? (
        <CouponForm
          defaultValues={coupon}
          onSubmit={(data) =>
            updateCoupon(
              { id: couponId, data },
              { onSuccess: () => setIsEditing(false) }
            )
          }
          isPending={isPending}
          submitLabel="Save Changes"
        />
      ) : (
        <CouponUsageStats couponId={couponId} />
      )}
    </div>
  );
}
