import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useSettings, useUpdateSettings, StoreSettings } from '@/lib/admin/settings-api';
import { GeneralSettings } from '@/components/admin/settings/general-settings';
import { ShippingSettings } from '@/components/admin/settings/shipping-settings';
import { TaxPaymentSettings } from '@/components/admin/settings/tax-payment-settings';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Store, Truck, Receipt, Save } from 'lucide-react';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const { data: serverSettings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();

  const [localSettings, setLocalSettings] = useState<StoreSettings | null>(null);
  const [activeTab, setActiveTab] = useState("general");

  useEffect(() => {
    if (serverSettings && !localSettings) {
      setLocalSettings(serverSettings);
    }
  }, [serverSettings, localSettings]);

  if (isLoading || !localSettings) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-2xl border border-cocoa/10 bg-white">
        <div className="text-muted-foreground animate-pulse font-medium">Loading store settings...</div>
      </div>
    );
  }

  const handleSave = () => {
    updateSettings(localSettings);
  };

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage global store configurations and integrations.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isPending}
          className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-6 gap-2"
        >
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col md:flex-row gap-8">
        <TabsList className="flex flex-col h-auto w-full md:w-64 bg-transparent space-y-1 items-stretch justify-start">
          <TabsTrigger 
            value="general" 
            className={`justify-start px-4 py-3 rounded-xl gap-3 transition-colors ${activeTab === "general" ? "bg-sand/50 text-cocoa font-bold" : "text-muted-foreground hover:bg-sand/30"}`}
          >
            <Store className="h-5 w-5" /> General Details
          </TabsTrigger>
          <TabsTrigger 
            value="shipping" 
            className={`justify-start px-4 py-3 rounded-xl gap-3 transition-colors ${activeTab === "shipping" ? "bg-sand/50 text-cocoa font-bold" : "text-muted-foreground hover:bg-sand/30"}`}
          >
            <Truck className="h-5 w-5" /> Shipping Zones
          </TabsTrigger>
          <TabsTrigger 
            value="taxes" 
            className={`justify-start px-4 py-3 rounded-xl gap-3 transition-colors ${activeTab === "taxes" ? "bg-sand/50 text-cocoa font-bold" : "text-muted-foreground hover:bg-sand/30"}`}
          >
            <Receipt className="h-5 w-5" /> Taxes & Payments
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 min-w-0">
          <TabsContent value="general" className="mt-0 outline-none">
            <GeneralSettings 
              details={localSettings.details} 
              onChange={(details) => setLocalSettings({ ...localSettings, details })} 
            />
          </TabsContent>
          <TabsContent value="shipping" className="mt-0 outline-none">
            <ShippingSettings 
              shipping={localSettings.shipping} 
              onChange={(shipping) => setLocalSettings({ ...localSettings, shipping })} 
            />
          </TabsContent>
          <TabsContent value="taxes" className="mt-0 outline-none">
            <TaxPaymentSettings 
              taxes={localSettings.taxes} 
              payments={localSettings.payments}
              onTaxesChange={(taxes) => setLocalSettings({ ...localSettings, taxes })}
              onPaymentsChange={(payments) => setLocalSettings({ ...localSettings, payments })}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}