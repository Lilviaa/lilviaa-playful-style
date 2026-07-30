import { useState, useEffect } from "react";
import { useBanners, useUpdateBanner, Banner } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Link as LinkIcon, Megaphone } from "lucide-react";
import { toast } from "sonner";

export function PromoStripEditor() {
  const { data: banners, isLoading } = useBanners();
  const { mutate: updateBanner, isPending } = useUpdateBanner();

  const [localBanner, setLocalBanner] = useState<Banner | null>(null);

  useEffect(() => {
    if (banners) {
      const promo = banners.find(b => b.type === "promo_strip");
      if (promo && !localBanner) {
        setLocalBanner({ ...promo });
      } else if (!promo && !localBanner) {
        setLocalBanner({
          id: `BAN-${Date.now()}`,
          type: "promo_strip",
          image_url: null,
          headline: "",
          subtext: "",
          cta_text: "",
          cta_link: "",
          active: false,
          start_date: null,
          end_date: null,
          sort_order: 1,
        });
      }
    }
  }, [banners, localBanner]);

  if (isLoading || !localBanner) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Promo Config...</div>;
  }

  const serverBanner = banners?.find(b => b.type === "promo_strip");
  const hasUnsavedChanges = serverBanner && localBanner ? (
    localBanner.headline !== serverBanner.headline ||
    localBanner.cta_link !== serverBanner.cta_link ||
    localBanner.active !== serverBanner.active
  ) : false;

  const handleSave = () => {
    updateBanner(localBanner, {
      onSuccess: () => toast.success("Promo strip settings saved!")
    });
  };

  const handleSetAsDefault = () => {
    localStorage.setItem('lilviaa_custom_default_promo', JSON.stringify(localBanner));
    toast.success("Current settings saved as the new default!");
  };

  const handleResetToDefault = () => {
    try {
      const savedDefault = localStorage.getItem('lilviaa_custom_default_promo');
      if (savedDefault) {
        setLocalBanner(JSON.parse(savedDefault));
        toast.info("Restored custom default values.");
        return;
      }
    } catch (e) {}

    setLocalBanner({
      ...localBanner,
      headline: "Wholesale Orders Available • 🚚 Free Shipping Above ₹3,000 • 🌍 Worldwide Shipping • 🇮🇳 Proudly Made in India • 👶 Boys Collection (6 Months – 6 Years)",
      cta_link: "",
      cta_text: "",
      active: true,
    });
    toast.info("Restored original values. Click 'Save Changes' to apply.");
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Megaphone className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-cocoa">Announcement Strip</h2>
            <p className="text-xs text-muted-foreground mt-0.5">The thin promotional banner at the very top of the site.</p>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-sand/30 px-3 py-1.5 rounded-xl border border-cocoa/5">
          <Label htmlFor="promo-active" className="text-sm font-semibold cursor-pointer">Visibility</Label>
          <Switch 
            id="promo-active"
            checked={localBanner.active} 
            onCheckedChange={(checked) => setLocalBanner({ ...localBanner, active: checked })} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <Label>Announcement Text</Label>
          <Input 
            value={localBanner.headline} 
            onChange={(e) => setLocalBanner({ ...localBanner, headline: e.target.value })} 
            placeholder="e.g. Free shipping! | New Arrivals | Sale" 
          />
          <p className="text-[10px] text-muted-foreground">Tip: Use the <code className="bg-sand/30 px-1 py-0.5 rounded font-bold">|</code> (pipe) character to separate sentences. It will automatically become a bullet point!</p>
        </div>
        
        <div className="space-y-1.5">
          <Label>Optional Link</Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              value={localBanner.cta_link} 
              onChange={(e) => setLocalBanner({ ...localBanner, cta_link: e.target.value })} 
              className="pl-9" 
              placeholder="/collections/sale" 
            />
          </div>
        </div>
      </div>
      
      {localBanner.active && localBanner.headline && (
        <div className="mt-4 border rounded overflow-hidden">
          <div className="text-xs font-semibold text-muted-foreground bg-sand/30 px-3 py-1.5 border-b">Live Preview</div>
          <div className="bg-primary text-primary-foreground py-2 text-sm font-medium overflow-hidden whitespace-nowrap">
            <div className="flex animate-[scrollMarquee_15s_linear_infinite] w-max items-center">
              {Array(3).fill(localBanner.headline).map((text, i) => (
                <div key={i} className="flex items-center px-8 whitespace-nowrap text-sm font-semibold tracking-wide">
                  {text.split(/\||•/).map((part: string, idx: number, arr: string[]) => (
                    <span key={idx} className="flex items-center">
                      <span>{part.trim()}</span>
                      {localBanner.cta_text && idx === arr.length - 1 && <span className="underline ml-2 mr-1">{localBanner.cta_text}</span>}
                      {idx < arr.length - 1 && <span className="mx-6 opacity-40">•</span>}
                    </span>
                  ))}
                  <span className="mx-6 opacity-40">•</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-cocoa/10 flex items-center justify-end gap-3">
        <Button variant="ghost" onClick={handleSetAsDefault} className="rounded-full px-4 text-xs font-semibold text-cocoa/50 hover:text-cocoa hover:bg-cocoa/5 mr-auto">
          Set as Default
        </Button>
        {hasUnsavedChanges && (
          <span className="text-[11px] font-medium text-amber-600 mr-2 flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Unsaved changes
          </span>
        )}
        <Button variant="outline" onClick={handleResetToDefault} className="rounded-full px-6 text-cocoa/70 border-cocoa/20 hover:bg-cocoa/5">
          Reset to Default
        </Button>
        <Button onClick={handleSave} disabled={isPending || !hasUnsavedChanges} className="bg-cocoa hover:bg-cocoa/90 disabled:opacity-50 text-white rounded-full px-8 transition-all">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
