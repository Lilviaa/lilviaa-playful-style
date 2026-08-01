import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductVariant } from "@/lib/admin/products-api";
import { Plus, Trash2 } from "lucide-react";
import { formatINR } from "@/lib/cart";

interface VariantEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
  basePrice: number;
}

export function VariantEditor({ variants, onChange, basePrice }: VariantEditorProps) {
  
  const addVariant = () => {
    onChange([
      ...variants,
      {
        id: `v_new_${Date.now()}`,
        product_id: "", // will be set on save
        size: "",
        sku: "",
        stock: 0,
        price_override: null,
        sales: 0,
      }
    ]);
  };

  const removeVariant = (index: number) => {
    const newVariants = [...variants];
    newVariants.splice(index, 1);
    onChange(newVariants);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-cocoa">Variants & Inventory</Label>
        <Button type="button" variant="outline" size="sm" onClick={addVariant}>
          <Plus className="mr-2 h-4 w-4" /> Add Variant
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead className="bg-sand/30 border-b border-border text-left">
            <tr>
              <th className="p-3 font-semibold text-cocoa">Size</th>
              <th className="p-3 font-semibold text-cocoa">SKU</th>
              <th className="p-3 font-semibold text-cocoa w-24">Stock</th>
              <th className="p-3 font-semibold text-cocoa w-32" title="Leave blank to use the Base Price">
                Variant Price <span className="text-xs font-normal text-muted-foreground ml-1">(opt)</span>
              </th>
              <th className="p-3 w-12"></th>
            </tr>
          </thead>
          <tbody>
            {variants.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-muted-foreground">
                  No variants added. Product needs at least one variant.
                </td>
              </tr>
            ) : (
              variants.map((v, i) => (
                <tr key={v.id} className="border-b border-border/50 last:border-0 hover:bg-sand/10">
                  <td className="p-2">
                    <Input 
                      placeholder="e.g. 6-12m, 1-2y" 
                      value={v.size} 
                      onChange={e => updateVariant(i, 'size', e.target.value)}
                      className="h-8"
                      required
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      placeholder="e.g. SKU-123" 
                      value={v.sku} 
                      onChange={e => updateVariant(i, 'sku', e.target.value)}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      min="0"
                      placeholder="e.g. 50"
                      value={v.stock} 
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        updateVariant(i, 'stock', val < 0 ? 0 : val);
                      }}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2">
                    <Input 
                      type="number"
                      placeholder={basePrice ? `e.g. ${basePrice}` : "e.g. 1999"}
                      value={v.price_override || ''} 
                      onChange={e => updateVariant(i, 'price_override', e.target.value ? parseInt(e.target.value) : null)}
                      className="h-8"
                    />
                  </td>
                  <td className="p-2 text-right">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                      onClick={() => removeVariant(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
