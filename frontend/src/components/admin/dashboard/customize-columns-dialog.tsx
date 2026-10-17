import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ALL_REPORT_COLUMNS,
  DEFAULT_COLUMN_IDS,
  ColumnGroup
} from "@/lib/admin/order-report-export";
import { SlidersHorizontal, RotateCcw, CheckSquare, Sparkles } from "lucide-react";

interface CustomizeColumnsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedColumnIds: string[];
  onApply: (columnIds: string[]) => void;
}

const GROUP_METADATA: Record<
  ColumnGroup,
  { title: string; subtitle: string; badge: string; badgeClass: string }
> = {
  default: {
    title: "Default Order Details",
    subtitle: "Core invoice, customer, GST and payment fields (recommended)",
    badge: "Default (13)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200"
  },
  customer: {
    title: "Optional Customer Details",
    subtitle: "Detailed customer address, city, and postal code information",
    badge: "Customer",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200"
  },
  product: {
    title: "Optional Product & Item Details",
    subtitle: "SKU, sizing, individual item pricing, and item-level GST breakdowns",
    badge: "Product",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200"
  },
  order: {
    title: "Optional Order & Fulfillment Details",
    subtitle: "Order status, transaction ID, courier, tracking, and timestamps",
    badge: "Order / Shipping",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-200"
  }
};

export function CustomizeColumnsDialog({
  open,
  onOpenChange,
  selectedColumnIds,
  onApply
}: CustomizeColumnsDialogProps) {
  const [selected, setSelected] = useState<string[]>(selectedColumnIds);

  // Sync state when dialog opens
  useEffect(() => {
    if (open) {
      setSelected(selectedColumnIds);
    }
  }, [open, selectedColumnIds]);

  const toggleColumn = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelected(ALL_REPORT_COLUMNS.map((c) => c.id));
  };

  const handleResetDefault = () => {
    setSelected([...DEFAULT_COLUMN_IDS]);
  };

  const handleApply = () => {
    // If none selected, default to the standard 13 columns
    const finalSelection = selected.length > 0 ? selected : [...DEFAULT_COLUMN_IDS];
    onApply(finalSelection);
    onOpenChange(false);
  };

  const groups: ColumnGroup[] = ["default", "customer", "product", "order"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden bg-[#FCFBF9] border-border shadow-2xl">
        <DialogHeader className="p-5 pb-3 border-b border-border/70 bg-white">
          <div className="flex items-center justify-between gap-3 pr-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-[#5C3A21]/10 text-cocoa">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <DialogTitle className="text-cocoa font-display text-lg">
                Customize Export Columns
              </DialogTitle>
            </div>
            <Badge
              variant="outline"
              className="text-xs font-semibold px-2.5 py-0.5 border-[#5C3A21]/20 bg-[#5C3A21]/5 text-cocoa"
            >
              {selected.length} of {ALL_REPORT_COLUMNS.length} selected
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Choose exactly which fields to include in your exported report. These column settings apply to both <strong className="text-cocoa">CSV</strong> and <strong className="text-cocoa">PDF</strong> formats.
          </DialogDescription>

          {/* Quick Action Toolbar */}
          <div className="flex items-center gap-2 pt-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetDefault}
              className="h-7 text-xs px-2.5 gap-1.5 border-[#5C3A21]/20 text-cocoa hover:bg-[#5C3A21]/10"
            >
              <RotateCcw className="h-3 w-3" />
              Reset to Default (13)
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              className="h-7 text-xs px-2.5 gap-1.5 border-border hover:bg-muted"
            >
              <CheckSquare className="h-3 w-3" />
              Select All
            </Button>
          </div>
        </DialogHeader>

        {/* Scrollable Checkbox Groups */}
        <ScrollArea className="flex-1 p-5 overflow-y-auto max-h-[calc(90vh-190px)]">
          <div className="space-y-6">
            {groups.map((grpKey) => {
              const meta = GROUP_METADATA[grpKey];
              const cols = ALL_REPORT_COLUMNS.filter((c) => c.group === grpKey);

              return (
                <div key={grpKey} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-cocoa uppercase tracking-wider">
                          {meta.title}
                        </h4>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${meta.badgeClass}`}
                        >
                          {meta.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {meta.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-white/70 p-3 rounded-lg border border-border/60">
                    {cols.map((col) => {
                      const isChecked = selected.includes(col.id);
                      return (
                        <label
                          key={col.id}
                          className={`flex items-start gap-2.5 p-2 rounded-md transition-colors cursor-pointer select-none text-left ${
                            isChecked
                              ? "bg-[#5C3A21]/5 hover:bg-[#5C3A21]/10"
                              : "hover:bg-muted/60"
                          }`}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => toggleColumn(col.id)}
                            className="mt-0.5"
                          />
                          <div className="leading-tight">
                            <span
                              className={`text-xs block ${
                                isChecked ? "font-semibold text-cocoa" : "text-gray-700"
                              }`}
                            >
                              {col.label}
                            </span>
                            {col.defaultSelected && (
                              <span className="text-[10px] text-emerald-700 font-medium">
                                Default
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="p-4 border-t border-border/70 bg-white flex items-center justify-between sm:justify-between w-full">
          <p className="text-xs text-muted-foreground">
            {selected.length === 0 ? (
              <span className="text-amber-600 font-medium">
                No columns selected. Default 13 columns will be used.
              </span>
            ) : (
              <span>
                <strong className="text-cocoa font-semibold">{selected.length}</strong> columns will be exported
              </span>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleApply}
              className="text-xs bg-[#5C3A21] hover:bg-[#4A2E1A] text-white font-medium px-4 shadow-sm"
            >
              Apply Columns
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
