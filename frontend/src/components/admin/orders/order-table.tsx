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
import { Order, useDeleteOrders } from "@/lib/admin/orders-api";
import { formatINR } from "@/lib/cart";
import { formatOrderId } from "@/lib/utils";
import { OrderStatusBadge } from "./order-status-badge";
import { OrderDetailDrawer } from "./order-detail-drawer";
import { PackingSlipPrint } from "./packing-slip-print";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface OrderTableProps {
  data: Order[];
  isLoading: boolean;
}

export function OrderTable({ data, isLoading }: OrderTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [rowSelection, setRowSelection] = useState({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const deleteOrders = useDeleteOrders();

  const handleRowClick = (order: Order, e?: React.MouseEvent) => {
    // Only open drawer if we didn't click on a checkbox or button
    if (e) {
      const target = e.target as HTMLElement;
      
      // If we clicked inside the first column (checkbox column), ignore the row click
      const td = target.closest('td');
      if (td && td.cellIndex === 0) {
        return;
      }

      if (target.closest('button') || target.closest('[role="checkbox"]') || target.closest('.checkbox-container')) {
        return;
      }
    }
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const promptDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    const selectedIds = Object.keys(rowSelection).map(index => data[parseInt(index)].id);
    if (!selectedIds.length) return;
    
    await deleteOrders.mutateAsync(selectedIds);
    setRowSelection({});
    setIsDeleteDialogOpen(false);
  };

  const columns: ColumnDef<Order>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="translate-y-[2px]"
        />
      ),
      cell: ({ row }) => (
        <div className="checkbox-container flex items-center justify-center w-full h-full cursor-default" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            className="translate-y-[2px]"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "id",
      header: "Order ID",
      cell: ({ row }) => (
        <div className="flex flex-col gap-1 items-start">
          <span className="font-medium text-cocoa">{formatOrderId(row.original.id)}</span>
          {row.original.order_source === 'offline' ? (
            <span className="text-[9px] font-bold uppercase bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded tracking-wider">Offline</span>
          ) : (
            <span className="text-[9px] font-bold uppercase bg-pink-100 text-pink-700 px-1.5 py-0.5 rounded tracking-wider">Online</span>
          )}
        </div>
      ),
    },
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium text-cocoa">{row.original.shipping_address?.fullName || "Customer"}</span>
          <span className="text-xs text-muted-foreground">
            {row.original.shipping_address?.phone || ""}
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
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedCount = Object.keys(rowSelection).length;

  return (
    <>
      {selectedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex justify-between items-center print:hidden animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-medium text-amber-800">
            {selectedCount} order{selectedCount !== 1 ? 's' : ''} selected
          </span>
          <button
            onClick={promptDelete}
            disabled={deleteOrders.isPending}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {deleteOrders.isPending ? "Deleting..." : "Delete Selected"}
          </button>
        </div>
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white rounded-3xl border-cocoa/10 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-cocoa">Delete {selectedCount} Order{selectedCount !== 1 ? 's' : ''}</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete {selectedCount} selected order{selectedCount !== 1 ? 's' : ''}? This action cannot be undone and will permanently remove these orders from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="rounded-full border-cocoa/20 hover:bg-cocoa/5 hover:text-cocoa">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                    onClick={(e) => handleRowClick(row.original, e)}
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
                  onClick={(e) => handleRowClick(order, e)}
                  className="flex flex-col gap-2 p-4 bg-white hover:bg-primary/5 transition-colors cursor-pointer relative"
                >
                  <div className="absolute top-4 right-4 z-10 checkbox-container" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={row.getIsSelected()}
                      onCheckedChange={(value) => row.toggleSelected(!!value)}
                    />
                  </div>
                  
                  <div className="flex justify-between items-start pr-8">
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
