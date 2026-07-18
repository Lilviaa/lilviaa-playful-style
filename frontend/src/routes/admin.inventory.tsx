import { createFileRoute } from "@tanstack/react-router";
import { InventoryTable } from "@/components/admin/inventory/inventory-table";
import { useInventoryVariants } from "@/lib/admin/inventory-api";
import { z } from "zod";

const searchSchema = z.object({
  filter: z.string().optional(),
});

export const Route = createFileRoute("/admin/inventory")({
  component: InventoryPage,
  validateSearch: searchSchema,
});

function InventoryPage() {
  const { filter } = Route.useSearch();
  const { data: variants = [], isLoading } = useInventoryVariants();

  const isLowStockFilter = filter === "low-stock";

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Inventory</h1>
          <p className="text-muted-foreground mt-1">
            View current stock levels for all product variants.
          </p>
        </div>
      </div>

      <InventoryTable data={variants} isLoading={isLoading} filterLowStock={isLowStockFilter} />
    </div>
  );
}
