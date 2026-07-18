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

  const handleSave = () => {
    updateBanner(localBanner, {
      onSuccess: () => toast.success("Promo strip settings saved!")
    });
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
            placeholder="e.g. Free shipping on orders over ₹1000! 🚚" 
          />
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
          <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-medium">
            {localBanner.headline}
          </div>
        </div>
      )}
      
      <div className="pt-4 border-t border-cocoa/10 flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-8">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
