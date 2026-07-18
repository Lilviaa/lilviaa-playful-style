import { Badge } from "@/components/ui/badge";
import { ProductStatus } from "@/lib/admin/products-api";

export function StatusBadge({ status }: { status: ProductStatus }) {
  if (status === "published") {
    return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none font-medium">Published</Badge>;
  }
  if (status === "draft") {
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-200 border-none font-medium">Draft</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 border-none font-medium">Archived</Badge>;
}
