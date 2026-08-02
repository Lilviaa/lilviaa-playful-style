import { useState, useEffect, useRef } from "react";
import { useBanners, useUpdateBanner, Banner, useHeroSlides, useUpdateHeroSlides, HeroSlide, uploadCmsImage } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, Trash2, CalendarDays, GripVertical, UploadCloud, AlertCircle, LinkIcon } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function HeroBannerEditor() {
  const { data: banners, isLoading: isLoadingBanners } = useBanners();
  const { mutate: updateBanner, isPending: isUpdatingBanner } = useUpdateBanner();
  
  const { data: slides, isLoading: isLoadingSlides } = useHeroSlides();
  const { mutate: updateSlides, isPending: isUpdatingSlides } = useUpdateHeroSlides();

  const [localBanner, setLocalBanner] = useState<Banner | null>(null);
  const [localSlides, setLocalSlides] = useState<HeroSlide[]>([]);

  const posterInputRef = useRef<HTMLInputElement>(null);
  const sliderInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (slides) {
      setLocalSlides([...slides]);
    }
  }, [slides]);

  if (isLoadingBanners || isLoadingSlides || !localBanner) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Hero Banner Config...</div>;
  }

  const handleSave = () => {
    updateBanner(localBanner, {
      onSuccess: () => {
        updateSlides(localSlides, {
          onSuccess: () => toast.success("Hero Banner settings saved!")
        });
      }
    });
  };

  const isPending = isUpdatingBanner || isUpdatingSlides;

  const hasUnsavedChanges = () => {
    if (!banners || !slides || !localBanner) return false;
    const hero = banners.find(b => b.type === "hero");
    
    // Compare banner
    if (hero) {
      if (hero.image_url !== localBanner.image_url) return true;
      if (hero.headline !== localBanner.headline) return true;
      if (hero.subtext !== localBanner.subtext) return true;
      if (hero.description !== localBanner.description) return true;
      if (hero.cta_text !== localBanner.cta_text) return true;
      if (hero.cta_link !== localBanner.cta_link) return true;
      if (hero.start_date !== localBanner.start_date) return true;
      if (hero.end_date !== localBanner.end_date) return true;
      if (hero.active !== localBanner.active) return true;
    }
    
    // Compare slides length
    if (slides.length !== localSlides.length) return true;
    
    // Compare slides content and order
    for (let i = 0; i < slides.length; i++) {
      if (slides[i].image_url !== localSlides[i].image_url) return true;
      if (slides[i].sort_order !== localSlides[i].sort_order) return true;
    }
    
    return false;
  };
  
  const isDirty = hasUnsavedChanges();

  const handleSetAsDefault = () => {
    localStorage.setItem('lilviaa_custom_default_hero_banner', JSON.stringify({ banner: localBanner, slides: localSlides }));
    toast.success("Saved as your custom default.");
  };

  const handleResetToDefault = () => {
    try {
      const savedDefault = localStorage.getItem('lilviaa_custom_default_hero_banner');
      if (savedDefault) {
        const parsed = JSON.parse(savedDefault);
        setLocalBanner(parsed.banner);
        setLocalSlides(parsed.slides);
        toast.info("Restored custom default values.");
        return;
      }
    } catch (e) {}

    setLocalBanner({
      ...localBanner,
      image_url: "",
      headline: "Made for Little Gentlemen.",
      subtext: "Premium Kidswear",
      description: "Every garment is thoughtfully crafted using premium-quality fabrics and timeless designs, ensuring your little ones stay comfortable all day.",
      cta_text: "Shop the collection",
      cta_link: "/shop",
      active: true,
      start_date: null,
      end_date: null,
    });
    setLocalSlides([
      { id: "HS-1", image_url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=1080", sort_order: 1 },
      { id: "HS-2", image_url: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=1080", sort_order: 2 },
      { id: "HS-3", image_url: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=1080", sort_order: 3 },
      { id: "HS-4", image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=1080", sort_order: 4 },
    ]);
    toast.info("Restored original values. Click 'Save Changes' to apply.");
  };

  const handlePosterChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      e.target.value = "";
      
      const toastId = toast.loading("Uploading image...");
      try {
        const publicUrl = await uploadCmsImage(file);
        setLocalBanner({ ...localBanner, image_url: publicUrl });
        toast.success("Image uploaded successfully!", { id: toastId });
      } catch (error) {
        toast.error("Failed to upload image", { id: toastId });
      }
    }
  };

  const handleSliderFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      e.target.value = "";
      
      let newSlides = [...localSlides];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const toastId = toast.loading(`Uploading slide ${i + 1} of ${files.length}...`);
        try {
          const publicUrl = await uploadCmsImage(file);
          newSlides.push({
            id: `HS-NEW-${Date.now()}-${i}`,
            image_url: publicUrl,
            sort_order: newSlides.length + 1,
          });
          toast.success(`Slide ${i + 1} uploaded!`, { id: toastId });
          // Update state incrementally so user sees progress
          setLocalSlides([...newSlides]);
        } catch (error) {
          toast.error(`Failed to upload slide ${i + 1}`, { id: toastId });
        }
      }
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(localSlides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setLocalSlides(items.map((item, index) => ({ ...item, sort_order: index + 1 })));
  };

  const removeSlide = (index: number) => {
    const items = [...localSlides];
    items.splice(index, 1);
    setLocalSlides(items.map((item, i) => ({ ...item, sort_order: i + 1 })));
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

      <div className="space-y-8">
        
        {/* DEFAULT TEXT CONTENT */}
        <div className="space-y-4 pt-4">
          <div>
            <h3 className="text-sm font-bold text-cocoa">Default Text Content</h3>
            <p className="text-xs text-muted-foreground mt-1">Manage the text displayed on the left side of the hero section.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-sand/10 p-5 rounded-xl border border-cocoa/5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Badge Text</Label>
                <Input 
                  value={localBanner.subtext || ""} 
                  onChange={(e) => setLocalBanner({ ...localBanner, subtext: e.target.value })} 
                  placeholder="e.g. Premium Kidswear" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Headline</Label>
                <Input 
                  value={localBanner.headline || ""} 
                  onChange={(e) => setLocalBanner({ ...localBanner, headline: e.target.value })} 
                  placeholder="e.g. Made for Little Gentlemen." 
                />
                <p className="text-[10px] text-cocoa/50 font-medium">Tip: Wrap text in *asterisks* to highlight it with the pink color and yellow underline (e.g. Test The *HomeHero.*)</p>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea 
                  value={localBanner.description || ""} 
                  onChange={(e) => setLocalBanner({ ...localBanner, description: e.target.value })} 
                  placeholder="e.g. Every garment is thoughtfully crafted..." 
                  className="min-h-[80px]"
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Button Text</Label>
                <Input 
                  value={localBanner.cta_text || ""} 
                  onChange={(e) => setLocalBanner({ ...localBanner, cta_text: e.target.value })} 
                  placeholder="e.g. Shop the collection" 
                />
              </div>
              <div className="space-y-1.5">
                <Label>Button Link</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    value={localBanner.cta_link || ""} 
                    onChange={(e) => setLocalBanner({ ...localBanner, cta_link: e.target.value })} 
                    className="pl-9" 
                    placeholder="/shop" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EVENT POSTER SECTION */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-cocoa">Sale / Event Poster (Optional)</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a promotional poster. If active and within dates, it will appear as the first slide. (Recommended: 1080x1350)
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="w-[200px] shrink-0">
              <input type="file" ref={posterInputRef} className="hidden" accept="image/*" onChange={handlePosterChange} />
              {localBanner.image_url ? (
                <div className="relative aspect-[4/5] w-full bg-sand/20 rounded-xl overflow-hidden border border-cocoa/10 group">
                  <img src={localBanner.image_url} alt="Event Poster" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary" onClick={() => posterInputRef.current?.click()}>Change</Button>
                    <Button size="sm" variant="destructive" onClick={() => setLocalBanner({ ...localBanner, image_url: "" })}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => posterInputRef.current?.click()}
                  className="w-full aspect-[4/5] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
                >
                  <ImagePlus className="h-6 w-6 text-cocoa/40" />
                  <span className="text-xs font-medium text-center px-4">Upload Event Poster</span>
                </button>
              )}
            </div>
            
            <div className="flex-1 space-y-4 bg-sand/10 p-4 rounded-xl border border-cocoa/5 w-full">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal bg-white",
                          !localBanner.start_date && "text-muted-foreground"
                        )}
                      >
                        {localBanner.start_date ? format(new Date(localBanner.start_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localBanner.start_date ? new Date(localBanner.start_date) : undefined}
                        onSelect={(date) => setLocalBanner({ ...localBanner, start_date: date ? date.toISOString() : null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                 <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3 w-3" /> End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full h-10 justify-start text-left font-normal bg-white",
                          !localBanner.end_date && "text-muted-foreground"
                        )}
                      >
                        {localBanner.end_date ? format(new Date(localBanner.end_date), "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={localBanner.end_date ? new Date(localBanner.end_date) : undefined}
                        onSelect={(date) => setLocalBanner({ ...localBanner, end_date: date ? date.toISOString() : null })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* DEFAULT SLIDER IMAGES SECTION */}
        <div className="space-y-4 pt-6 border-t border-cocoa/10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-cocoa">Default Slide Images</h3>
              <p className="text-xs text-muted-foreground mt-1">Manage the default rotating images. (Recommended: 1080x1350)</p>
            </div>
            <div>
              <input type="file" ref={sliderInputRef} className="hidden" accept="image/*" multiple onChange={handleSliderFilesChange} />
              <Button type="button" variant="outline" size="sm" onClick={() => sliderInputRef.current?.click()}>
                <UploadCloud className="mr-2 h-4 w-4" /> Add Images
              </Button>
            </div>
          </div>
          
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="default-slides" direction="horizontal">
              {(provided) => (
                <div 
                  className="flex gap-4 overflow-x-auto pb-4" 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                >
                  {localSlides.map((slide, index) => (
                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="relative flex-shrink-0 group rounded-xl overflow-hidden border border-border aspect-[4/5] h-32 md:h-40 bg-sand/30"
                        >
                          <img 
                            src={slide.image_url} 
                            alt={`Slide ${index + 1}`} 
                            className="h-full w-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div 
                              {...provided.dragHandleProps} 
                              className="absolute top-2 left-2 p-1.5 bg-black/50 hover:bg-black/80 rounded-md text-white cursor-grab active:cursor-grabbing backdrop-blur-sm"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            <button 
                              type="button"
                              onClick={() => removeSlide(index)}
                              className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive rounded-md text-white backdrop-blur-sm shadow-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

      </div>
      
      <div className="pt-4 border-t border-cocoa/10 flex items-center justify-between">
        <div>
          {isDirty && (
            <span className="text-sm font-medium text-amber-600 flex items-center gap-1.5 bg-amber-50 px-4 py-1.5 rounded-full border border-amber-200 shadow-sm animate-in fade-in zoom-in-95">
              <AlertCircle className="h-4 w-4" />
              Unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleSetAsDefault} className="rounded-full px-4 text-xs font-semibold text-cocoa/50 hover:text-cocoa hover:bg-cocoa/5 mr-auto">
            Set as Default
          </Button>
          <Button variant="outline" onClick={handleResetToDefault} className="rounded-full px-6 text-cocoa/70 border-cocoa/20 hover:bg-cocoa/5">
            Reset to Default
          </Button>
          <Button onClick={handleSave} disabled={isPending || !isDirty} className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-8 shadow-sm">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
