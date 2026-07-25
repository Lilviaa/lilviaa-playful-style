import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Product } from "@/lib/admin/products-api";
import { useState, useEffect } from "react";

interface DiscountFieldsProps {
  basePrice: number;
  salePrice: number | null;
  saleStart: string | null;
  saleEnd: string | null;
  onChange: (updates: Partial<Product>) => void;
}

function toLocalDatetimeString(isoString: string) {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DiscountFields({ basePrice, salePrice, saleStart, saleEnd, onChange }: DiscountFieldsProps) {
  const [isOnSale, setIsOnSale] = useState(salePrice !== null);

  useEffect(() => {
    // Sync state if a product is loaded from the outside that has a sale
    if (salePrice !== null && !isOnSale) {
      setIsOnSale(true);
    }
  }, [salePrice, isOnSale]);

  const setDuration = (days: number) => {
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + days);
    onChange({ 
      sale_start: start.toISOString(), 
      sale_end: end.toISOString() 
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="text-base font-semibold text-cocoa">On Sale</Label>
          <p className="text-sm text-muted-foreground">Apply a temporary discount to this product.</p>
        </div>
        <Switch 
          checked={isOnSale} 
          onCheckedChange={(checked) => {
            setIsOnSale(checked);
            if (checked) {
              onChange({ sale_price: Math.floor(basePrice * 0.9) }); // Default 10% off
            } else {
              onChange({ sale_price: null, sale_start: null, sale_end: null });
            }
          }} 
        />
      </div>

      {isOnSale && (
        <div className="space-y-4 pt-4 border-t border-border mt-4">
          <div className="space-y-2">
            <Label htmlFor="sale_price">Sale Price (₹)</Label>
            <Input 
              id="sale_price"
              type="number" 
              value={salePrice === null ? '' : salePrice}
              onChange={(e) => onChange({ sale_price: e.target.value ? parseInt(e.target.value) : 0 })}
              className={salePrice && salePrice >= basePrice ? "border-rose-500" : ""}
            />
            {salePrice && salePrice >= basePrice && (
              <p className="text-xs text-rose-500">Must be less than base price</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sale_start">Start Date</Label>
              <Input 
                id="sale_start"
                type="datetime-local" 
                value={saleStart ? toLocalDatetimeString(saleStart) : ''}
                onChange={(e) => onChange({ sale_start: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_end">End Date</Label>
              <Input 
                id="sale_end"
                type="datetime-local" 
                value={saleEnd ? toLocalDatetimeString(saleEnd) : ''}
                onChange={(e) => onChange({ sale_end: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
          </div>

          <div className="col-span-full pt-2">
            <Label className="text-xs text-muted-foreground mb-2 block">Quick Duration:</Label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setDuration(1)}>24 Hours</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDuration(7)}>1 Week</Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setDuration(30)}>1 Month</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
