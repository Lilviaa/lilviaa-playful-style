import { useState } from "react";
import { useProducts, useBulkUpdateProducts } from "@/lib/admin/products-api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tag, Search, Check, X, Percent, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";

export function DiscountManager({ children }: { children: React.ReactNode }) {
  const { data: products } = useProducts();
  const bulkUpdate = useBulkUpdateProducts();

  const [search, setSearch] = useState("");
  const [showOnlyDiscounts, setShowOnlyDiscounts] = useState(false);
  const [editingPrice, setEditingPrice] = useState<{ id: string; price: string } | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkDiscountPrice, setBulkDiscountPrice] = useState("");

  const [discountType, setDiscountType] = useState<"percentage" | "flat">("percentage");

  const filteredProducts =
    products?.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(searchLower));

      const matchesFilter = showOnlyDiscounts ? p.sale_price !== null : true;

      return matchesSearch && matchesFilter;
    }) || [];

  const handleApplyDiscount = (productId: string, basePrice: number) => {
    if (!editingPrice || editingPrice.id !== productId) return;

    const newPrice = parseFloat(editingPrice.price);
    if (isNaN(newPrice) || newPrice < 0 || newPrice >= basePrice) {
      toast.error("Invalid sale price. Must be lower than base price.");
      return;
    }

    bulkUpdate.mutate(
      { ids: [productId], updates: { sale_price: newPrice } },
      {
        onSuccess: () => {
          toast.success(`Sale price applied`);
          setEditingPrice(null);
        },
      },
    );
  };

  const handleRemoveDiscount = (productId: string) => {
    bulkUpdate.mutate(
      { ids: [productId], updates: { clear_discount: true } },
      {
        onSuccess: () => {
          toast.success(`Discount removed`);
        },
      },
    );
  };

  const handleBulkApply = () => {
    if (selectedProducts.size === 0) return;

    const value = parseFloat(bulkDiscountPrice);
    if (isNaN(value) || value <= 0) {
      toast.error("Please enter a valid discount value.");
      return;
    }

    const itemsToUpdate: any[] = [];
    let hasError = false;

    for (const id of Array.from(selectedProducts)) {
      const product = products?.find(p => p.id === id);
      if (!product) continue;

      let newSalePrice = 0;
      if (discountType === "percentage") {
        if (value >= 100) {
          toast.error("Percentage discount cannot be 100% or more.");
          hasError = true;
          break;
        }
        newSalePrice = Math.round(product.base_price * (1 - (value / 100)));
      } else {
        if (value >= product.base_price) {
          toast.error(`Flat discount of ₹${value} is greater than base price of ${product.name} (₹${product.base_price}).`);
          hasError = true;
          break;
        }
        newSalePrice = product.base_price - value;
      }

      itemsToUpdate.push({
        id,
        updates: { sale_price: newSalePrice }
      });
    }

    if (hasError) return;

    bulkUpdate.mutate(
      { items: itemsToUpdate },
      {
        onSuccess: () => {
          toast.success(`Applied discount to ${selectedProducts.size} products`);
          setSelectedProducts(new Set());
          setBulkDiscountPrice("");
        },
      },
    );
  };

  const handleBulkRemove = () => {
    if (selectedProducts.size === 0) return;

    bulkUpdate.mutate(
      { ids: Array.from(selectedProducts), updates: { clear_discount: true } },
      {
        onSuccess: () => {
          toast.success(`Removed discount from ${selectedProducts.size} products`);
          setSelectedProducts(new Set());
        },
      },
    );
  };

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-sand border-l-cocoa/10">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl text-cocoa flex items-center gap-2">
            <Tag className="h-6 w-6 text-rose-500" /> Discount Manager
          </SheetTitle>
          <SheetDescription>
            Quickly apply, edit, or remove sale prices across your entire catalog.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm space-y-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by Name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-sand/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm font-medium text-cocoa">Show only products on sale</span>
              <Switch checked={showOnlyDiscounts} onCheckedChange={setShowOnlyDiscounts} />
            </div>

            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-rose-50 border border-rose-200 rounded-lg animate-in slide-in-from-top-2 mt-4">
                <span className="text-sm font-medium text-rose-700 whitespace-nowrap">
                  {selectedProducts.size} selected
                </span>
                <div className="flex flex-1 sm:justify-end gap-2">
                  <div className="flex bg-white rounded-md border border-rose-200 p-0.5 shadow-sm mr-1">
                    <button 
                      onClick={() => setDiscountType("percentage")}
                      className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${discountType === 'percentage' ? 'bg-rose-100 text-rose-700' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      % OFF
                    </button>
                    <button 
                      onClick={() => setDiscountType("flat")}
                      className={`px-3 py-1 text-xs font-bold rounded-sm transition-colors ${discountType === 'flat' ? 'bg-rose-100 text-rose-700' : 'text-muted-foreground hover:bg-muted'}`}
                    >
                      ₹ OFF
                    </button>
                  </div>
                  <div className="relative flex-1 sm:max-w-[120px]">
                    <Input
                      type="number"
                      min={0}
                      placeholder="Amount..."
                      value={bulkDiscountPrice}
                      onChange={(e) => setBulkDiscountPrice(e.target.value)}
                      className="bg-white h-9 text-sm border-rose-200 text-center"
                    />
                  </div>
                  <Button
                    size="sm"
                    onClick={handleBulkApply}
                    className="h-9 bg-rose-600 hover:bg-rose-700 text-white shrink-0"
                  >
                    Apply
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkRemove}
                    className="h-9 border-rose-200 text-rose-700 hover:bg-rose-100 shrink-0"
                  >
                    Remove Sale
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-muted/20 rounded-t-lg mb-2">
            <Checkbox
              checked={
                selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length
              }
              onCheckedChange={toggleAll}
            />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Select All
            </span>
          </div>

          {/* Product List */}
          <div className="space-y-3 pb-8">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className={`flex flex-col p-4 rounded-xl border ${p.sale_price !== null ? "border-rose-200 bg-rose-50/30" : "border-border bg-card"} shadow-sm gap-3 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    <div className="pt-2">
                      <Checkbox
                        checked={selectedProducts.has(p.id)}
                        onCheckedChange={() => toggleProduct(p.id)}
                      />
                    </div>
                    <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0 border border-border">
                      <img
                        src={p.images?.[0]?.url || p.images?.[0] || "https://placehold.co/100"}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-cocoa">{p.name}</p>
                          <p
                            className={`text-xs mt-0.5 ${p.sale_price !== null ? "line-through text-muted-foreground" : "text-cocoa font-medium"}`}
                          >
                            Base: ₹{p.base_price}
                          </p>
                        </div>
                        {p.sale_price !== null && (
                          <div className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                            ₹{p.base_price - p.sale_price} OFF ({Math.round(((p.base_price - p.sale_price) / p.base_price) * 100)}%)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Discount Editing Area */}
                  <div className="pl-[60px] flex items-center justify-between">
                    {editingPrice?.id === p.id ? (
                      <div className="flex items-center gap-2 w-full">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                            ₹
                          </span>
                          <Input
                            type="number"
                            min={0}
                            autoFocus
                            value={editingPrice.price}
                            onChange={(e) => setEditingPrice({ id: p.id, price: e.target.value })}
                            className="pl-7 h-9 border-rose-200 focus-visible:ring-rose-500"
                            placeholder="Sale price"
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleApplyDiscount(p.id, p.base_price)
                            }
                          />
                        </div>
                        <Button
                          size="icon"
                          className="h-9 w-9 bg-rose-600 hover:bg-rose-700 shrink-0"
                          onClick={() => handleApplyDiscount(p.id, p.base_price)}
                        >
                          <Check className="h-4 w-4 text-white" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 shrink-0 text-muted-foreground"
                          onClick={() => setEditingPrice(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        {p.sale_price !== null ? (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-rose-600">
                                Sale: ₹{p.sale_price}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-muted-foreground underline underline-offset-2 px-2"
                                onClick={() =>
                                  setEditingPrice({ id: p.id, price: p.sale_price!.toString() })
                                }
                              >
                                Edit
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              onClick={() => handleRemoveDiscount(p.id)}
                            >
                              Remove Sale
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm text-muted-foreground italic">
                              No active sale
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs border-dashed"
                              onClick={() => setEditingPrice({ id: p.id, price: "" })}
                            >
                              <Percent className="mr-1 h-3 w-3" /> Add Discount
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-base font-medium text-cocoa">No products found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Try adjusting your search filters.
                </p>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
