import { ShippingZone } from "@/lib/admin/settings-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";

interface Props {
  shipping: ShippingZone[];
  onChange: (zones: ShippingZone[]) => void;
}

export function ShippingSettings({ shipping, onChange }: Props) {
  const handleChange = (index: number, field: keyof ShippingZone, value: string | number | null) => {
    const newShipping = [...shipping];
    newShipping[index] = { ...newShipping[index], [field]: value };
    onChange(newShipping);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-cocoa">Shipping & Delivery</h2>
        <p className="text-sm text-muted-foreground mt-1">Configure shipping rates and free shipping thresholds for your zones.</p>
      </div>

      <div className="space-y-4">
        {shipping.map((zone, index) => (
          <div key={zone.id} className="p-6 bg-white rounded-2xl border border-cocoa/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-cocoa/10 pb-4">
              <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-cocoa">{zone.name}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Standard Rate (₹)</Label>
                <Input 
                  type="number"
                  value={zone.standard_rate} 
                  onChange={(e) => handleChange(index, "standard_rate", Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Express Rate (₹)</Label>
                <Input 
                  type="number"
                  value={zone.express_rate} 
                  onChange={(e) => handleChange(index, "express_rate", Number(e.target.value))} 
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Free Shipping Threshold (₹)</Label>
                <p className="text-[10px] text-muted-foreground mb-1">Set to 0 or leave empty to disable free shipping.</p>
                <Input 
                  type="number"
                  value={zone.free_shipping_threshold || ""} 
                  onChange={(e) => {
                    const val = e.target.value;
                    handleChange(index, "free_shipping_threshold", val ? Number(val) : null);
                  }} 
                  placeholder="e.g. 1500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
