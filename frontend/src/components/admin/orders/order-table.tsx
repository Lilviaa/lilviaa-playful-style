import { useState } from "react";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Order } from "@/lib/admin/orders-api";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { PackingSlipPrint } from "./packing-slip-print";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderTableProps {
  data: Order[];
  isLoading: boolean;
}

export function OrderTable({ data, isLoading }: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => <span className="font-medium text-cocoa">{formatOrderId(row.original.id)}</span>,
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-cocoa">{row.original.shipping_address.fullName}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.shipping_address.phone}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const count = row.original.items?.length || 0;
        return (
          <span className="text-muted-foreground">
            {count} {count === 1 ? "item" : "items"}
          </span>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-semibold text-cocoa">{formatINR(row.original.total)}</span>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payment",
      cell: ({ row }) => {
        const method = row.original.payment_method;
        const displayMethod = method === 'razorpay' ? 'RAZORPAY (PENDING)' : method;
        return (
          <span className={`uppercase text-xs font-medium ${method === 'razorpay' ? 'text-amber-600' : 'text-muted-foreground'}`}>
            {displayMethod}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <>
      <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="hidden md:block">
          <Table>
          <TableHeader className="bg-sand/50 border-b border-cocoa/10">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-0">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-cocoa font-bold">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((_, j) => (
                    <TableCell key={`cell-${i}-${j}`} className="py-4">
                      <Skeleton className="h-5 w-[80%] rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => handleRowClick(row.original)}
                  className="border-b border-cocoa/5 hover:bg-primary/5 transition-colors duration-200 cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>

        {/* Mobile Card Layout */}
        <div className="flex flex-col md:hidden divide-y divide-cocoa/10">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={`mob-skeleton-${i}`} className="p-4 flex flex-col gap-3">
                 <Skeleton className="h-5 w-1/3" />
                 <Skeleton className="h-4 w-1/2" />
                 <Skeleton className="h-12 w-full rounded-xl mt-2" />
              </div>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const order = row.original;
              return (
                <div 
                  key={row.id} 
                  onClick={() => handleRowClick(order)}
                  className="flex flex-col gap-2 p-4 bg-white hover:bg-primary/5 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-cocoa leading-tight">{formatOrderId(order.id)}</span>
                    <span className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="font-medium text-cocoa text-sm">{order.shipping_address.fullName}</span>
                    <span className="text-xs text-muted-foreground">{order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'}</span>
                  </div>

                  <div className="flex justify-between items-center mt-2 bg-sand/30 p-2.5 rounded-xl border border-cocoa/5 text-sm w-full">
                    <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Total</span>
                      <span className="font-bold text-cocoa">{formatINR(order.total)}</span>
                    </div>
                    <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Payment</span>
                      <span className={`text-[9px] font-semibold text-center ${order.payment_method === 'razorpay' ? 'text-amber-600' : 'text-muted-foreground uppercase'}`}>
                        {order.payment_method === 'razorpay' ? 'RAZORPAY (PENDING)' : order.payment_method}
                      </span>
                    </div>
                    <div className="flex flex-col items-center flex-1">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Status</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No orders found.
            </div>
          )}
        </div>
      </div>

      <OrderDetailDrawer
        order={selectedOrder}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onPrint={handlePrint}
      />

      {/* Hidden print slip */}
      <PackingSlipPrint order={selectedOrder} />
    </>
  );
}
