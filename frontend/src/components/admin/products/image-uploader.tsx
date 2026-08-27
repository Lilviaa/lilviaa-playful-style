import { useState, useRef } from "react";
import { ProductImage } from "@/lib/admin/products-api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GripVertical, X, UploadCloud, Image as ImageIcon, RotateCw } from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

interface ImageUploaderProps {
  images: ProductImage[];
  onChange: (images: ProductImage[]) => void;
}

export function ImageUploader({ images, onChange }: ImageUploaderProps) {
  
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update sort_order
    const updatedItems = items.map((item, index) => ({
      ...item,
      sort_order: index,
    }));
    
    onChange(updatedItems);
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    
    // Re-index
    onChange(newImages.map((img, i) => ({ ...img, sort_order: i })));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newImages = files.map((file, idx) => ({
        id: `img_local_${Date.now()}_${idx}`,
        product_id: "",
        url: URL.createObjectURL(file),
        sort_order: images.length + idx,
        file: file // Storing file object for future backend upload implementation
      }));
      
      onChange([...images, ...newImages]);
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const rotateImage = async (index: number) => {
    const imgData = images[index];
    
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imgData.url;
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Swap width and height for 90 degree rotation to prevent cropping or white bars
    canvas.width = img.height;
    canvas.height = img.width;

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((90 * Math.PI) / 180);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const rotatedFile = new File([blob], `rotated_${Date.now()}.webp`, { type: "image/webp" });
      const newImages = [...images];
      
      // We change the ID to a local one so the backend deletes the old image and uploads this new one.
      // This prevents image duplication on save.
      newImages[index] = {
        ...imgData,
        id: `img_local_${Date.now()}`, 
        url: URL.createObjectURL(rotatedFile),
        file: rotatedFile,
      };
      
      onChange(newImages);
    }, "image/webp", 1.0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-cocoa">Product Images</Label>
        <div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/webp" 
            multiple 
            onChange={handleFileChange} 
          />
          <Button type="button" variant="outline" size="sm" onClick={handleUploadClick}>
            <UploadCloud className="mr-2 h-4 w-4" /> Add Image
          </Button>
        </div>
      </div>

      {images.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center flex flex-col items-center justify-center bg-sand/30">
          <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-4" />
          <p className="text-sm font-medium text-cocoa">No images uploaded</p>
          <p className="text-xs text-muted-foreground mt-1">Upload multiple images for the product (.webp only, drag to reorder).</p>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="product-images" direction="horizontal">
            {(provided) => (
              <div 
                className="flex gap-4 overflow-x-auto pb-4" 
                {...provided.droppableProps} 
                ref={provided.innerRef}
              >
                {images.map((img, index) => (
                  <Draggable key={img.id} draggableId={img.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="relative group shrink-0 w-32 h-40 rounded-lg border border-border bg-card overflow-hidden shadow-sm"
                      >
                        <img 
                          src={img.url} 
                          alt="Product" 
                          className="w-full h-full object-cover" 
                        />
                        
                        {/* Drag Handle */}
                        <div 
                           {...provided.dragHandleProps}
                           className="absolute top-1 left-1 h-6 w-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-cocoa md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm cursor-grab active:cursor-grabbing z-10"
                        >
                          <GripVertical className="h-4 w-4" />
                        </div>
                        
                        {/* Rotate Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            rotateImage(index);
                          }}
                          className="absolute top-1 right-9 h-6 w-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-cocoa hover:bg-white hover:text-blue-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm z-10"
                          title="Rotate 90°"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 h-6 w-6 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-cocoa hover:bg-white hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm z-10"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        
                        {index === 0 && (
                          <div className="absolute bottom-0 left-0 right-0 bg-primary/90 text-primary-foreground text-[10px] font-bold text-center py-1 uppercase tracking-wider">
                            Primary
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
