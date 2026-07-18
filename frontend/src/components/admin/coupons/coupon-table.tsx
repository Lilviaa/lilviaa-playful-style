import {
  Coupon,
  getCouponStatus,
  useToggleCoupon,
  useDeleteCoupon,
} from "@/lib/admin/coupons-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavigate } from "@tanstack/react-router";
import { Pencil, Trash2, BarChart2 } from "lucide-react";
import { formatINR } from "@/lib/cart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface CouponTableProps {
  data: Coupon[];
  isLoading: boolean;
}

const typeLabel: Record<string, string> = {
  flat: "Flat",
  percent: "Percent",
  free_shipping: "Free Ship",
  bogo: "BOGO",
};

const statusBadge = (status: ReturnType<typeof getCouponStatus>) => {
  switch (status) {
    case "active":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>;
    case "expired":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Expired</Badge>;
    case "inactive":
      return <Badge className="bg-slate-100 text-slate-600 border-slate-200">Inactive</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Scheduled</Badge>;
  }
};

export function CouponTable({ data, isLoading }: CouponTableProps) {
  const navigate = useNavigate();
  const { mutate: toggle } = useToggleCoupon();
  const { mutate: deleteCoupon } = useDeleteCoupon();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-cocoa/10 bg-white p-12 text-center text-muted-foreground">
        Loading coupons...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-2xl border border-dashed border-cocoa/20 bg-sand/10 p-12 text-center text-muted-foreground">
        No coupons yet. Create your first one!
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-sand/50 border-b border-cocoa/10">
          <tr>
            {["Code", "Type", "Value", "Min Cart", "Usage", "Scope", "Valid Until", "Status", "Actions"].map((h) => (
              <th key={h} className="text-left text-cocoa font-bold px-4 py-3 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((coupon) => {
            const status = getCouponStatus(coupon);
            const usageStr = coupon.usage_limit_total
              ? `${coupon.times_used ?? 0} / ${coupon.usage_limit_total}`
              : `${coupon.times_used ?? 0} / ∞`;

            const valueStr =
              coupon.type === "flat"
                ? formatINR(coupon.value)
                : coupon.type === "percent"
                ? `${coupon.value}%`
                : coupon.type === "free_shipping"
                ? "—"
                : "Buy 1 Get 1";

            return (
              <tr
                key={coupon.id}
                className="border-b border-cocoa/5 hover:bg-primary/5 transition-colors duration-150"
              >
                <td className="px-4 py-3">
                  <code className="font-mono font-bold text-cocoa bg-sand/50 px-2 py-0.5 rounded">
                    {coupon.code}
                  </code>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className="text-xs">{typeLabel[coupon.type]}</Badge>
                </td>
                <td className="px-4 py-3 font-semibold">{valueStr}</td>
                <td className="px-4 py-3 text-muted-foreground">{formatINR(coupon.min_cart_value)}</td>
                <td className="px-4 py-3 text-muted-foreground">{usageStr}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="capitalize text-xs">
                    {coupon.scope.replace("_", " ")}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {new Date(coupon.end_date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{statusBadge(status)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={coupon.active}
                      onCheckedChange={(checked) => toggle({ id: coupon.id, active: checked })}
                      title={coupon.active ? "Deactivate coupon" : "Activate coupon"}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-cocoa"
                      onClick={() => navigate({ to: "/admin/coupons/$couponId", params: { couponId: coupon.id }, search: { edit: false } })}
                      title="View stats"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-cocoa"
                      onClick={() => navigate({ to: "/admin/coupons/$couponId", params: { couponId: coupon.id }, search: { edit: true } })}
                      title="Edit coupon"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-red-600"
                          title="Delete coupon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Coupon?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete <strong>{coupon.code}</strong>? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => deleteCoupon(coupon.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
