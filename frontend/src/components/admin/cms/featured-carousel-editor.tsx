import { useState, useEffect, useRef } from "react";
import { useFeaturedProducts, useUpdateFeaturedProducts, FeaturedProduct, useCmsSection, useUpdateCmsSection, CmsSection } from "@/lib/admin/cms-api";
import { useProducts, Product } from "@/lib/admin/products-api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { GripVertical, X, Search, Plus, ImagePlus, Trash2 } from "lucide-react";
import { CustomSelect } from "@/components/ui/custom-select";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

export function FeaturedCarouselEditor() {
  const { data: serverFeatured, isLoading: isLoadingFeatured } = useFeaturedProducts();
  const { mutate: updateFeatured, isPending: isUpdatingFeatured } = useUpdateFeaturedProducts();
  
  const { data: sectionData, isLoading: isLoadingSection } = useCmsSection("featured_products_section");
  const { mutate: updateSection, isPending: isUpdatingSection } = useUpdateCmsSection();
  
  const isUpdating = isUpdatingFeatured || isUpdatingSection;

  // Need products to show name/image of the featured items
  const { data: products = [], isLoading: isLoadingProducts } = useProducts("all");

  const [featured, setFeatured] = useState<FeaturedProduct[]>([]);
  const [section, setSection] = useState<CmsSection | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [tagFilter, setTagFilter] = useState("all");
  const [isSearching, setIsSearching] = useState(false);

  const fileInputRef1 = useRef<HTMLInputElement>(null);
  const fileInputRef2 = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (serverFeatured) {
      setFeatured([...serverFeatured]);
    }
  }, [serverFeatured]);
  
  useEffect(() => {
    if (sectionData) {
      setSection({ ...sectionData });
    } else if (!sectionData && !isLoadingSection) {
      setSection({
        id: `CMS-${Date.now()}`,
        key: "featured_products_section",
        title: "Bestsellers this week",
        body: "Loved by little ones",
        image_url: null
      });
    }
  }, [sectionData, isLoadingSection]);

  if (isLoadingFeatured || isLoadingProducts || isLoadingSection || !section) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Featured Products...</div>;
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(featured);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    
    setFeatured(updatedItems);
  };

  const handleRemove = (index: number) => {
    const newItems = [...featured];
    newItems.splice(index, 1);
    setFeatured(newItems.map((item, i) => ({ ...item, sort_order: i + 1 })));
  };

  const handleAdd = (product: Product) => {
    if (featured.find(f => f.product_id === product.id)) {
      toast.error("Product is already featured.");
      return;
    }
    
    const newItem: FeaturedProduct = {
      id: `FP-${Date.now()}`,
      product_id: product.id,
      sort_order: featured.length + 1,
    };
    setFeatured([...featured, newItem]);
    setIsSearching(false);
    setSearchTerm("");
  };

  const handleSave = () => {
    updateFeatured(featured);
    updateSection(section);
  };

  const handleImageUpload = (field: 'image_url' | 'secondary_image_url') => {
    if (field === 'image_url') {
      fileInputRef1.current?.click();
    } else {
      fileInputRef2.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'secondary_image_url') => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (section) {
        setSection({ ...section, [field]: url });
      }
      e.target.value = ""; // reset
    }
  };

  // Filter products for the search dropdown
  const filteredProducts = products.filter(p => {
    const matchesSearch = searchTerm ? p.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    const matchesTag = tagFilter === "all" ? true : p.tag === tagFilter;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-cocoa">Featured Products Carousel</h2>
          <p className="text-xs text-muted-foreground mt-1">Select and reorder products to feature on the homepage.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-4 border-b border-cocoa/10">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Section Title</Label>
          <Input 
            value={section.title} 
            onChange={(e) => setSection({ ...section, title: e.target.value })} 
            placeholder="e.g. Bestsellers this week" 
            className="h-10 text-sm bg-card"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Section Subtitle</Label>
          <Input 
            value={section.body} 
            onChange={(e) => setSection({ ...section, body: e.target.value })} 
            placeholder="e.g. Loved by little ones" 
            className="h-10 text-sm bg-card"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 pb-6 border-b border-cocoa/10">
        <input 
          type="file" 
          ref={fileInputRef1} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, 'image_url')} 
        />
        <input 
          type="file" 
          ref={fileInputRef2} 
          className="hidden" 
          accept="image/*" 
          onChange={(e) => handleFileChange(e, 'secondary_image_url')} 
        />
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Editorial Image 1 (Left)</Label>
          {section.image_url ? (
            <div className="relative aspect-[3/4] max-w-[160px] bg-sand/20 rounded-xl overflow-hidden border border-cocoa/10 group">
              <img src={section.image_url} alt="Editorial 1" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleImageUpload('image_url')}>Change</Button>
                <Button size="sm" variant="destructive" onClick={() => setSection({ ...section, image_url: null })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => handleImageUpload('image_url')}
              className="w-full max-w-[160px] aspect-[3/4] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <ImagePlus className="h-6 w-6 text-cocoa/40" />
              <span className="text-xs font-medium text-center px-4">Upload Left Image</span>
            </button>
          )}
        </div>
        
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Editorial Image 2 (Right)</Label>
          {section.secondary_image_url ? (
            <div className="relative aspect-[3/4] max-w-[160px] bg-sand/20 rounded-xl overflow-hidden border border-cocoa/10 group">
              <img src={section.secondary_image_url} alt="Editorial 2" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => handleImageUpload('secondary_image_url')}>Change</Button>
                <Button size="sm" variant="destructive" onClick={() => setSection({ ...section, secondary_image_url: null })}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => handleImageUpload('secondary_image_url')}
              className="w-full max-w-[160px] aspect-[3/4] border-2 border-dashed border-cocoa/20 rounded-xl bg-sand/10 hover:bg-sand/30 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground"
            >
              <ImagePlus className="h-6 w-6 text-cocoa/40" />
              <span className="text-xs font-medium text-center px-4">Upload Right Image</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Search */}
      <div className="relative z-10">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Add Product</Label>
        <div className="flex gap-2 relative">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search products by name..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              className="pl-9 h-10 bg-card"
            />
          </div>
          <div className="w-[200px]">
            <CustomSelect 
              value={tagFilter}
              onChange={(val) => {
                setTagFilter(val);
                setIsSearching(true);
              }}
              options={[
                { l: "All Badges", v: "all" },
                { l: "New Arrival", v: "new" },
                { l: "Bestseller", v: "bestseller" },
                { l: "Sale", v: "sale" }
              ]}
            />
          </div>
        </div>
        
        {isSearching && (searchTerm || tagFilter !== "all") && (
          <div className="absolute top-full mt-2 left-0 right-0 bg-white border border-cocoa/10 rounded-xl shadow-lg max-h-60 overflow-y-auto overflow-x-hidden">
            {filteredProducts.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">No products found.</div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => handleAdd(product)}
                    className="w-full flex items-center justify-between p-2 hover:bg-sand/30 rounded-lg text-left transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded border border-cocoa/10 overflow-hidden bg-sand/10 shrink-0">
                        {product.images[0] ? (
                          <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cocoa">{product.name}</p>
                        <p className="text-xs text-muted-foreground">₹{product.price}</p>
                      </div>
                    </div>
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="featured-products" direction="horizontal">
          {(provided) => (
            <div 
              className="flex gap-4 overflow-x-auto pb-4 pt-2 min-h-[140px]" 
              {...provided.droppableProps} 
              ref={provided.innerRef}
            >
              {featured.map((item, index) => {
                const product = products.find(p => p.id === item.product_id);
                return (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative group shrink-0 w-32 rounded-xl border border-cocoa/10 bg-white overflow-hidden shadow-sm"
                      >
                        <div className="aspect-[3/4] bg-sand/10 relative">
                          {product?.images?.[0] ? (
                            <img src={product.images[0].url} alt={product?.name || "Product"} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No Img</div>
                          )}
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div
                              {...provided.dragHandleProps}
                              className="p-2 text-white hover:scale-110 transition-transform cursor-grab"
                            >
                              <GripVertical className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                        <div className="p-2 border-t border-cocoa/5">
                          <p className="text-[10px] font-medium text-cocoa truncate">{product?.name || "Unknown Product"}</p>
                        </div>
                        <button
                          onClick={() => handleRemove(index)}
                          className="absolute top-1 right-1 h-6 w-6 bg-white/90 rounded-full flex items-center justify-center text-cocoa hover:bg-white hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all shadow-sm"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {provided.placeholder}
              
              {featured.length === 0 && (
                <div className="w-full py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-sand/5 text-sm">
                  No featured products selected. Search and add above.
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
      <div className="pt-4 border-t border-cocoa/10 flex justify-end">
        <Button onClick={handleSave} disabled={isUpdating} className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-8">
          {isUpdating ? "Saving..." : "Save Carousel"}
        </Button>
      </div>
    </div>
  );
}
