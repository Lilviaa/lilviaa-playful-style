import { Return, RefundMethod, useUpdateRefundDetails } from "@/lib/admin/returns-api";
import { Order } from "@/lib/admin/orders-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatINR } from "@/lib/cart";
import { useState } from "react";
import { CreditCard, Store, Building2, Info } from "lucide-react";

interface RefundMethodSelectorProps {
  ret: Return;
  order: Order | undefined;
}

const METHOD_OPTIONS: { value: RefundMethod; label: string; description: string; icon: React.ComponentType<any> }[] = [
  {
    value: "original_payment",
    label: "Original Payment Method",
    description: "Refund to Razorpay/UPI. (API integration is a future step — choice is recorded only)",
    icon: CreditCard,
  },
  {
    value: "store_credit",
    label: "Store Credit",
    description: "Issue store credit for the refund amount to use on the next order.",
    icon: Store,
  },
  {
    value: "bank_transfer",
    label: "Bank Transfer",
    description: "Required for COD orders. Enter bank details below.",
    icon: Building2,
  },
];

export function RefundMethodSelector({ ret, order }: RefundMethodSelectorProps) {
  const { mutate: saveRefund, isPending } = useUpdateRefundDetails();

  const [method, setMethod] = useState<RefundMethod>(ret.refund_method);
  const [amount, setAmount] = useState(ret.refund_amount);
  const [bankName, setBankName] = useState(ret.bank_account_name || "");
  const [bankNumber, setBankNumber] = useState(ret.bank_account_number || "");
  const [bankIFSC, setBankIFSC] = useState(ret.bank_ifsc || "");

  const isCOD = order?.payment_method === "cod";
  const isCompleted = ret.status === "refund_processed";

  const handleSave = () => {
    saveRefund({
      id: ret.id,
      refund_method: method,
      refund_amount: amount,
      bank_account_name: bankName,
      bank_account_number: bankNumber,
      bank_ifsc: bankIFSC,
    });
  };

  return (
    <div className="space-y-5">
      {/* Info banner for COD */}
      {isCOD && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            This is a <strong>COD order</strong>. Original payment refund is not applicable.
            Please use Bank Transfer or Store Credit.
          </span>
        </div>
      )}

      {/* Refund Amount */}
      <div className="space-y-1.5">
        <Label className="text-cocoa font-semibold">Refund Amount (₹)</Label>
        <Input
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          disabled={isCompleted}
          className="rounded-xl border-cocoa/20 focus-visible:ring-primary max-w-[200px]"
        />
        <p className="text-xs text-muted-foreground">
          Order total: <span className="font-semibold">{formatINR(order?.total || 0)}</span>
        </p>
      </div>

      {/* Method Selector */}
      <div className="space-y-1.5">
        <Label className="text-cocoa font-semibold">Refund Method</Label>
        <RadioGroup
          value={method}
          onValueChange={(v) => setMethod(v as RefundMethod)}
          disabled={isCompleted}
          className="space-y-2"
        >
          {METHOD_OPTIONS.map((opt) => {
            const isDisabledOption = isCOD && opt.value === "original_payment";
            return (
              <label
                key={opt.value}
                htmlFor={opt.value}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                  method === opt.value && !isDisabledOption
                    ? "border-cocoa bg-sand/30"
                    : isDisabledOption
                    ? "opacity-40 cursor-not-allowed border-cocoa/10"
                    : "border-cocoa/10 hover:border-cocoa/30"
                }`}
              >
                <RadioGroupItem value={opt.value} id={opt.value} disabled={isDisabledOption} className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <opt.icon className="h-4 w-4 text-cocoa" />
                    <span className="font-semibold text-cocoa text-sm">{opt.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                </div>
              </label>
            );
          })}
        </RadioGroup>
      </div>

      {/* Bank Fields (shown for bank_transfer) */}
      {method === "bank_transfer" && !isCompleted && (
        <div className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <p className="text-sm font-semibold text-cocoa">Bank Account Details</p>
          <div className="space-y-2">
            <Input
              placeholder="Account Holder Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="rounded-xl border-cocoa/20"
            />
            <Input
              placeholder="Account Number"
              value={bankNumber}
              onChange={(e) => setBankNumber(e.target.value)}
              className="rounded-xl border-cocoa/20"
            />
            <Input
              placeholder="IFSC Code"
              value={bankIFSC}
              onChange={(e) => setBankIFSC(e.target.value)}
              className="rounded-xl border-cocoa/20"
            />
          </div>
        </div>
      )}

      {/* Show saved bank details when completed */}
      {method === "bank_transfer" && isCompleted && ret.bank_account_name && (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
          <p className="font-semibold text-cocoa">Bank Transfer Sent To:</p>
          <p>{ret.bank_account_name}</p>
          <p className="font-mono">{ret.bank_account_number}</p>
          <p className="font-mono">{ret.bank_ifsc}</p>
        </div>
      )}

      {!isCompleted && (
        <Button className="rounded-full" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving..." : "Save Refund Details"}
        </Button>
      )}
    </div>
  );
}
