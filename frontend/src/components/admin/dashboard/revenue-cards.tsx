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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {periods.map(({ key, label }) => {
        const stat = data[key];
        const isUp = stat.percentageChange >= 0;

        return (
          <Card key={key} className="border-border shadow-cute transition-transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <IndianRupee className="h-4 w-4 text-cocoa/40" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cocoa">{formatINR(stat.current)}</div>
              <p className="mt-1 flex items-center text-xs">
                <span
                  className={`flex items-center font-bold ${
                    isUp ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="mr-1 h-3 w-3" />
                  ) : (
                    <TrendingDown className="mr-1 h-3 w-3" />
                  )}
                  {Math.abs(stat.percentageChange)}%
                </span>
                <span className="ml-1 text-muted-foreground">from prior {key === "today" ? "day" : key}</span>
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
