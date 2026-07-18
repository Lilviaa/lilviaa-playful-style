import { TaxSettings, PaymentGateway } from "@/lib/admin/settings-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CreditCard, Receipt } from "lucide-react";

interface Props {
  taxes: TaxSettings;
  payments: PaymentGateway[];
  onTaxesChange: (taxes: TaxSettings) => void;
  onPaymentsChange: (payments: PaymentGateway[]) => void;
}

export function TaxPaymentSettings({ taxes, payments, onTaxesChange, onPaymentsChange }: Props) {
  const handlePaymentToggle = (id: string, enabled: boolean) => {
    const newPayments = payments.map(p => p.id === id ? { ...p, is_enabled: enabled } : p);
    onPaymentsChange(newPayments);
  };

  return (
    <div className="space-y-8">
      {/* Taxes */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-cocoa">Taxes & Duties</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure how taxes are calculated at checkout.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cocoa/10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-cocoa/10 pb-4">
            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Receipt className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-cocoa">Tax Configuration</h3>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold text-cocoa">Prices include tax</Label>
                <p className="text-xs text-muted-foreground mt-1">If enabled, store prices are shown including tax.</p>
              </div>
              <Switch 
                checked={taxes.prices_include_tax} 
                onCheckedChange={(val) => onTaxesChange({ ...taxes, prices_include_tax: val })} 
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Base Tax Percentage (%)</Label>
              <Input 
                type="number"
                value={taxes.base_tax_percentage} 
                onChange={(e) => onTaxesChange({ ...taxes, base_tax_percentage: Number(e.target.value) })} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-cocoa">Payment Gateways</h2>
          <p className="text-sm text-muted-foreground mt-1">Enable or disable payment methods available to customers.</p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cocoa/10 shadow-sm space-y-4">
          <div className="flex items-center gap-3 border-b border-cocoa/10 pb-4 mb-4">
            <div className="h-10 w-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-cocoa">Supported Methods</h3>
          </div>

          {payments.map(gateway => (
            <div key={gateway.id} className="flex items-center justify-between p-4 bg-sand/10 border border-cocoa/5 rounded-xl">
              <div>
                <Label className="text-sm font-semibold text-cocoa">{gateway.name}</Label>
              </div>
              <Switch 
                checked={gateway.is_enabled} 
                onCheckedChange={(val) => handlePaymentToggle(gateway.id, val)} 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
