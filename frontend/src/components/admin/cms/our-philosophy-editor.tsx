import { useState, useEffect } from "react";
import { useCmsSection, useUpdateCmsSection, usePhilosophyCards, useUpdatePhilosophyCards, CmsSection, PhilosophyCard } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Heart, Sparkles, Leaf, Users, Star, Droplets, Sun, Moon, Shield, Smile } from "lucide-react";

const AVAILABLE_ICONS: Record<string, React.ElementType> = {
  Heart, Sparkles, Leaf, Users, Star, Droplets, Sun, Moon, Shield, Smile
};

export function OurPhilosophyEditor() {
  const { data: section, isLoading: isSectionLoading } = useCmsSection("our_philosophy");
  const { data: cards, isLoading: isCardsLoading } = usePhilosophyCards();
  
  const { mutate: updateSection, isPending: isSectionPending } = useUpdateCmsSection();
  const { mutate: updateCards, isPending: isCardsPending } = useUpdatePhilosophyCards();

  const [localSection, setLocalSection] = useState<CmsSection | null>(null);
  const [localCards, setLocalCards] = useState<PhilosophyCard[]>([]);

  useEffect(() => {
    if (section && !localSection) {
      setLocalSection({ ...section });
    } else if (!section && !localSection && !isSectionLoading) {
      setLocalSection({
        id: `CMS-${Date.now()}`,
        key: "our_philosophy",
        title: "Our Philosophy",
        body: "Every Lil Viaa garment is designed for all-day comfort, timeless style, and lasting quality.",
        image_url: null,
      });
    }
  }, [section, localSection, isSectionLoading]);

  useEffect(() => {
    if (cards && localCards.length === 0) {
      setLocalCards([...cards]);
    }
  }, [cards, localCards]);

  if (isSectionLoading || isCardsLoading || !localSection) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Our Philosophy Config...</div>;
  }

  const handleSave = () => {
    updateSection(localSection, {
      onSuccess: () => {
        updateCards(localCards, {
          onSuccess: () => toast.success("Our Philosophy section saved!")
        });
      }
    });
  };

  const handleCardChange = (index: number, field: keyof PhilosophyCard, value: string) => {
    const newCards = [...localCards];
    newCards[index] = { ...newCards[index], [field]: value };
    setLocalCards(newCards);
  };

  const handleSetAsDefault = () => {
    localStorage.setItem('lilviaa_custom_default_our_philosophy', JSON.stringify({ section: localSection, cards: localCards }));
    toast.success("Saved as your custom default.");
  };

  const handleResetToDefault = () => {
    try {
      const savedDefault = localStorage.getItem('lilviaa_custom_default_our_philosophy');
      if (savedDefault) {
        const parsed = JSON.parse(savedDefault);
        setLocalSection(parsed.section);
        setLocalCards(parsed.cards);
        toast.info("Restored custom default values.");
        return;
      }
    } catch (e) {}

    // Factory fallback
    setLocalSection({
      id: `CMS-${Date.now()}`,
      key: "our_philosophy",
      title: "Our Philosophy",
      body: "Every Lil Viaa garment is designed for all-day comfort, timeless style, and lasting quality.",
      image_url: null,
    });
    setLocalCards([
      { id: "PC-1", icon: "Heart", title: "Thoughtful Design", description: "Unlike brands that focus on fast-changing trends, we create timeless pieces that parents can trust for their quality, durability, and everyday comfort.", sort_order: 1 },
      { id: "PC-2", icon: "Sparkles", title: "Quiet Luxury", description: "Rather than bold statements, we focus on exceptional craftsmanship, premium materials, and refined details that make every outfit feel special.", sort_order: 2 },
      { id: "PC-3", icon: "Leaf", title: "Lasting Value", description: "We believe in buying better, not more. Every collection is designed to be versatile, long-lasting, and made to be worn and loved repeatedly.", sort_order: 3 },
      { id: "PC-4", icon: "Users", title: "Built on Trust", description: "We don't promise perfection—we promise thoughtfulness. From selecting the right fabric to perfecting the fit, we create clothing children genuinely enjoy wearing.", sort_order: 4 },
    ]);
    toast.info("Restored original values. Click 'Save Changes' to apply.");
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-cocoa">"Our Philosophy" Section</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage the philosophy cards displayed on the About page.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label>Section Title</Label>
          <Input 
            value={localSection.title} 
            onChange={(e) => setLocalSection({ ...localSection, title: e.target.value })} 
            placeholder="e.g. Our Philosophy" 
          />
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <Label>Philosophy Cards</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {localCards.map((card, idx) => (
            <div key={card.id} className="p-4 bg-sand/20 rounded-xl border border-cocoa/10 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-butter rounded-full flex items-center justify-center text-cocoa shrink-0">
                  {AVAILABLE_ICONS[card.icon] ? (() => {
                    const Icon = AVAILABLE_ICONS[card.icon];
                    return <Icon className="w-5 h-5" />;
                  })() : <Heart className="w-5 h-5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Icon Name</Label>
                  <select 
                    className="w-full text-sm border-cocoa/20 rounded-md py-1 px-2"
                    value={card.icon}
                    onChange={(e) => handleCardChange(idx, "icon", e.target.value)}
                  >
                    {Object.keys(AVAILABLE_ICONS).map(iconName => (
                      <option key={iconName} value={iconName}>{iconName}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Card Title</Label>
                <Input 
                  value={card.title}
                  onChange={(e) => handleCardChange(idx, "title", e.target.value)}
                  className="bg-white"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Description</Label>
                <Textarea 
                  value={card.description}
                  onChange={(e) => handleCardChange(idx, "description", e.target.value)}
                  className="bg-white min-h-[80px]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label>Footer Highlight Text</Label>
          <Textarea 
            value={localSection.body} 
            onChange={(e) => setLocalSection({ ...localSection, body: e.target.value })} 
            placeholder="e.g. Every garment is designed for..." 
          />
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
          <Button onClick={handleSave} disabled={isSectionPending || isCardsPending} className="flex-1 sm:flex-none bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-4 sm:px-8 transition-all text-xs sm:text-sm">
            {isSectionPending || isCardsPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
