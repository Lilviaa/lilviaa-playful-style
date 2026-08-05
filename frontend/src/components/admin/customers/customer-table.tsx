import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Customer } from "@/lib/admin/customers-api";
import { formatINR } from "@/lib/cart";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "@tanstack/react-router";

interface CustomerTableProps {
  data: Customer[];
  isLoading: boolean;
}

export function CustomerTable({ data, isLoading }: CustomerTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (customer: Customer) => {
    navigate({
      to: "/admin/customers/$customerId",
      params: { customerId: customer.id },
    });
  };

  const columns: ColumnDef<Customer>[] = [
    {
      id: "customer",
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium text-cocoa">{row.original.name}</span>
            {row.original.is_guest && (
              <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-slate-50">
                Guest
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{row.original.email}</span>
        </div>
      ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.phone || "—"}</span>,
    },
    {
      accessorKey: "total_orders",
      header: "Orders",
      cell: ({ row }) => <span className="font-medium">{row.original.total_orders || 0}</span>,
    },
    {
      accessorKey: "total_spend",
      header: "Total Spend",
      cell: ({ row }) => (
        <span className="font-semibold text-emerald-700">
          {formatINR(row.original.total_spend || 0)}
        </span>
      ),
    },
    {
      accessorKey: "last_order_date",
      header: "Last Order",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.last_order_date 
            ? new Date(row.original.last_order_date).toLocaleDateString()
            : '—'}
        </span>
      ),
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.created_at).toLocaleDateString()}
        </span>
      ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
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
          {table.getRowModel().rows?.length ? (
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
                {isLoading ? "Loading customers..." : "No customers found."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex flex-col md:hidden divide-y divide-cocoa/10">
        {isLoading && !table.getRowModel().rows?.length ? (
          <div className="p-8 text-center text-muted-foreground">Loading customers...</div>
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const customer = row.original;
            return (
              <div 
                key={row.id} 
                onClick={() => handleRowClick(customer)}
                className="flex flex-col gap-2 p-4 bg-white hover:bg-primary/5 transition-colors cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-cocoa leading-tight">{customer.name}</span>
                      {customer.is_guest && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 bg-slate-50">
                          Guest
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground mt-0.5">{customer.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{customer.phone || "—"}</span>
                </div>
                
                <div className="flex justify-between items-center mt-2 bg-sand/30 p-2.5 rounded-xl border border-cocoa/5 text-sm w-full">
                  <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Orders</span>
                    <span className="font-bold text-cocoa">{customer.total_orders || 0}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Spend</span>
                    <span className="font-semibold text-emerald-700">{formatINR(customer.total_spend || 0)}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Joined</span>
                    <span className="font-medium text-cocoa text-[11px]">{new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No customers found.
          </div>
        )}
      </div>
    </div>
  );
}
