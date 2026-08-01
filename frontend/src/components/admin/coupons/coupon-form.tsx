import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Coupon, CouponType, CouponScope } from "@/lib/admin/coupons-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from "lucide-react";

// ==========================================
// SCHEMA
// ==========================================
const couponSchema = z.object({
  code: z.string().min(3, "Min 3 characters").max(20, "Max 20 characters"),
  type: z.enum(["flat", "percent", "free_shipping"]),
  value: z.coerce.number().min(0),
  max_discount_cap: z.coerce.number().nullable(),
  min_cart_value: z.coerce.number().min(0),
  usage_limit_total: z.coerce.number().nullable(),
  usage_limit_per_customer: z.coerce.number().nullable(),
  scope: z.enum(["store_wide", "category", "product"]),
  scope_ids_raw: z.string().optional(), // comma-separated input
  start_date: z.string(),
  end_date: z.string(),
  active: z.boolean(),
});

import { useCategories } from "@/lib/products-api";

export type CouponFormValues = z.infer<typeof couponSchema>;

interface CouponFormProps {
  defaultValues?: Partial<Coupon>;
  onSubmit: (data: Omit<Coupon, "id" | "created_at">) => void;
  isPending: boolean;
  submitLabel?: string;
}

export function CouponForm({ defaultValues, onSubmit, isPending, submitLabel = "Save Coupon" }: CouponFormProps) {
  const { data: dbCategories = [] } = useCategories();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CouponFormValues>({
    resolver: zodResolver(couponSchema),
    defaultValues: {
      code: defaultValues?.code ?? "",
      type: defaultValues?.type ?? "flat",
      value: defaultValues?.value ?? 0,
      max_discount_cap: defaultValues?.max_discount_cap ?? null,
      min_cart_value: defaultValues?.min_cart_value ?? 0,
      usage_limit_total: defaultValues?.usage_limit_total ?? null,
      usage_limit_per_customer: defaultValues?.usage_limit_per_customer ?? null,
      scope: defaultValues?.scope ?? "store_wide",
      scope_ids_raw: defaultValues?.scope_ids?.join(", ") ?? "",
      start_date: defaultValues?.start_date
        ? defaultValues.start_date.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
      end_date: defaultValues?.end_date
        ? defaultValues.end_date.slice(0, 10)
        : new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
      active: defaultValues?.active ?? true,
    },
  });

  const type = watch("type");
  const scope = watch("scope");

  // Auto uppercase code
  const codeValue = watch("code");
  useEffect(() => {
    if (codeValue !== codeValue.toUpperCase()) {
      setValue("code", codeValue.toUpperCase());
    }
  }, [codeValue, setValue]);

  const handleFormSubmit = (vals: CouponFormValues) => {
    const scope_ids =
      vals.scope !== "store_wide" && vals.scope_ids_raw
        ? vals.scope_ids_raw.split(",").map((s) => s.trim()).filter(Boolean)
        : null;

    onSubmit({
      code: vals.code.toUpperCase(),
      type: vals.type as CouponType,
      value: vals.value,
      max_discount_cap: vals.max_discount_cap,
      min_cart_value: vals.min_cart_value,
      usage_limit_total: vals.usage_limit_total,
      usage_limit_per_customer: vals.usage_limit_per_customer,
      scope: vals.scope as CouponScope,
      scope_ids,
      start_date: new Date(vals.start_date).toISOString(),
      end_date: new Date(vals.end_date).toISOString(),
      active: vals.active,
    });
  };

  const field = (label: string, name: keyof CouponFormValues, type = "text", placeholder = "") => (
    <div className="space-y-1.5">
      <Label htmlFor={name} className="text-cocoa font-semibold">{label}</Label>
      <Input
        id={name}
        type={type}
        placeholder={placeholder}
        {...register(name as any)}
        className="rounded-xl border-cocoa/20 focus-visible:ring-primary"
      />
      {errors[name] && <p className="text-xs text-red-500">{errors[name]?.message as string}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8">
      {/* Basic Info */}
      <section className="bg-white rounded-2xl border border-cocoa/10 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-cocoa text-lg">Coupon Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("Coupon Code", "code", "text", "e.g. SAVE20")}

          <div className="space-y-1.5">
            <Label className="text-cocoa font-semibold">Type</Label>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="rounded-xl border-cocoa/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flat">Flat (₹)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                    <SelectItem value="free_shipping">Free Shipping</SelectItem>

                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Conditional value fields */}
        {type !== "free_shipping" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {field(type === "percent" ? "Discount (%)" : "Discount Amount (₹)", "value", "number")}
            {type === "percent" && field("Max Discount Cap (₹, optional)", "max_discount_cap", "number", "e.g. 500")}
          </div>
        )}

        {field("Minimum Cart Value (₹)", "min_cart_value", "number")}
      </section>

      {/* Usage Limits */}
      <section className="bg-white rounded-2xl border border-cocoa/10 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-cocoa text-lg">Usage Limits</h2>
        <p className="text-sm text-muted-foreground -mt-2">Leave blank for unlimited usage.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("Total Usage Limit", "usage_limit_total", "number", "e.g. 100")}
          {field("Per Customer Limit", "usage_limit_per_customer", "number", "e.g. 1")}
        </div>
      </section>

      {/* Scope */}
      <section className="bg-white rounded-2xl border border-cocoa/10 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-cocoa text-lg">Scope</h2>
        <div className="space-y-1.5">
          <Label className="text-cocoa font-semibold">Apply To</Label>
          <Controller
            control={control}
            name="scope"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger className="rounded-xl border-cocoa/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="store_wide">Entire Store</SelectItem>
                  <SelectItem value="category">Specific Category</SelectItem>
                  <SelectItem value="product">Specific Product</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        {scope === "category" && (
          <div className="space-y-2">
            <Label className="text-cocoa font-semibold">Category UUIDs (comma-separated)</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {dbCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    const raw = watch("scope_ids_raw") || "";
                    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
                    if (parts.includes(cat.id)) {
                      setValue("scope_ids_raw", parts.filter((p) => p !== cat.id).join(", "));
                    } else {
                      setValue("scope_ids_raw", [...parts, cat.id].join(", "));
                    }
                  }}
                  className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${
                    (watch("scope_ids_raw") || "").includes(cat.id)
                      ? "bg-cocoa text-white border-cocoa"
                      : "border-cocoa/20 text-cocoa hover:bg-sand/50"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            <Input
              placeholder="Or type UUID manually..."
              {...register("scope_ids_raw")}
              className="rounded-xl border-cocoa/20"
            />
          </div>
        )}

        {scope === "product" && (
          <div className="space-y-1.5">
            <Label className="text-cocoa font-semibold">Product IDs (comma-separated)</Label>
            <Input
              placeholder="e.g. p_1, p_2, p_3"
              {...register("scope_ids_raw")}
              className="rounded-xl border-cocoa/20"
            />
            <p className="text-xs text-muted-foreground">
              Enter the internal product IDs from your product management page.
            </p>
          </div>
        )}
      </section>

      {/* Validity & Active */}
      <section className="bg-white rounded-2xl border border-cocoa/10 shadow-sm p-6 space-y-5">
        <h2 className="font-semibold text-cocoa text-lg">Validity Period</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {field("Start Date", "start_date", "date")}
          {field("End Date", "end_date", "date")}
        </div>

        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            <strong>Note:</strong> Auto-expiry past the end date requires a Supabase{" "}
            <code>pg_cron</code> job or Edge Function on the backend. Client-side checks are
            display-only and cannot enforce expiry for ongoing sessions.
          </span>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-cocoa/10 bg-sand/20 p-4">
          <div>
            <p className="font-semibold text-cocoa">Coupon Active</p>
            <p className="text-sm text-muted-foreground">Toggle to enable or disable this coupon immediately.</p>
          </div>
          <Controller
            control={control}
            name="active"
            render={({ field }) => (
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            )}
          />
        </div>
      </section>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={isPending} className="rounded-full px-8">
          {isPending ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
