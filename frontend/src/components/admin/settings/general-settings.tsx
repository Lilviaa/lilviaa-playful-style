import { StoreDetails } from "@/lib/admin/settings-api";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  details: StoreDetails;
  onChange: (details: StoreDetails) => void;
}

export function GeneralSettings({ details, onChange }: Props) {
  const handleChange = (field: keyof StoreDetails, value: string) => {
    onChange({ ...details, [field]: value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-cocoa">Store Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Manage your public-facing store information.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-2xl border border-cocoa/10 shadow-sm">
        <div className="space-y-2">
          <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Store Name</Label>
          <Input 
            value={details.store_name} 
            onChange={(e) => handleChange("store_name", e.target.value)} 
          />
        </div>
        
        <div className="space-y-2">
          <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Base Currency</Label>
          <Select 
            value={details.base_currency} 
            onValueChange={(val) => handleChange("base_currency", val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="INR">INR (₹)</SelectItem>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2 pt-4 border-t border-cocoa/5">
          <h3 className="text-sm font-semibold text-cocoa">Contact Information</h3>
        </div>

        <div className="space-y-2">
          <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Support Email</Label>
          <Input 
            type="email"
            value={details.contact_email} 
            onChange={(e) => handleChange("contact_email", e.target.value)} 
          />
        </div>

        <div className="space-y-2">
          <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Support Phone</Label>
          <Input 
            type="tel"
            value={details.support_phone} 
            onChange={(e) => handleChange("support_phone", e.target.value)} 
          />
        </div>
      </div>

      <div className="p-6 bg-white rounded-2xl border border-cocoa/10 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-cocoa">Business Address</h3>
          <p className="text-xs text-muted-foreground mt-1">Appears on your invoices and return labels.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 md:col-span-2">
            <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Address Line 1</Label>
            <Input 
              value={details.address_line1} 
              onChange={(e) => handleChange("address_line1", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Address Line 2</Label>
            <Input 
              value={details.address_line2} 
              onChange={(e) => handleChange("address_line2", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">City</Label>
            <Input 
              value={details.city} 
              onChange={(e) => handleChange("city", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">State/Province</Label>
            <Input 
              value={details.state} 
              onChange={(e) => handleChange("state", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label className="text-cocoa/80 text-xs uppercase tracking-wider font-semibold">Pincode / ZIP</Label>
            <Input 
              value={details.pincode} 
              onChange={(e) => handleChange("pincode", e.target.value)} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
