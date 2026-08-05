import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  ArrowUpDown,
  Pencil,
  Copy,
  Trash2,
  Eye,
  Archive,
  ArchiveRestore,
  CheckSquare,
} from "lucide-react";
import {
  ProductWithDetails,
  useUpdateProductStatus,
  useDeleteProducts,
} from "@/lib/admin/products-api";
import { StatusBadge } from "./status-badge";
import { Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatINR } from "@/lib/cart";
import { cn } from "@/lib/utils";

interface ProductTableProps {
  data: ProductWithDetails[];
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  setRowSelection: (updater: any) => void;
}

export function ProductTable({
  data,
  isLoading,
  rowSelection,
  setRowSelection,
}: ProductTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithDetails | null>(null);
  const updateStatus = useUpdateProductStatus();
  const deleteProducts = useDeleteProducts();
  const navigate = useNavigate();

  const columns: ColumnDef<ProductWithDetails>[] = [
    {
      id: "select",
      header: ({ table }) => {
        const hasSelection = Object.keys(table.getState().rowSelection).length > 0;
        return (
          <div className="w-[30px] flex items-center justify-center relative">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
              className={cn(
                "border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-opacity absolute z-10",
                !hasSelection
                  ? "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  : "opacity-100",
              )}
            />
            {!hasSelection && (
              <span className="text-sm font-medium text-muted-foreground transition-opacity hidden md:block md:group-hover:opacity-0 absolute">
                #
              </span>
            )}
          </div>
        );
      },
      cell: ({ row, table }) => {
        const isSelected = row.getIsSelected();
        const hasSelection = Object.keys(table.getState().rowSelection).length > 0;

        return (
          <div className="w-[30px] flex items-center justify-center relative">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
              className={cn(
                "border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-opacity absolute z-10",
                !hasSelection && !isSelected
                  ? "opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  : "opacity-100",
              )}
            />
            {!hasSelection && !isSelected && (
              <span className="text-sm font-medium text-muted-foreground transition-opacity hidden md:block md:group-hover:opacity-0 absolute">
                {row.index + 1}
              </span>
            )}
          </div>
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent font-bold text-cocoa"
          >
            Product
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        const thumbnail = product.images.length > 0 ? product.images[0].url : "";
        return (
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-sand">
              {thumbnail ? (
                <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted">
                  <span className="text-xs text-muted-foreground">No img</span>
                </div>
              )}
            </div>
            <div>
              <span className="font-semibold text-cocoa">{product.name}</span>
              <div className="text-xs text-muted-foreground mt-0.5">
                {product.variants.length} variant{product.variants.length !== 1 && "s"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      meta: { className: "hidden md:table-cell" },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent font-bold text-cocoa"
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => <span className="text-sm text-cocoa">{row.getValue("category")}</span>,
    },
    {
      accessorKey: "base_price", // use base_price for sorting logic
      id: "price",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent font-bold text-cocoa"
          >
            Price
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const product = row.original;
        const isSaleActive =
          product.sale_price !== null &&
          (!product.sale_start || new Date() >= new Date(product.sale_start)) &&
          (!product.sale_end || new Date() <= new Date(product.sale_end));

        return (
          <div className="flex flex-col">
            {isSaleActive ? (
              <>
                <span className="text-sm font-bold text-cocoa">
                  {formatINR(product.sale_price!)}
                </span>
                <span className="text-xs text-muted-foreground line-through">
                  {formatINR(product.base_price)}
                </span>
              </>
            ) : (
              <span className="text-sm font-semibold text-cocoa">
                {formatINR(product.base_price)}
              </span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total_stock",
      meta: { className: "hidden md:table-cell" },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent font-bold text-cocoa"
          >
            Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        const stock = row.getValue("total_stock") as number;
        return (
          <span
            className={`text-sm font-semibold ${stock === 0 ? "text-rose-500" : stock < 10 ? "text-amber-500" : "text-cocoa"}`}
          >
            {stock}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      meta: { className: "hidden sm:table-cell" },
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="px-0 hover:bg-transparent font-bold text-cocoa"
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return <StatusBadge status={row.getValue("status")} />;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[160px]">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer"
                onClick={() => row.toggleSelected(!row.getIsSelected())}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                {row.getIsSelected() ? "Deselect" : "Select"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/admin/products/$productId" params={{ productId: product.id }} className="cursor-pointer">
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/products/$slug" params={{ slug: product.slug }} target="_blank" className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" /> View in store
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="cursor-pointer"
                onClick={() => {
                  const duplicate = {
                    ...product,
                    id: `new_${Date.now()}`,
                    name: `${product.name} (Copy)`,
                    slug: `${product.slug}-copy`,
                    images: [],
                    variants: product.variants.map((v: any) => ({ ...v, id: "", product_id: "" }))
                  };
                  sessionStorage.setItem("duplicate_product", JSON.stringify(duplicate));
                  navigate({ to: "/admin/products/new" });
                }}
              >
                <Copy className="mr-2 h-4 w-4" /> Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {product.status === "archived" ? (
                <DropdownMenuItem
                  className="cursor-pointer text-emerald-600 focus:text-emerald-600"
                  onClick={() => updateStatus.mutate({ id: product.id, status: "draft" })}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" /> Unarchive
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="cursor-pointer text-amber-600 focus:text-amber-600"
                  onClick={() => updateStatus.mutate({ id: product.id, status: "archived" })}
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="cursor-pointer text-rose-600 focus:text-rose-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-sand border-cocoa/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-cocoa font-display">
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete <strong>{product.name}</strong> from your
                      store. This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-cocoa/20">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteProducts.mutate([product.id])}
                      className="bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Yes, delete product
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  return (
    <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="hidden md:block">
        <Table>
          <TableHeader className="bg-sand/50 border-b border-cocoa/10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent border-0 group">
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id} className={cn("text-cocoa font-bold whitespace-nowrap", (header.column.columnDef.meta as any)?.className)}>
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
                {columns.map((col, j) => (
                  <TableCell key={`cell-${i}-${j}`} className={cn("py-4", (col.meta as any)?.className)}>
                    <Skeleton className="h-5 w-[80%] rounded-md" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => {
              const isDeletingRow = deleteProducts.isPending && deleteProducts.variables?.includes(row.original.id);
              
              return (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "border-b border-cocoa/5 hover:bg-primary/5 transition-colors duration-200 cursor-pointer group relative",
                  isDeletingRow && "opacity-60 pointer-events-none bg-muted/50"
                )}
                onClick={(e) => {
                  // Don't open quick view if they clicked the checkbox or the actions dropdown
                  if (
                    (e.target as HTMLElement).closest("button") ||
                    (e.target as HTMLElement).closest("a") ||
                    (e.target as HTMLElement).closest("[role='menuitem']") ||
                    (e.target as HTMLElement).closest("[role='dialog']") ||
                    (e.target as HTMLElement).closest(".peer")
                  ) {
                    return;
                  }

                  // If we are in "bulk selection mode", clicking anywhere on the row should just toggle selection
                  if (Object.keys(table.getState().rowSelection).length > 0) {
                    row.toggleSelected();
                    return;
                  }

                  setQuickViewProduct(row.original);
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id} className={cn("relative", (cell.column.columnDef.meta as any)?.className)}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
                {isDeletingRow && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </TableRow>
            )})
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No products found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      </div>

      {/* Mobile Card Layout */}
      <div className="flex flex-col md:hidden divide-y divide-cocoa/10">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`mob-skeleton-${i}`} className="flex gap-4 p-4">
              <Skeleton className="h-16 w-16 rounded-md shrink-0 bg-sand" />
              <div className="flex flex-col gap-2 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))
        ) : table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => {
            const product = row.original;
            const isDeletingRow = deleteProducts.isPending && deleteProducts.variables?.includes(product.id);
            const thumbnail = product.images.length > 0 ? product.images[0].url : "";
            
            return (
              <div
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                className={cn(
                  "flex flex-col gap-3 p-4 relative transition-colors duration-200 hover:bg-primary/5",
                  row.getIsSelected() ? "bg-muted" : "bg-white",
                  isDeletingRow && "opacity-60 pointer-events-none bg-muted/50"
                )}
                onClick={(e) => {
                  if (
                    (e.target as HTMLElement).closest("button") ||
                    (e.target as HTMLElement).closest("a") ||
                    (e.target as HTMLElement).closest("[role='menuitem']") ||
                    (e.target as HTMLElement).closest("[role='dialog']")
                  ) {
                    return;
                  }
                  if (Object.keys(table.getState().rowSelection).length > 0) {
                    row.toggleSelected();
                    return;
                  }
                  setQuickViewProduct(product);
                }}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div onClick={e => e.stopPropagation()} className="pt-0.5">
                      {flexRender(
                        row.getVisibleCells().find((c) => c.column.id === "select")?.column.columnDef.cell,
                        row.getVisibleCells().find((c) => c.column.id === "select")?.getContext()!
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md border border-border bg-sand">
                        {thumbnail ? (
                          <img src={thumbnail} alt={product.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-muted">
                            <span className="text-[10px] text-muted-foreground">No img</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-cocoa leading-tight truncate">{product.name}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{product.category || "Uncategorized"}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div onClick={e => e.stopPropagation()}>
                     {flexRender(
                        row.getVisibleCells().find((c) => c.column.id === "actions")?.column.columnDef.cell,
                        row.getVisibleCells().find((c) => c.column.id === "actions")?.getContext()!
                      )}
                  </div>
                </div>

                <div className="flex justify-between items-center mt-2 bg-sand/30 p-2.5 rounded-xl border border-cocoa/5 text-sm w-full">
                  <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Price</span>
                    <span className="font-bold text-cocoa">{formatINR(product.base_price)}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1 border-r border-cocoa/10">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Stock</span>
                    <span className="font-semibold text-cocoa">{product.total_stock}</span>
                  </div>
                  <div className="flex flex-col items-center flex-1">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Status</span>
                    <StatusBadge status={product.status as any} />
                  </div>
                </div>
                
                {isDeletingRow && (
                  <div className="absolute inset-0 flex items-center justify-center z-20">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            No products found.
          </div>
        )}
      </div>

      <Dialog open={!!quickViewProduct} onOpenChange={(open) => !open && setQuickViewProduct(null)}>
        <DialogContent className="sm:max-w-md bg-sand border-cocoa/10">
          {quickViewProduct && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-cocoa">
                  {quickViewProduct.name}
                </DialogTitle>
                <DialogDescription>
                  Category: {quickViewProduct.category || "Uncategorized"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-xl overflow-hidden bg-white border border-cocoa/10 shrink-0">
                    <img
                      src={
                        quickViewProduct.images?.[0]?.url ||
                        "https://placehold.co/200"
                      }
                      alt={quickViewProduct.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <p className="text-sm text-cocoa">
                      <span className="font-semibold">Price: </span>
                      {quickViewProduct.sale_price !== null ? (
                        <>
                          <span className="font-bold text-rose-600 mr-2">
                            {formatINR(quickViewProduct.sale_price)}
                          </span>
                          <span className="line-through text-muted-foreground">
                            {formatINR(quickViewProduct.base_price)}
                          </span>
                        </>
                      ) : (
                        <span className="font-bold text-cocoa">
                          {formatINR(quickViewProduct.base_price)}
                        </span>
                      )}
                    </p>
                    {(() => {
                      let text = quickViewProduct.fabric || "N/A";
                      if (quickViewProduct.fabric && quickViewProduct.fabric.startsWith("[")) {
                        try {
                          const parsed = JSON.parse(quickViewProduct.fabric);
                          if (Array.isArray(parsed)) {
                            text = parsed.map((d: any) => `${d.key}: ${d.value}`).join(", ") || "N/A";
                          }
                        } catch (e) {
                          // fallback to raw string
                        }
                      }
                      return (
                        <p className="text-sm text-cocoa">
                          <span className="font-semibold">Fabric: </span>{" "}
                          {text}
                        </p>
                      );
                    })()}
                    <p className="text-sm text-cocoa">
                      <span className="font-semibold">Status: </span>
                      <span className="capitalize">{quickViewProduct.status}</span>
                    </p>
                  </div>
                </div>

                {quickViewProduct.description && (
                  <div>
                    <p className="font-semibold text-cocoa text-sm mb-1">Description</p>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {quickViewProduct.description}
                    </p>
                  </div>
                )}

                {quickViewProduct.wash_care && (
                  <div>
                    <p className="font-semibold text-cocoa text-sm mb-1">Wash Care</p>
                    <p className="text-sm text-muted-foreground">{quickViewProduct.wash_care}</p>
                  </div>
                )}

                <div className="border-t border-cocoa/10 pt-4">
                  <p className="font-semibold text-cocoa text-sm mb-3">
                    Variants ({quickViewProduct.variants?.length || 0})
                  </p>
                  <div className="space-y-2">
                    {quickViewProduct.variants?.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white border border-cocoa/10 rounded-lg p-3 text-sm"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-cocoa">
                            {v.size}
                          </span>
                          <span className="text-xs text-muted-foreground mt-0.5">SKU: {v.sku}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="font-semibold text-cocoa">
                            {v.price_override !== null && v.price_override !== undefined
                              ? formatINR(v.price_override)
                              : quickViewProduct.sale_price !== null
                                ? formatINR(quickViewProduct.sale_price)
                                : formatINR(quickViewProduct.base_price)}
                          </span>
                          <span
                            className={cn(
                              "text-xs font-medium mt-0.5",
                              v.stock === 0
                                ? "text-rose-500"
                                : v.stock < 10
                                  ? "text-amber-500"
                                  : "text-green-600",
                            )}
                          >
                            {v.stock === 0 ? "Out of Stock" : `${v.stock} in stock`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
