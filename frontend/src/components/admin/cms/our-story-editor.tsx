import { useState, useEffect } from "react";
import { useCmsSection, useUpdateCmsSection, CmsSection, uploadCmsImage } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function OurStoryEditor() {
  const { data: section, isLoading } = useCmsSection("our_story");
  const { mutate: updateSection, isPending } = useUpdateCmsSection();

  const [localSection, setLocalSection] = useState<CmsSection | null>(null);

  useEffect(() => {
    if (section && !localSection) {
      setLocalSection({ ...section });
    } else if (!section && !localSection && !isLoading) {
      setLocalSection({
        id: `CMS-${Date.now()}`,
        key: "our_story",
        title: "",
        body: "",
        image_url: null,
      });
    }
  }, [section, localSection, isLoading]);

  if (isLoading || !localSection) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Our Story Config...</div>;
  }

  const handleSave = () => {
    updateSection(localSection, {
      onSuccess: () => toast.success("Our Story section saved!")
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && localSection) {
      const file = e.target.files[0];
      e.target.value = "";
      const toastId = toast.loading("Uploading image...");
      try {
        const publicUrl = await uploadCmsImage(file);
        setLocalSection({ ...localSection, image_url: publicUrl });
        toast.success("Image uploaded successfully!", { id: toastId });
      } catch (error) {
        toast.error("Failed to upload image", { id: toastId });
      }
    }
  };

  const handleSetAsDefault = () => {
    localStorage.setItem('lilviaa_custom_default_our_story', JSON.stringify(localSection));
    toast.success("Saved as your custom default.");
  };

  const handleResetToDefault = () => {
    try {
      const savedDefault = localStorage.getItem('lilviaa_custom_default_our_story');
      if (savedDefault) {
        setLocalSection(JSON.parse(savedDefault));
        toast.info("Restored custom default values.");
        return;
      }
    } catch (e) {}

    // Factory fallback
    setLocalSection({
      id: `CMS-${Date.now()}`,
      key: "our_story",
      title: "Crafting Childhood Memories",
      body: "At Lilviaa, we believe every child deserves clothing that is as playful and vibrant as their imagination. Founded in 2024, our mission is to create comfortable, sustainable, and stylish apparel for the little ones you love.",
      image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=800",
    });
    toast.info("Restored original values. Click 'Save Changes' to apply.");
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-cocoa">"Our Story" Section</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage the brand story text displayed on the homepage and about page. (Images must be .webp)</p>
        </div>
      </div>
      
      <input type="file" id="story-img-upload" className="hidden" accept="image/webp" onChange={handleImageUpload} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Section Title</Label>
            <Input 
              value={localSection.title} 
              onChange={(e) => setLocalSection({ ...localSection, title: e.target.value })} 
              placeholder="e.g. Crafting Childhood Memories" 
            />
          </div>
          
          <div className="space-y-1.5">
            <Label>Story Content</Label>
            <Textarea 
              value={localSection.body} 
              onChange={(e) => setLocalSection({ ...localSection, body: e.target.value })} 
              placeholder="Write your brand story here... (Markdown supported)" 
              className="min-h-[200px]"
            />
            <p className="text-[10px] text-muted-foreground">Markdown formatting is supported.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-cocoa/70 uppercase tracking-wider">Accompanying Image</Label>
            {localSection.image_url ? (
              <div className="relative aspect-[4/3] bg-sand/20 rounded-xl overflow-hidden border border-cocoa/10 group">
                <img src={localSection.image_url} alt="Our Story" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="sm" variant="secondary" onClick={() => document.getElementById('story-img-upload')?.click()}>Change</Button>
                  <Button size="sm" variant="destructive" onClick={() => setLocalSection({ ...localSection, image_url: null })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => document.getElementById('story-img-upload')?.click()}
                className="w-full aspect-[4/3] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <ImagePlus className="h-6 w-6 text-cocoa/40" />
                <span className="text-sm font-medium">Click to upload image</span>
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-cocoa/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
        <div className="flex w-full sm:w-auto items-center justify-between sm:mr-auto mb-2 sm:mb-0">
          <Button variant="ghost" onClick={handleSetAsDefault} className="rounded-full px-4 text-xs font-semibold text-cocoa/50 hover:text-cocoa hover:bg-cocoa/5 -ml-2 sm:ml-0">
            Set as Default
          </Button>
        </div>
        <div className="flex w-full sm:w-auto items-center justify-end gap-2 sm:gap-3">
          <Button variant="outline" onClick={handleResetToDefault} className="flex-1 sm:flex-none rounded-full px-4 sm:px-6 text-cocoa/70 border-cocoa/20 hover:bg-cocoa/5 text-xs sm:text-sm">
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={isPending} className="flex-1 sm:flex-none bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-4 sm:px-8 transition-all text-xs sm:text-sm">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
