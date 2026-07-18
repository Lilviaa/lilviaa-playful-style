import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdminAuth } from "@/lib/admin/admin-auth";
import { useCreateCoupon } from "@/lib/admin/coupons-api";
import { CouponForm } from "@/components/admin/coupons/coupon-form";
import { ChevronLeft, Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/coupons/new")({
  component: NewCouponPage,
});

function NewCouponPage() {
  const { isOwner, isLoading: authLoading } = useAdminAuth();
  const { mutate: createCoupon, isPending } = useCreateCoupon();
  const navigate = useNavigate();

  if (authLoading) {
    return <div className="text-muted-foreground p-8">Checking permissions...</div>;
  }

  if (!isOwner) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
        <div className="p-4 rounded-full bg-red-50 text-red-600">
          <Lock className="h-10 w-10" />
        </div>
        <h2 className="text-xl font-bold text-cocoa">Owner Access Only</h2>
        <p className="text-muted-foreground">You need owner permissions to create coupons.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link
          to="/admin/coupons"
          className="p-2 rounded-full hover:bg-black/5 transition-colors text-muted-foreground hover:text-cocoa"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">New Coupon</h1>
          <p className="text-muted-foreground mt-0.5">Create a new discount code for your store.</p>
        </div>
      </div>

      <CouponForm
        onSubmit={(data) =>
          createCoupon(data, {
            onSuccess: () => navigate({ to: "/admin/coupons" }),
          })
        }
        isPending={isPending}
        submitLabel="Create Coupon"
      />
    </div>
  );
}
