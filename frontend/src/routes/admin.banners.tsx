import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAdminBanners, useCreateBanner, useUpdateBanner, useDeleteBanner, useReorderBanners, Banner } from "@/lib/admin/banners-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, GripVertical, Trash2, Edit, Save, X, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";

export const Route = createFileRoute("/admin/banners")({
  component: AdminBannersPage,
});

function AdminBannersPage() {
  const { data: banners = [], isLoading } = useAdminBanners();
  const createBanner = useCreateBanner();
  const updateBanner = useUpdateBanner();
  const deleteBanner = useDeleteBanner();
  const reorderBanners = useReorderBanners();

  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleUploadImage = async (file: File) => {
    // 1. Request presigned URL
    const reqRes = await apiFetch('/admin/products/upload/request-url', {
      method: 'POST',
      body: JSON.stringify({ filename: file.name, content_type: file.type })
    });
    if (!reqRes.ok) throw new Error("Failed to get upload URL");
    const { upload_url, public_url } = await reqRes.json();
    
    // 2. PUT to backend upload endpoint
    const uploadRes = await apiFetch(upload_url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type }
    });
    if (!uploadRes.ok) throw new Error("Failed to upload image");
    
    return public_url;
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("image") as File;
    if (!file || file.size === 0) return;

    try {
      const image_url = await handleUploadImage(file);
      createBanner.mutate({
        image_url,
        title: formData.get("title") as string,
        subtitle: formData.get("subtitle") as string,
        link_url: formData.get("link_url") as string,
        active: true,
        sort_order: banners.length,
      });
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index - 1];
    newBanners[index - 1] = temp;
    
    const updates = newBanners.map((b, i) => ({ id: b.id, sort_order: i }));
    reorderBanners.mutate(updates);
  };

  const handleMoveDown = (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index + 1];
    newBanners[index + 1] = temp;
    
    const updates = newBanners.map((b, i) => ({ id: b.id, sort_order: i }));
    reorderBanners.mutate(updates);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold text-cocoa">Manage Banners</h1>
        <Button onClick={() => setIsAdding(!isAdding)} className="gap-2">
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isAdding ? "Cancel" : "Add Banner"}
        </Button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
          <h2 className="font-medium text-lg">Add New Banner</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Image *</label>
              <Input name="image" type="file" accept="image/*" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input name="title" placeholder="e.g. Summer Collection" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Subtitle</label>
              <Input name="subtitle" placeholder="e.g. Up to 50% off" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Link URL</label>
              <Input name="link_url" placeholder="e.g. /category/summer" />
            </div>
          </div>
          <Button type="submit" disabled={createBanner.isPending}>
            {createBanner.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Banner"}
          </Button>
        </form>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center p-12 bg-card rounded-2xl border border-border text-muted-foreground">
          No banners found. Add one to show on the storefront!
        </div>
      ) : (
        <div className="grid gap-4">
          {banners.map((banner, index) => (
            <div key={banner.id} className="flex flex-col md:flex-row items-center gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="flex flex-col gap-1 px-2 text-muted-foreground">
                <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="hover:text-foreground disabled:opacity-30">▲</button>
                <button onClick={() => handleMoveDown(index)} disabled={index === banners.length - 1} className="hover:text-foreground disabled:opacity-30">▼</button>
              </div>
              
              <div className="relative w-full md:w-48 h-24 rounded-lg overflow-hidden bg-sand shrink-0">
                {banner.image_url ? (
                  <img src={banner.image_url} alt="banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="h-6 w-6" /></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{banner.title || "Untitled Banner"}</h3>
                <p className="text-sm text-muted-foreground truncate">{banner.subtitle || "No subtitle"}</p>
                <p className="text-xs text-muted-foreground truncate mt-1">Link: {banner.link_url || "None"}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => updateBanner.mutate({ id: banner.id, active: !banner.active })}
                  disabled={updateBanner.isPending}
                >
                  {banner.active ? "Active" : "Hidden"}
                </Button>
                <Button 
                  variant="destructive" 
                  size="icon" 
                  onClick={() => {
                    if (confirm("Delete this banner?")) deleteBanner.mutate(banner.id);
                  }}
                  disabled={deleteBanner.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}