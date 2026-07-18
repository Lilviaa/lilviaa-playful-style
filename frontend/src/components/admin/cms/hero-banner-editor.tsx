import { useState, useEffect } from "react";
import { useBanners, useUpdateBanner, Banner } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImagePlus, Link as LinkIcon, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

export function HeroBannerEditor() {
  const { data: banners, isLoading } = useBanners();
  const { mutate: updateBanner, isPending } = useUpdateBanner();

  const [localBanner, setLocalBanner] = useState<Banner | null>(null);

  useEffect(() => {
    if (banners) {
      const hero = banners.find(b => b.type === "hero");
      if (hero && !localBanner) {
        setLocalBanner({ ...hero });
      } else if (!hero && !localBanner) {
        setLocalBanner({
          id: `BAN-${Date.now()}`,
          type: "hero",
          image_url: "",
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
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Hero Banner Config...</div>;
  }

  const handleSave = () => {
    updateBanner(localBanner, {
      onSuccess: () => toast.success("Hero Banner settings saved!")
    });
  };

  const handleImageUpload = () => {
    const url = prompt("Enter image URL for hero banner:");
    if (url) {
      setLocalBanner({ ...localBanner, image_url: url });
    }
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-cocoa">Homepage Hero Banner</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage the primary welcome banner at the top of the store.</p>
        </div>
        <div className="flex items-center gap-3 bg-sand/30 px-3 py-1.5 rounded-xl border border-cocoa/5">
          <Label htmlFor="hero-active" className="text-sm font-semibold cursor-pointer">Visibility</Label>
          <Switch 
            id="hero-active"
            checked={localBanner.active} 
            onCheckedChange={(checked) => setLocalBanner({ ...localBanner, active: checked })} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-cocoa/70 uppercase tracking-wider">Banner Image</Label>
            {localBanner.image_url ? (
              <div className="relative aspect-[21/9] bg-sand/20 rounded-xl overflow-hidden border border-cocoa/10 group">
                <img src={localBanner.image_url} alt="Hero Banner" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={handleImageUpload}>Change</Button>
                  <Button size="sm" variant="destructive" onClick={() => setLocalBanner({ ...localBanner, image_url: "" })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleImageUpload}
                className="w-full aspect-[21/9] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <ImagePlus className="h-6 w-6 text-cocoa/40" />
                <span className="text-sm font-medium">Click to upload banner image</span>
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Headline</Label>
            <Input 
              value={localBanner.headline} 
              onChange={(e) => setLocalBanner({ ...localBanner, headline: e.target.value })} 
              placeholder="e.g. Summer Collection 2024" 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label>Subtext</Label>
            <Input 
              value={localBanner.subtext} 
              onChange={(e) => setLocalBanner({ ...localBanner, subtext: e.target.value })} 
              placeholder="e.g. Discover the perfect outfits..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CTA Text</Label>
              <Input 
                value={localBanner.cta_text} 
                onChange={(e) => setLocalBanner({ ...localBanner, cta_text: e.target.value })} 
                placeholder="e.g. Shop Now" 
              />
            </div>
            <div className="space-y-1.5">
              <Label>CTA Link</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={localBanner.cta_link} 
                  onChange={(e) => setLocalBanner({ ...localBanner, cta_link: e.target.value })} 
                  className="pl-9" 
                  placeholder="/collections/summer" 
                />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-cocoa/5">
             <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> Start Date (Optional)</Label>
              <Input 
                type="date"
                value={localBanner.start_date?.split('T')[0] || ""} 
                onChange={(e) => setLocalBanner({ ...localBanner, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
              />
            </div>
             <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> End Date (Optional)</Label>
              <Input 
                type="date"
                value={localBanner.end_date?.split('T')[0] || ""} 
                onChange={(e) => setLocalBanner({ ...localBanner, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })} 
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-cocoa/10 flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-8">
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
