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
      <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden">
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
