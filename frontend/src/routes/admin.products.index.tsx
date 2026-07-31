import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useProducts } from "@/lib/admin/products-api";
import { useCategories } from "@/lib/categories-api";
import { ProductTable } from "@/components/admin/products/product-table";
import { BulkActionsBar } from "@/components/admin/products/bulk-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, FolderTree, Tag } from "lucide-react";
import { CategoryManager } from "@/components/admin/products/category-manager";
import { DiscountManager } from "@/components/admin/products/discount-manager";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";

export const Route = createFileRoute("/admin/products/")({
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { data: products, isLoading } = useProducts();
  const { data: dbCategories = [] } = useCategories();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  const filteredProducts =
    products?.filter((p, index) => {
      const searchLower = search.toLowerCase();
      const snoString = (index + 1).toString();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) || snoString.includes(searchLower);

      const matchesCategory =
        categoryFilter === "all" || p.category.toLowerCase() === categoryFilter.toLowerCase();
      
      const matchesStatus = 
        statusFilter === "all" 
          ? p.status !== "archived" 
          : p.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    }) || [];

  // Map tanstack table row indices to products for bulk actions
  const selectedProducts = Object.keys(rowSelection)
    .filter((idx) => rowSelection[idx])
    .map((idx) => filteredProducts[parseInt(idx)])
    .filter(Boolean);

  const selectedIds = selectedProducts.map(p => p.id);

  // Extract unique categories from products and db
  const uniqueCategories = Array.from(new Set([
    ...dbCategories.map(c => c.name),
    ...(products?.map((p) => p.category).filter(Boolean) || [])
  ]));

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Products</h1>
          <p className="text-muted-foreground mt-1">Manage your catalog, variants, and pricing.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4 sm:mt-0">
          <CategoryManager>
            <Button
              variant="outline"
              className="border-border text-cocoa bg-white shadow-sm hover:bg-muted/50"
            >
              <FolderTree className="mr-2 h-4 w-4 text-muted-foreground" /> Categories
            </Button>
          </CategoryManager>

          <DiscountManager>
            <Button
              variant="outline"
              className="border-border text-cocoa bg-white shadow-sm hover:bg-muted/50"
            >
              <Tag className="mr-2 h-4 w-4 text-muted-foreground" /> Discounts
            </Button>
          </DiscountManager>

          <Button
            asChild
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Link to="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-cocoa/10 shadow-sm">
        <div className="relative flex-1 w-full min-w-[250px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or S.No..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border rounded-xl h-10"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-cocoa">Filter:</span>
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map((cat) => (
                <SelectItem key={cat} value={cat.toLowerCase()}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl bg-card border-border">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProductTable
        data={filteredProducts}
        isLoading={isLoading}
        rowSelection={rowSelection}
        setRowSelection={setRowSelection}
      />

      <BulkActionsBar selectedIds={selectedIds} selectedProducts={selectedProducts} clearSelection={() => setRowSelection({})} />
    </div>
  );
}
