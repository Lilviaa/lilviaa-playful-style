import { useCustomerOrders } from "@/lib/admin/customers-api";
import { OrderTable } from "@/components/admin/orders/order-table";
import { PackageOpen } from "lucide-react";

interface CustomerOrderHistoryProps {
  customerEmail: string;
}

export function CustomerOrderHistory({ customerEmail }: CustomerOrderHistoryProps) {
  const { data: orders, isLoading } = useCustomerOrders(customerEmail);

  if (isLoading) {
    return <div className="text-sm text-muted-foreground p-4">Loading order history...</div>;
  }

  if (!orders?.length) {
    return (
      <div className="rounded-xl border border-dashed border-cocoa/20 p-12 text-center text-muted-foreground bg-sand/10">
        <PackageOpen className="mx-auto h-12 w-12 mb-3 opacity-20" />
        <p className="text-lg font-medium text-cocoa/50">No orders yet</p>
        <p className="text-sm mt-1">This customer hasn't placed any orders.</p>
      </div>
    );
  }

  return (
    <div className="-mx-6 sm:mx-0">
      {/* We reuse the exact OrderTable component, it handles its own drawer! */}
      <OrderTable data={orders} isLoading={isLoading} />
    </div>
  );
}
