import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBulkUpdateProducts, useDeleteProducts } from "@/lib/admin/products-api";
import { Archive, CheckCircle, Tag, Percent, X, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BulkActionsBarProps {
  selectedIds: string[];
  clearSelection: () => void;
}

export function BulkActionsBar({ selectedIds, clearSelection }: BulkActionsBarProps) {
  const count = selectedIds.length;
  const bulkUpdate = useBulkUpdateProducts();
  const deleteProducts = useDeleteProducts();

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [saleStart, setSaleStart] = useState("");
  const [saleEnd, setSaleEnd] = useState("");

  if (count === 0) return null;

  const handleAction = async (updates: any) => {
    await bulkUpdate.mutateAsync({ ids: selectedIds, updates });
    clearSelection();
  };

  const handleApplyDiscount = async () => {
    if (!discountPercent) return;
    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      updates: {
        discount_percentage: Number(discountPercent),
        sale_start: saleStart ? new Date(saleStart).toISOString() : new Date().toISOString(),
        sale_end: saleEnd
          ? new Date(saleEnd).toISOString()
          : new Date(Date.now() + 86400000 * 30).toISOString(), // default 30 days
      },
    });
    setIsDiscountOpen(false);
    setDiscountPercent("");
    clearSelection();
  };

  const handleClearDiscount = async () => {
    await bulkUpdate.mutateAsync({
      ids: selectedIds,
      updates: { clear_discount: true },
    });
    setIsDiscountOpen(false);
    clearSelection();
  };

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-4 rounded-full border border-white/60 bg-white/70 backdrop-blur-xl px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="flex items-center gap-2 border-r border-border pr-4">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {count}
          </span>
          <span className="text-sm font-semibold text-cocoa">selected</span>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 hover:bg-black/5 font-medium text-cocoa"
              >
                <Tag className="mr-2 h-4 w-4 text-muted-foreground" /> Category
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Move to...</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction({ category: "Shirts" })}>
                Shirts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction({ category: "Kurtas" })}>
                Kurtas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction({ category: "Rompers" })}>
                Rompers
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Dialog open={isDiscountOpen} onOpenChange={setIsDiscountOpen}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 hover:bg-black/5 font-medium text-cocoa"
              >
                <Percent className="mr-2 h-4 w-4 text-muted-foreground" /> Discount
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
              <div className="bg-gradient-to-br from-primary/20 via-transparent to-transparent p-6 pb-2">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-cocoa flex items-center gap-2">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Percent className="h-5 w-5 text-primary" />
                    </div>
                    Bulk Discount
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="grid gap-6 p-6 pt-2 bg-white">
                <div className="grid gap-2">
                  <Label htmlFor="discount" className="text-cocoa font-medium">
                    Discount Percentage (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="discount"
                      type="number"
                      min="1"
                      max="99"
                      placeholder="e.g. 20"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(e.target.value)}
                      className="rounded-xl h-12 pl-4 text-lg border-cocoa/20 focus-visible:ring-primary shadow-sm"
                    />
                    <Percent className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground opacity-50" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-cocoa font-medium text-sm">Sale Starts</Label>
                    <Input
                      type="datetime-local"
                      value={saleStart}
                      onChange={(e) => setSaleStart(e.target.value)}
                      className="rounded-xl border-cocoa/20 focus-visible:ring-primary shadow-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-cocoa font-medium text-sm">Sale Ends</Label>
                    <Input
                      type="datetime-local"
                      value={saleEnd}
                      onChange={(e) => setSaleEnd(e.target.value)}
                      className="rounded-xl border-cocoa/20 focus-visible:ring-primary shadow-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 pt-0 bg-white">
                <Button
                  variant="ghost"
                  onClick={handleClearDiscount}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl px-4"
                >
                  <X className="mr-2 h-4 w-4" /> Remove all
                </Button>
                <Button
                  onClick={handleApplyDiscount}
                  disabled={!discountPercent}
                  className="rounded-xl px-8 shadow-md"
                >
                  Apply Discount
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 hover:bg-black/5 font-medium text-cocoa"
              >
                <CheckCircle className="mr-2 h-4 w-4 text-muted-foreground" /> Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuLabel>Change status...</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAction({ status: "published" })}>
                Publish
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAction({ status: "draft" })}>
                Set to Draft
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-full px-4 text-amber-600 hover:bg-amber-50 hover:text-amber-700 font-medium"
            onClick={() => handleAction({ status: "archived" })}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 rounded-full px-4 text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-medium"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-sand border-cocoa/10">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-cocoa font-display">
                  Are you absolutely sure?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This action will permanently delete <strong>{count}</strong> selected product(s)
                  from your store. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-cocoa/20">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={async () => {
                    await deleteProducts.mutateAsync(selectedIds);
                    clearSelection();
                  }}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Yes, delete products
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="border-l border-border pl-4">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 rounded-full px-4 font-semibold"
            onClick={clearSelection}
          >
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
