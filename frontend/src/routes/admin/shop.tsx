import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useCompanySettings, useUpdateCompanySettings } from "@/lib/admin/settings-api";
import { uploadCmsImage } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UploadCloud, Building2, Phone, Mail, Globe, MapPin, Share2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/admin/shop")({
  component: CompanySettingsPage,
});

function CompanySettingsPage() {
  const { data: settings, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  const [formData, setFormData] = useState<any>({
    company_name: "",
    business_email: "",
    support_email: "",
    website: "",
    phone_primary: "",
    phone_secondary: "",
    gst_number: "",
    address_line: "",
    city: "",
    state: "",
    country: "",
    pincode: "",
    logo_url: "",
    facebook_url: "",
    instagram_url: "",
    youtube_url: "",
    whatsapp_number: "",
    enable_gst: false,
    gst_percentage: 0,
    home_state: "Tamil Nadu",
    shipping_charge_home: 0,
    shipping_charge_other: 0,
    enable_free_shipping: false,
    free_shipping_above: 0,
    maintenance_end_time: "",
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading("Uploading logo...");
    try {
      const publicUrl = await uploadCmsImage(file);
      setFormData((prev: any) => ({ ...prev, logo_url: publicUrl }));
      toast.success("Logo uploaded successfully!", { id: toastId });
    } catch (err) {
      toast.error("Failed to upload logo", { id: toastId });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData, {
      onSuccess: () => {
        toast.success("Company details updated successfully");
      },
      onError: () => {
        toast.error("Failed to update company details");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-cocoa">Company Details</h1>
        <p className="text-muted-foreground mt-2">
          Manage your business information. This data will be used across the website, invoices, and emails.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Core Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Core Information
            </CardTitle>
            <CardDescription>Primary business identity and branding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* Logo Upload */}
              <div className="flex-shrink-0 space-y-2">
                <Label>Company Logo</Label>
                <div 
                  className="w-40 h-40 border-2 border-dashed rounded-lg flex flex-col items-center justify-center bg-sand/10 hover:bg-sand/30 cursor-pointer overflow-hidden relative group"
                  onClick={() => document.getElementById("logo-upload")?.click()}
                >
                  {formData.logo_url ? (
                    <>
                      <img src={formData.logo_url} alt="Logo" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <UploadCloud className="h-6 w-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <UploadCloud className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <span className="text-xs text-muted-foreground">Click to upload (.webp only)</span>
                    </div>
                  )}
                </div>
                <input type="file" id="logo-upload" className="hidden" accept="image/webp" onChange={handleImageUpload} />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input name="company_name" value={formData.company_name || ""} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>GST Number</Label>
                  <Input name="gst_number" value={formData.gst_number || ""} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <Label>Business Website</Label>
                  <Input name="website" value={formData.website || ""} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" /> Contact Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Phone *</Label>
              <Input name="phone_primary" value={formData.phone_primary || ""} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Secondary Phone</Label>
              <Input name="phone_secondary" value={formData.phone_secondary || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Business Email *</Label>
              <Input type="email" name="business_email" value={formData.business_email || ""} onChange={handleChange} required />
            </div>
            <div className="space-y-2">
              <Label>Support Email</Label>
              <Input type="email" name="support_email" value={formData.support_email || ""} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Registered Address
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Address Line</Label>
              <Input name="address_line" value={formData.address_line || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>City</Label>
              <Input name="city" value={formData.city || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input name="state" value={formData.state || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Input name="country" value={formData.country || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Pincode / ZIP</Label>
              <Input name="pincode" value={formData.pincode || ""} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* Socials */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5 text-primary" /> Social Links & Chat
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>WhatsApp Number</Label>
              <Input name="whatsapp_number" value={formData.whatsapp_number || ""} onChange={handleChange} placeholder="+91..." />
            </div>
            <div className="space-y-2">
              <Label>Instagram URL</Label>
              <Input name="instagram_url" value={formData.instagram_url || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Facebook URL</Label>
              <Input name="facebook_url" value={formData.facebook_url || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>YouTube URL</Label>
              <Input name="youtube_url" value={formData.youtube_url || ""} onChange={handleChange} />
            </div>
          </CardContent>
        </Card>

        {/* Website Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Website Status
            </CardTitle>
            <CardDescription>Control public access to your website</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-sand/10">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">When enabled, customers will see a maintenance page. Admins can still access the site.</p>
              </div>
              <Switch 
                checked={formData.is_maintenance_mode || false} 
                onCheckedChange={(c) => handleSwitchChange("is_maintenance_mode", c)} 
              />
            </div>
            
            {formData.is_maintenance_mode && (
              <div className="p-4 border rounded-lg bg-sand/5 space-y-3">
                <div className="space-y-1">
                  <Label className="text-base font-semibold">Maintenance End Time</Label>
                  <p className="text-sm text-muted-foreground">Set a target date and time for the countdown timer on the maintenance page.</p>
                </div>
                <Input 
                  type="datetime-local" 
                  name="maintenance_end_time" 
                  value={formData.maintenance_end_time || ""} 
                  onChange={handleChange} 
                  className="max-w-md"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing & Shipping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-primary" /> Billing & Shipping Settings
            </CardTitle>
            <CardDescription>Configure GST and shipping calculation rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* GST Settings */}
            <div className="space-y-4 pb-4 border-b border-border">
              <h3 className="font-semibold text-cocoa">Tax Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-sand/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Enable GST Calculation</Label>
                    <p className="text-sm text-muted-foreground">Automatically add GST to orders.</p>
                  </div>
                  <Switch 
                    checked={formData.enable_gst || false} 
                    onCheckedChange={(c) => handleSwitchChange("enable_gst", c)} 
                  />
                </div>
                
                {formData.enable_gst && (
                  <div className="space-y-2">
                    <Label>GST Percentage (%)</Label>
                    <Input 
                      type="number" 
                      name="gst_percentage" 
                      value={formData.gst_percentage || ""} 
                      onChange={handleChange} 
                      placeholder="e.g., 18" 
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Shipping Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-cocoa">Shipping Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Home Pincodes / State</Label>
                  <Input 
                    name="home_state" 
                    value={formData.home_state || ""} 
                    onChange={handleChange} 
                    placeholder="e.g. 60, 61, 62, 63, 64" 
                  />
                  <p className="text-[10px] text-muted-foreground leading-tight">Comma-separated pincode prefixes (e.g. 60, 61) or state name.</p>
                </div>
                <div className="space-y-2">
                  <Label>Shipping Charge (Home State) ₹</Label>
                  <Input 
                    type="number" 
                    name="shipping_charge_home" 
                    value={formData.shipping_charge_home || ""} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shipping Charge (Other States) ₹</Label>
                  <Input 
                    type="number" 
                    name="shipping_charge_other" 
                    value={formData.shipping_charge_other || ""} 
                    onChange={handleChange} 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-sand/10">
                  <div className="space-y-0.5">
                    <Label className="text-base font-semibold">Enable Free Shipping Threshold</Label>
                    <p className="text-sm text-muted-foreground">Offer free shipping over a certain amount.</p>
                  </div>
                  <Switch 
                    checked={formData.enable_free_shipping || false} 
                    onCheckedChange={(c) => handleSwitchChange("enable_free_shipping", c)} 
                  />
                </div>

                {formData.enable_free_shipping && (
                  <div className="space-y-2">
                    <Label>Free Shipping Above (₹)</Label>
                    <Input 
                      type="number" 
                      name="free_shipping_above" 
                      value={formData.free_shipping_above || ""} 
                      onChange={handleChange} 
                      placeholder="e.g., 3000" 
                    />
                  </div>
                )}
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end gap-4 pb-12">
          <Button type="button" variant="outline" onClick={() => {
            if (settings) setFormData(settings);
          }}>
            Reset
          </Button>
          <Button type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Company Details
          </Button>
        </div>

      </form>
    </div>
  );
}

