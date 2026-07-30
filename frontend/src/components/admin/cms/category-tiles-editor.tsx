import { useState, useEffect } from "react";
import { useCategoryTiles, useUpdateCategoryTiles, CategoryTile } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, X, Plus, UploadCloud, Edit2 } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRef } from "react";
import { useCategories } from "@/lib/categories-api";
import { CustomSelect } from "@/components/ui/custom-select";

const DEFAULT_CATEGORY_TILES: CategoryTile[] = [
  {
    id: "CT-1",
    image_url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=400",
    label: "Kurtas",
    link: "/shop?category=kurta",
    sort_order: 1,
  },
  {
    id: "CT-2",
    image_url: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=400",
    label: "Shirts",
    link: "/shop?category=shirt",
    sort_order: 2,
  },
  {
    id: "CT-3",
    image_url: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=400",
    label: "Ethnic",
    link: "/shop?category=ethnic",
    sort_order: 3,
  },
  {
    id: "CT-4",
    image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400",
    label: "Party",
    link: "/shop?category=party",
    sort_order: 4,
  }
];

export function CategoryTilesEditor() {
  const { data: serverTiles, isLoading } = useCategoryTiles();
  const { mutate: updateTiles, isPending } = useUpdateCategoryTiles();
  const { data: categories } = useCategories();

  const [tiles, setTiles] = useState<CategoryTile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingTileIndex, setEditingTileIndex] = useState<number | null>(null);

  useEffect(() => {
    if (serverTiles) {
      setTiles([...serverTiles]);
    }
  }, [serverTiles]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse bg-sand/20 rounded-2xl">Loading Category Tiles...</div>;
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(tiles);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index + 1,
    }));
    
    setTiles(updatedItems);
  };

  const handleAdd = () => {
    const newTile: CategoryTile = {
      id: `CT-${Date.now()}`,
      image_url: "",
      label: "New Category",
      link: "/collections/",
      sort_order: tiles.length + 1,
    };
    setTiles([...tiles, newTile]);
  };

  const handleRemove = (index: number) => {
    const newTiles = [...tiles];
    newTiles.splice(index, 1);
    setTiles(newTiles.map((t, i) => ({ ...t, sort_order: i + 1 })));
  };

  const handleChange = (index: number, field: keyof CategoryTile, value: string) => {
    const newTiles = [...tiles];
    newTiles[index] = { ...newTiles[index], [field]: value };
    setTiles(newTiles);
  };

  const hasUnsavedChanges = JSON.stringify(tiles) !== JSON.stringify(serverTiles || []);

  const handleSave = () => {
    updateTiles(tiles);
  };

  const handleSetAsDefault = () => {
    localStorage.setItem('lilviaa_custom_default_category_tiles', JSON.stringify(tiles));
    toast.success("Current tiles saved as the new default!");
  };

  const handleResetToDefault = () => {
    try {
      const savedDefault = localStorage.getItem('lilviaa_custom_default_category_tiles');
      if (savedDefault) {
        setTiles(JSON.parse(savedDefault));
        toast.info("Restored custom default tiles.");
        return;
      }
    } catch (e) {}

    // Add unique IDs to ensure react keys don't clash if resetting multiple times
    const fallback = DEFAULT_CATEGORY_TILES.map(t => ({...t, id: `CT-${Date.now()}-${t.id}`}));
    setTiles(fallback);
    toast.info("Restored original tiles. Click 'Save Tiles' to apply.");
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && editingTileIndex !== null) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      handleChange(editingTileIndex, "image_url", url);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white border border-cocoa/10 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-cocoa/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-cocoa">Category Tiles</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage the visual category links on the homepage. Drag to reorder.</p>
        </div>
        <Button onClick={handleAdd} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Tile
        </Button>
      </div>

      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleFileChange} 
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="category-tiles" direction="vertical">
          {(provided) => (
            <div 
              className="space-y-3" 
              {...provided.droppableProps} 
              ref={provided.innerRef}
            >
              {tiles.map((tile, index) => (
                <Draggable key={tile.id} draggableId={tile.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className="flex items-center gap-4 p-4 rounded-xl border border-cocoa/10 bg-sand/10 group hover:bg-sand/20 transition-colors"
                    >
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab text-muted-foreground hover:text-cocoa"
                      >
                        <GripVertical className="h-5 w-5" />
                      </div>
                      
                      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden border border-cocoa/10 bg-white">
                        {tile.image_url ? (
                          <img src={tile.image_url} alt={tile.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-medium text-muted-foreground bg-sand/30">No Img</div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 px-2">
                        <p className="text-sm font-bold text-cocoa truncate">{tile.label || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground truncate">{tile.link}</p>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-cocoa hover:bg-cocoa/5 shrink-0"
                          onClick={() => setEditingTileIndex(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                          onClick={() => handleRemove(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              {tiles.length === 0 && (
                <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-xl bg-sand/5">
                  No category tiles configured. Click "Add Tile" to start.
                </div>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
      
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
          {isPending ? "Saving..." : "Save Tiles"}
        </Button>
      </div>

      <Dialog open={editingTileIndex !== null} onOpenChange={(open) => !open && setEditingTileIndex(null)}>
        <DialogContent className="sm:max-w-[425px] rounded-[2rem] p-6 bg-[#fdfaf6] border-cocoa/10 shadow-cute">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-cocoa">Edit Tile</DialogTitle>
          </DialogHeader>
          
          {editingTileIndex !== null && tiles[editingTileIndex] && (
            <div className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-cocoa/70 ml-1">Tile Label</Label>
                <Input 
                  value={tiles[editingTileIndex].label} 
                  onChange={(e) => handleChange(editingTileIndex, "label", e.target.value)} 
                  className="h-11 text-sm rounded-2xl bg-card border-border shadow-sm px-4"
                  placeholder="e.g. Kurtas"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-bold text-cocoa/70 ml-1">Link Destination</Label>
                <CustomSelect 
                  value={tiles[editingTileIndex].link.replace('/shop?category=', '')}
                  onChange={(val) => handleChange(editingTileIndex, "link", `/shop?category=${val}`)}
                  options={[
                    { v: "", l: "Select Category..." },
                    ...(categories?.map(c => ({ v: c.slug, l: c.name })) || [])
                  ]}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-cocoa/70 ml-1">Tile Image</Label>
                <div className="flex items-center gap-4 p-3 border border-dashed border-cocoa/20 rounded-2xl bg-white">
                  <div className="w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-sand/30 border border-cocoa/10 flex items-center justify-center">
                    {tiles[editingTileIndex].image_url ? (
                      <img src={tiles[editingTileIndex].image_url} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud className="h-5 w-5 text-cocoa/40" />
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl h-10 border-cocoa/20 hover:bg-cocoa/5 text-cocoa"
                    onClick={handleUploadClick}
                  >
                    Choose Image
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
