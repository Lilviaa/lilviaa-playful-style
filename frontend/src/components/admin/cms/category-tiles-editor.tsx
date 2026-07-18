import { useState, useEffect } from "react";
import { useCategoryTiles, useUpdateCategoryTiles, CategoryTile } from "@/lib/admin/cms-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GripVertical, X, Plus } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { toast } from "sonner";

export function CategoryTilesEditor() {
  const { data: serverTiles, isLoading } = useCategoryTiles();
  const { mutate: updateTiles, isPending } = useUpdateCategoryTiles();

  const [tiles, setTiles] = useState<CategoryTile[]>([]);

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

  const handleSave = () => {
    updateTiles(tiles);
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
                      
                      <div className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-cocoa/10 bg-white">
                        {tile.image_url ? (
                          <img src={tile.image_url} alt={tile.label} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground bg-sand/30">No Img</div>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Label</Label>
                          <Input 
                            value={tile.label} 
                            onChange={(e) => handleChange(index, "label", e.target.value)} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Link</Label>
                          <Input 
                            value={tile.link} 
                            onChange={(e) => handleChange(index, "link", e.target.value)} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Image URL</Label>
                          <Input 
                            value={tile.image_url} 
                            onChange={(e) => handleChange(index, "image_url", e.target.value)} 
                            className="h-8 text-sm"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                        onClick={() => handleRemove(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
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
      
      <div className="pt-4 border-t border-cocoa/10 flex justify-end">
        <Button onClick={handleSave} disabled={isPending} className="bg-cocoa hover:bg-cocoa/90 text-white rounded-full px-8">
          {isPending ? "Saving..." : "Save Tiles"}
        </Button>
      </div>
    </div>
  );
}
