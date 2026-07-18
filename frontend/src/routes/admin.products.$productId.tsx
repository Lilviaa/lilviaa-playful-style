import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/products/product-form";
import { useProduct } from "@/lib/admin/products-api";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/products/$productId")({
  component: EditProductPage,
});

function EditProductPage() {
  const { productId } = Route.useParams();
  const { data: product, isLoading, error } = useProduct(productId);

  if (isLoading) {
    return (
      <div className="space-y-8 pb-24">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-48" />
          <div className="flex gap-4">
            <Skeleton className="h-10 w-[140px]" />
            <Skeleton className="h-10 w-[140px]" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
          <div className="space-y-8">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[200px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Product not found or could not be loaded.
      </div>
    );
  }

  return <ProductForm initialData={product} />;
}
