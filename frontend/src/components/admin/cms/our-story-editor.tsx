import { useState, useEffect } from "react";
import { useCmsSection, useUpdateCmsSection, CmsSection } from "@/lib/admin/cms-api";
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

  const handleImageUpload = () => {
    const url = prompt("Enter image URL for Our Story:");
    if (url) {
      setLocalSection({ ...localSection, image_url: url });
    }
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-cocoa">"Our Story" Section</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage the brand story text displayed on the homepage and about page.</p>
        </div>
      </div>

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
                  <Button size="sm" variant="secondary" onClick={handleImageUpload}>Change</Button>
                  <Button size="sm" variant="destructive" onClick={() => setLocalSection({ ...localSection, image_url: null })}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleImageUpload}
                className="w-full aspect-[4/3] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
              >
                <ImagePlus className="h-6 w-6 text-cocoa/40" />
                <span className="text-sm font-medium">Click to upload image</span>
              </button>
            )}
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
