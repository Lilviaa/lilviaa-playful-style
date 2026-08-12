import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OrderTable } from "@/components/admin/orders/order-table";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { useOrders, OrderFilters as OrderFiltersType } from "@/lib/admin/orders-api";
import { useState, useEffect } from "react";

const searchSchema = z.object({
  status: z.string().optional(),
});

export const Route = createFileRoute("/admin/orders")({
  component: OrdersPage,
  validateSearch: searchSchema,
});

function OrdersPage() {
  const { status } = Route.useSearch();

  const [filters, setFilters] = useState<OrderFiltersType>({
    status: status || "all",
    paymentMethod: "all",
    search: "",
    source: "all",
  });

  // Sync URL search param with internal state if it changes
  useEffect(() => {
    if (status && status !== filters.status) {
      setFilters((prev) => ({ ...prev, status }));
    }
  }, [status]);

  const { data, isLoading } = useOrders(filters);
  const orders = data?.orders || [];

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa capitalize">Orders</h1>
          <p className="text-muted-foreground mt-1">
            Manage your customer orders, track shipments, and print packing slips.
          </p>
        </div>
      </div>

      <div className="space-y-4 print:hidden">
        <OrderFilters filters={filters} onChange={setFilters} />
        <OrderTable data={orders} isLoading={isLoading} />
      </div>
    </div>
  );
}
