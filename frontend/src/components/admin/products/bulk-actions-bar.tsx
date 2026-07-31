import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBulkUpdateProducts, useDeleteProducts } from "@/lib/admin/products-api";
import { useCategories } from "@/lib/categories-api";
import { Archive, CheckCircle, Tag, Percent, X, Trash2, Loader2 } from "lucide-react";
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
  selectedProducts: any[];
  clearSelection: () => void;
}

export function BulkActionsBar({ selectedIds, selectedProducts, clearSelection }: BulkActionsBarProps) {
  const count = selectedIds.length;
  const bulkUpdate = useBulkUpdateProducts();
  const deleteProducts = useDeleteProducts();
  const { data: dbCategories = [] } = useCategories();

  const [isDiscountOpen, setIsDiscountOpen] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("");
  const [saleStart, setSaleStart] = useState(() => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [saleEnd, setSaleEnd] = useState("");

  const allPublished = count > 0 && selectedProducts.every(p => p.status === "published");
  const allDraft = count > 0 && selectedProducts.every(p => p.status === "draft");
  const allArchived = count > 0 && selectedProducts.every(p => p.status === "archived");

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
              {dbCategories.map((c: any) => (
                <DropdownMenuItem key={c.id} onClick={() => handleAction({ category_id: c.id })}>
                  {c.name}
                </DropdownMenuItem>
              ))}
              {dbCategories.length === 0 && (
                <DropdownMenuItem disabled>No categories</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>


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
              {!allPublished && (
                <DropdownMenuItem onClick={() => handleAction({ status: "published" })}>
                  Publish
                </DropdownMenuItem>
              )}
              {!allDraft && (
                <DropdownMenuItem onClick={() => handleAction({ status: "draft" })}>
                  Set to Draft
                </DropdownMenuItem>
              )}
              {!allArchived && (
                <DropdownMenuItem onClick={() => handleAction({ status: "archived" })}>
                  Archive
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

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
