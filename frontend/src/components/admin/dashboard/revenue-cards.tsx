import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/cart";
import { DashboardStats } from "@/lib/admin/dashboard-api";
import { TrendingDown, TrendingUp, IndianRupee } from "lucide-react";

export function RevenueCards({ data }: { data: DashboardStats["revenue"] }) {
  const periods = [
    { key: "today", label: "Today's Revenue" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {periods.map(({ key, label }) => {
        const stat = data[key];
        const isUp = stat.percentageChange >= 0;

        return (
          <Card key={key} className="border-border shadow-cute transition-transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                {label}
              </CardTitle>
              <IndianRupee className="h-3 w-3 md:h-4 md:w-4 text-cocoa/40 shrink-0 ml-1" />
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-cocoa truncate">{formatINR(stat.current)}</div>
              <p className="mt-1 flex items-center text-[10px] md:text-xs">
                <span
                  className={`flex items-center font-bold ${
                    isUp ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="mr-0.5 md:mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-0.5 md:mr-1 h-3 w-3" />
                  )}
                  {Math.abs(stat.percentageChange)}%
                </span>
                <span className="ml-1 text-muted-foreground truncate hidden sm:inline">from prior {key === "today" ? "day" : key}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
