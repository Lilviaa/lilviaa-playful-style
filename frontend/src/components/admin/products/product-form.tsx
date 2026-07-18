import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { ProductWithDetails, ProductStatus, useSaveProduct } from "@/lib/admin/products-api";
import { VariantEditor } from "./variant-editor";
import { ImageUploader } from "./image-uploader";
import { DiscountFields } from "./discount-fields";
import { Save, ArrowLeft, Plus, X } from "lucide-react";
import { toast } from "sonner";

interface ProductFormProps {
  initialData?: ProductWithDetails;
}

export function ProductForm({ initialData }: ProductFormProps) {
  const navigate = useNavigate();
  const saveProduct = useSaveProduct();

  const predefinedCategories = ["Shirts", "Kurtas", "Rompers", "Dresses", "Sets", "Accessories"];
  const [isNewCategory, setIsNewCategory] = useState(false);

  const [formData, setFormData] = useState<Partial<ProductWithDetails>>({
    id: initialData?.id || `p_new_${Date.now()}`,
    name: initialData?.name || "",
    slug: initialData?.slug || "",
    description: initialData?.description || "",
    fabric: initialData?.fabric || "",
    wash_care: initialData?.wash_care || "",
    category: initialData?.category || "Shirts",
    base_price: initialData?.base_price || 0,
    sale_price: initialData?.sale_price || null,
    sale_start: initialData?.sale_start || null,
    sale_end: initialData?.sale_end || null,
    status: initialData?.status || "draft",
    variants: initialData?.variants || [],
    images: initialData?.images || [],
  });

  // Auto-generate slug from name if new
  useEffect(() => {
    if (!initialData && formData.name && !formData.slug) {
      setFormData((prev) => ({
        ...prev,
        slug: prev
          .name!.toLowerCase()
          .replace(/\\s+/g, "-")
          .replace(/[^a-z0-9-]/g, ""),
      }));
    }
  }, [formData.name, initialData]);

  const updateField = (field: keyof ProductWithDetails, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDiscountUpdate = (updates: any) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name) return toast.error("Product name is required");
    if (!formData.base_price || formData.base_price <= 0)
      return toast.error("Valid base price is required");
    if (formData.variants?.length === 0) return toast.error("At least one variant is required");

    // Make sure variants have product_id
    const variants = formData.variants!.map((v) => ({ ...v, product_id: formData.id! }));
    const images = formData.images!.map((i) => ({ ...i, product_id: formData.id! }));

    try {
      await saveProduct.mutateAsync({
        ...formData,
        variants,
        images,
      } as any);

      navigate({ to: "/admin/products" });
    } catch (err) {
      // toast is handled in mutation
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-24">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: "/admin/products" })}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-cocoa">
              {initialData ? "Edit Product" : "New Product"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Select
            value={formData.status}
            onValueChange={(val: ProductStatus) => updateField("status", val)}
          >
            <SelectTrigger className="w-[140px] bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Save className="mr-2 h-4 w-4" /> Save Product
          </Button>
        </div>
      </div>

      <ResizablePanelGroup
        direction="horizontal"
        className="h-[calc(100vh-12rem)] min-h-[600px] items-stretch"
      >
        {/* Main Column */}
        <ResizablePanel defaultSize={65} minSize={40}>
          <div className="space-y-8 pr-6 pb-8 h-full">
            {/* Basic Info */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-cocoa">Basic Information</h2>

              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g. Sunny Picnic Shirt"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug URL</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => updateField("slug", e.target.value)}
                    placeholder="e.g. sunny-picnic-shirt"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  {isNewCategory ? (
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="e.g. Winter Wear"
                        value={formData.category}
                        onChange={(e) => updateField("category", e.target.value)}
                        autoFocus
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsNewCategory(false);
                          updateField("category", predefinedCategories[0]);
                        }}
                        className="text-muted-foreground hover:text-rose-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Select
                      value={formData.category}
                      onValueChange={(val) => {
                        if (val === "NEW_CATEGORY") {
                          setIsNewCategory(true);
                          updateField("category", "");
                        } else {
                          updateField("category", val);
                        }
                      }}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {predefinedCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                        {formData.category &&
                          !predefinedCategories.includes(formData.category) &&
                          formData.category !== "NEW_CATEGORY" && (
                            <SelectItem value={formData.category}>{formData.category}</SelectItem>
                          )}
                        <div className="h-px bg-border my-2" />
                        <SelectItem
                          value="NEW_CATEGORY"
                          className="text-primary font-medium focus:bg-primary/10 focus:text-primary cursor-pointer"
                        >
                          <span className="flex items-center">
                            <Plus className="mr-2 h-4 w-4" /> Add New Category...
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  rows={4}
                  placeholder="e.g. A beautiful, lightweight cotton shirt perfect for sunny days..."
                />
              </div>
            </div>

            {/* Media */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <ImageUploader
                images={formData.images || []}
                onChange={(images) => updateField("images", images)}
              />
            </div>

            {/* Variants */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <VariantEditor
                variants={formData.variants || []}
                onChange={(variants) => updateField("variants", variants)}
                basePrice={formData.base_price || 0}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle
          withHandle
          className="bg-transparent relative z-10 hover:bg-border/50 transition-colors"
        />

        {/* Sidebar Column */}
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="space-y-8 pl-6 pb-8 h-full">
            {/* Pricing */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-cocoa">Pricing</h2>

              <div className="space-y-2">
                <Label htmlFor="base_price">Base Price (₹)</Label>
                <Input
                  id="base_price"
                  type="number"
                  value={formData.base_price || ""}
                  onChange={(e) => updateField("base_price", parseInt(e.target.value) || 0)}
                  placeholder="e.g. 1999"
                />
              </div>

              <DiscountFields
                basePrice={formData.base_price || 0}
                salePrice={formData.sale_price || null}
                saleStart={formData.sale_start || null}
                saleEnd={formData.sale_end || null}
                onChange={handleDiscountUpdate}
              />
            </div>

            {/* Details */}
            <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold text-cocoa">Product Details</h2>

              <div className="space-y-2">
                <Label htmlFor="fabric">Fabric</Label>
                <Input
                  id="fabric"
                  value={formData.fabric}
                  onChange={(e) => updateField("fabric", e.target.value)}
                  placeholder="e.g. 100% Cotton"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="wash_care">Wash Care</Label>
                <Textarea
                  id="wash_care"
                  value={formData.wash_care}
                  onChange={(e) => updateField("wash_care", e.target.value)}
                  rows={2}
                  placeholder="e.g. Machine wash cold"
                />
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </form>
  );
}
