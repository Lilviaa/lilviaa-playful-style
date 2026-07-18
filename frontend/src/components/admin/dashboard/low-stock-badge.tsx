import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight } from "lucide-react";

export function LowStockBadge({ count }: { count: number }) {
  return (
    <Link
      to={"/admin/inventory" as any}
      search={{ filter: "low-stock" }}
      className="group relative overflow-hidden flex flex-col justify-between rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-cute transition-all hover:-translate-y-1 hover:border-rose-300 hover:shadow-pop h-full"
    >
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-rose-100/50 transition-transform group-hover:scale-110" />
      
      <div className="relative z-10 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <p className="text-xs font-bold text-rose-600 uppercase tracking-wider">Inventory Alert</p>
          </div>
          <p className="text-3xl font-bold text-cocoa">{count}</p>
          <p className="mt-1 text-sm font-medium text-cocoa/70">Variants running out of stock</p>
        </div>
      </div>
      
      <div className="relative z-10 mt-6 flex items-center text-sm font-bold text-rose-600">
        Restock items <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  );
}
