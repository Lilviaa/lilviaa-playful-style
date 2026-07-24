import { useState } from "react";
import { useProducts, useBulkUpdateProducts } from "@/lib/admin/products-api";
import { getCategories, createCategory, updateCategory, deleteCategory, useCategories } from "@/lib/categories-api";
import { useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderTree, Search, Trash2, Edit2, Check, X, ArrowRightLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { PlusCircle } from "lucide-react";
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

export function CategoryManager({ children }: { children: React.ReactNode }) {
  const { data: products } = useProducts();
  const bulkUpdate = useBulkUpdateProducts();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [bulkCategoryInput, setBulkCategoryInput] = useState("");

  // To allow creating categories without products in this session
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newStandaloneCategory, setNewStandaloneCategory] = useState("");

  const { data: dbCategories = [] } = useCategories();
  const dbCategoryNames = dbCategories.map(c => c.name);

  const uniqueCategories = Array.from(
    new Set([...dbCategoryNames, ...customCategories]),
  );

  const handleCreateCategory = async () => {
    const trimmed = newStandaloneCategory.trim();
    if (!trimmed) {
      setIsCreatingCategory(false);
      return;
    }
    if (!uniqueCategories.includes(trimmed)) {
      try {
        await createCategory({
          name: trimmed,
          slug: trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          sort_order: 0
        });
        queryClient.invalidateQueries({ queryKey: ["categories"] });
        toast.success(`Category "${trimmed}" created!`);
      } catch (err: any) {
        toast.error(err.message || "Failed to create category");
      }
    } else {
      toast.error("Category already exists.");
    }
    setNewStandaloneCategory("");
    setIsCreatingCategory(false);
  };

  const filteredProducts =
    products?.filter((p) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(searchLower) ||
        p.variants?.some((v) => v.sku.toLowerCase().includes(searchLower));

      const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    }) || [];

  const handleRenameCategory = async (oldName: string) => {
    if (!newCategoryName.trim() || newCategoryName === oldName) {
      setEditingCategory(null);
      return;
    }

    try {
      const categories = await getCategories();
      const targetCat = categories.find(c => c.name === oldName);
      
      if (targetCat) {
        await updateCategory(targetCat.id, {
          name: newCategoryName,
          slug: newCategoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        });
      }
      
      setCustomCategories(prev => prev.map(c => c === oldName ? newCategoryName : c));
      toast.success(`Renamed category to ${newCategoryName}`);
      setEditingCategory(null);
      if (selectedCategory === oldName) setSelectedCategory(newCategoryName);
      
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to rename category");
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    const productsInCat = products?.filter((p) => p.category === catName) || [];
    const ids = productsInCat.map((p) => p.id);

    setCustomCategories((prev) => prev.filter((c) => c !== catName));

    const removeCategoryFromDB = async () => {
      try {
        const categories = await getCategories();
        const targetCat = categories.find(c => c.name === catName);
        if (targetCat) {
          await deleteCategory(targetCat.id);
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
      } catch (e) {
        console.error("Failed to delete category from DB", e);
      }
    };

    if (ids.length > 0) {
      bulkUpdate.mutate(
        { ids, updates: { category: "", category_id: null } as any },
        {
          onSuccess: async () => {
            await removeCategoryFromDB();
            toast.success(`Deleted category ${catName}`);
            if (selectedCategory === catName) setSelectedCategory("all");
          },
        },
      );
    } else {
      await removeCategoryFromDB();
      toast.success(`Deleted category ${catName}`);
      if (selectedCategory === catName) setSelectedCategory("all");
    }
  };

  const handleMoveProduct = async (productId: string, newCategory: string) => {
    let catId: string | null = null;
    if (newCategory !== "uncategorized" && newCategory !== "") {
      try {
        const categories = await getCategories();
        let targetCat = categories.find(c => c.name === newCategory);
        if (!targetCat) {
          targetCat = await createCategory({
            name: newCategory,
            slug: newCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            sort_order: 0
          });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
        catId = targetCat.id;
      } catch (err) {
        toast.error("Failed to resolve category.");
        return;
      }
    }

    bulkUpdate.mutate(
      { ids: [productId], updates: { category: newCategory, category_id: catId } as any },
      {
        onSuccess: () => toast.success("Moved product to category"),
      },
    );
  };

  const handleBulkMove = async () => {
    if (selectedProducts.size === 0) return;
    if (!bulkCategoryInput.trim()) {
      toast.error("Please enter or select a category name");
      return;
    }

    const catName = bulkCategoryInput.trim();
    let catId: string | null = null;
    
    if (catName !== "uncategorized" && catName !== "") {
      try {
        const categories = await getCategories();
        let targetCat = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
        if (!targetCat) {
          targetCat = await createCategory({
            name: catName,
            slug: catName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            sort_order: 0
          });
          queryClient.invalidateQueries({ queryKey: ["categories"] });
        }
        catId = targetCat.id;
      } catch (err: any) {
        toast.error(err.message || "Failed to resolve category.");
        return;
      }
    }

    bulkUpdate.mutate(
      { ids: Array.from(selectedProducts), updates: { category: catName, category_id: catId } as any },
      {
        onSuccess: () => {
          toast.success(`Moved ${selectedProducts.size} products to ${catName}`);
          setSelectedProducts(new Set());
          setBulkCategoryInput("");
        },
      },
    );
  };

  const toggleProduct = (id: string) => {
    const newSet = new Set(selectedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedProducts(newSet);
  };

  const toggleAll = () => {
    if (selectedProducts.size === filteredProducts.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-sand border-l-cocoa/10">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-display text-2xl text-cocoa flex items-center gap-2">
            <FolderTree className="h-6 w-6 text-primary" /> Category Manager
          </SheetTitle>
          <SheetDescription>
            Rename categories, delete them, or move products between categories.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Categories List */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <h3 className="font-bold text-cocoa mb-3">All Categories</h3>
            {uniqueCategories.length > 0 ? (
              <div className="space-y-2">
                {uniqueCategories.map((cat) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    {editingCategory === cat ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="h-8"
                          autoFocus
                          onKeyDown={(e) => e.key === "Enter" && handleRenameCategory(cat)}
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleRenameCategory(cat)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground"
                          onClick={() => setEditingCategory(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-2 cursor-pointer flex-1"
                          onClick={() => setSelectedCategory(cat)}
                        >
                          <div className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-sm font-medium">
                            {cat}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            ({products?.filter((p) => p.category === cat).length} products)
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-cocoa"
                            onClick={() => {
                              setEditingCategory(cat);
                              setNewCategoryName(cat);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-rose-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-sand border-cocoa/10">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-cocoa font-display">
                                  Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action will delete the category <strong>"{cat}"</strong>. All
                                  products currently in this category will be uncategorized.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-cocoa/20">
                                  Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteCategory(cat)}
                                  className="bg-rose-600 hover:bg-rose-700 text-white"
                                >
                                  Yes, delete category
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories created yet.
              </p>
            )}

            <div className="mt-4 border-t border-border/50 pt-4">
              {isCreatingCategory ? (
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="New category name..."
                    value={newStandaloneCategory}
                    onChange={(e) => setNewStandaloneCategory(e.target.value)}
                    autoFocus
                    className="h-9 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateCategory()}
                  />
                  <Button
                    size="sm"
                    className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={handleCreateCategory}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9"
                    onClick={() => setIsCreatingCategory(false)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full text-primary border-primary/20 hover:bg-primary/5 border-dashed"
                  onClick={() => setIsCreatingCategory(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Category
                </Button>
              )}
            </div>
          </div>

          {/* Product Assigner */}
          <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <div className="flex flex-col gap-4 mb-4">
              <h3 className="font-bold text-cocoa">Move Products</h3>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by Name or SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-sand/30"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px] bg-sand/30">
                    <SelectValue placeholder="Filter..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {uniqueCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="uncategorized">Uncategorized</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bulk Actions Bar */}
              {selectedProducts.size > 0 && (
                <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg animate-in slide-in-from-top-2">
                  <span className="text-sm font-medium text-primary whitespace-nowrap">
                    {selectedProducts.size} selected
                  </span>
                  <div className="flex-1 flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="Type new category..."
                        value={bulkCategoryInput}
                        onChange={(e) => setBulkCategoryInput(e.target.value)}
                        className="bg-white h-9 text-sm"
                      />
                      <Select
                        value={
                          uniqueCategories.includes(bulkCategoryInput) ? bulkCategoryInput : ""
                        }
                        onValueChange={setBulkCategoryInput}
                      >
                        <SelectTrigger className="absolute right-0 top-0 bottom-0 w-[120px] h-9 border-0 border-l rounded-l-none bg-transparent">
                          <SelectValue placeholder="Or Pick..." />
                        </SelectTrigger>
                        <SelectContent>
                          {uniqueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" onClick={handleBulkMove} className="h-9">
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 px-3 py-2 border-b border-border/50 bg-muted/20 rounded-t-lg mb-2">
              <Checkbox
                checked={
                  selectedProducts.size > 0 && selectedProducts.size === filteredProducts.length
                }
                onCheckedChange={toggleAll}
              />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Select All
              </span>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-border gap-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedProducts.has(p.id)}
                        onCheckedChange={() => toggleProduct(p.id)}
                      />
                      <div className="h-10 w-10 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={p.images?.[0]?.url || p.images?.[0] || "https://placehold.co/100"}
                          alt={p.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-cocoa line-clamp-1">{p.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.category || "Uncategorized"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ArrowRightLeft className="h-3 w-3 text-muted-foreground hidden sm:block" />
                      <Select
                        value={p.category || "uncategorized"}
                        onValueChange={(val) =>
                          handleMoveProduct(p.id, val === "uncategorized" ? "" : val)
                        }
                      >
                        <SelectTrigger className="w-[130px] h-8 text-xs">
                          <SelectValue placeholder="Select..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem
                            value="uncategorized"
                            className="text-muted-foreground italic"
                          >
                            None
                          </SelectItem>
                          {uniqueCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-6">No products found.</p>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
