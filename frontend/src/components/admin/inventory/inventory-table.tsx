import { useState, useMemo, useEffect } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { InventoryItem } from "@/lib/admin/inventory-api";
import { Button } from "@/components/ui/button";

interface InventoryTableProps {
  data: InventoryItem[];
  isLoading: boolean;
  filterLowStock?: boolean;
}

export function InventoryTable({ data, isLoading, filterLowStock }: InventoryTableProps) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "stock", desc: false }, // Default sort by lowest stock first
  ]);
  const [globalFilter, setGlobalFilter] = useState("");

  const filteredData = useMemo(() => {
    if (filterLowStock) {
      return data.filter((item) => (item.stock - item.reserved_stock) < 5);
    }
    return data;
  }, [data, filterLowStock]);

  const columns: ColumnDef<InventoryItem>[] = [
    {
      id: "product",
      header: "Product",
      accessorFn: (row) => row.product_name,
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg overflow-hidden bg-white border border-cocoa/10 shrink-0">
              <img
                src={item.product_image || "https://placehold.co/100"}
                alt={item.product_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-cocoa">{item.product_name}</span>
              <span className="text-xs text-muted-foreground">{item.product_category}</span>
            </div>
          </div>
        );
      },
    },
    {
      id: "variant",
      header: "Variant",
      enableGlobalFilter: false,
      accessorFn: (row) => row.size,
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="text-sm font-medium text-cocoa">{row.original.size}</span>
        </div>
      ),
    },
    {
      accessorKey: "sku",
      header: "SKU",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">{row.original.sku}</span>
      ),
    },
    {
      accessorKey: "stock",
      enableGlobalFilter: false,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-black/5 text-cocoa font-bold"
          >
            Total Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <span className="font-semibold text-cocoa">{row.original.stock}</span>,
    },
    {
      accessorKey: "reserved_stock",
      enableGlobalFilter: false,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-black/5 text-cocoa font-bold"
          >
            Reserved
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <span className="font-semibold text-muted-foreground">{row.original.reserved_stock}</span>,
    },
    {
      id: "available_stock",
      enableGlobalFilter: false,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-black/5 text-cocoa font-bold"
          >
            Available
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      accessorFn: (row) => row.stock - row.reserved_stock,
      cell: ({ row }) => {
        const available = row.original.stock - row.original.reserved_stock;
        return <span className="font-bold text-cocoa">{available}</span>;
      },
    },
    {
      accessorKey: "sales",
      enableGlobalFilter: false,
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="-ml-4 hover:bg-black/5 text-cocoa font-bold"
          >
            Sold
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <span className="font-semibold text-cocoa">{row.original.sales}</span>,
    },
    {
      id: "status",
      header: "Status",
      enableGlobalFilter: false,
      accessorFn: (row) => row.stock - row.reserved_stock,
      cell: ({ row }) => {
        const available = row.original.stock - row.original.reserved_stock;
        if (available <= 0) {
          return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800">
              Out of Stock
            </span>
          );
        }
        if (available < 5) {
          return (
            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">
              Low Stock
            </span>
          );
        }
        return (
          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">
            In Stock
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or SKUs..."
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 rounded-full border-cocoa/20 focus-visible:ring-primary h-10 bg-white"
          />
        </div>
        {filterLowStock && (
          <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
            Showing only Low / Out of Stock items
          </div>
        )}
      </div>

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
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-b border-cocoa/5 hover:bg-primary/5 transition-colors duration-200"
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
                  {isLoading ? "Loading inventory..." : "No items found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
