import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/cart";
import { DashboardStats, useDashboardMetrics, DashboardMetrics } from "@/lib/admin/dashboard-api";
import { TrendingDown, TrendingUp, IndianRupee, LayoutDashboard, BarChart2 } from "lucide-react";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { AnimatedText } from "@/components/ui/animated-text";
import { Button } from "@/components/ui/button";

export function RevenueCards({ data }: { data: DashboardStats["revenue"] }) {
  const [mode, setMode] = useState<"overview" | "metrics">("overview");
  
  // Custom date range can be managed in parent or here. For demonstration of metrics, we use last 30 days
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const startDateStr = start.toISOString();
  const endDateStr = end.toISOString();
  
  const { data: metricsData, isFetching } = useDashboardMetrics(startDateStr, endDateStr, mode === "metrics");
  
  const cacheRef = useRef<Record<string, DashboardMetrics>>({});
  const cacheKey = `${startDateStr}_${endDateStr}`;
  
  if (metricsData && !isFetching) {
    cacheRef.current[cacheKey] = metricsData;
  }
  
  const currentMetrics = metricsData || cacheRef.current[cacheKey] || {
    totalRevenue: 0,
    avgDailyRevenue: 0,
    totalOrders: 0,
    avgOrderValue: 0
  };

  const overviewPeriods = [
    { key: "today", label: "Today's Revenue" },
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "year", label: "This Year" },
  ] as const;

  const metricsPeriods = [
    { key: "totalRevenue", label: "Last 30 Days Revenue", isCurrency: true },
    { key: "avgDailyRevenue", label: "Avg Daily Revenue", isCurrency: true },
    { key: "totalOrders", label: "Total Orders", isCurrency: false },
    { key: "avgOrderValue", label: "Avg Order Value", isCurrency: true },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <div className="bg-sand/30 p-1 rounded-lg inline-flex" data-html2canvas-ignore="true">
          <Button
            variant={mode === "overview" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("overview")}
            className="h-8 text-xs font-medium"
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={mode === "metrics" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setMode("metrics")}
            className="h-8 text-xs font-medium"
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Metrics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {mode === "overview" ? (
          overviewPeriods.map(({ key, label }) => {
            const stat = data[key];
            const isUp = stat.percentageChange >= 0;

            return (
              <Card key={key} className="border-border shadow-cute transition-transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                    <AnimatedText text={label} />
                  </CardTitle>
                  <IndianRupee className="h-3 w-3 md:h-4 md:w-4 text-cocoa/40 shrink-0 ml-1" />
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold text-cocoa truncate">
                    <AnimatedNumber value={stat.current} formatValue={(v) => formatINR(v)} />
                  </div>
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
                      <AnimatedNumber value={Math.abs(stat.percentageChange)} formatValue={(v) => `${v}%`} />
                    </span>
                    <span className="ml-1 text-muted-foreground truncate hidden sm:inline">from prior {key === "today" ? "day" : key}</span>
                  </p>
                </CardContent>
              </Card>
            );
          })
        ) : (
          metricsPeriods.map(({ key, label, isCurrency }) => {
            const val = currentMetrics[key as keyof DashboardMetrics];
            return (
              <Card key={key} className="border-border shadow-cute transition-transform hover:-translate-y-1 relative overflow-hidden">
                <div className={`absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 transition-opacity duration-300 ${isFetching ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3 md:p-6 md:pb-2">
                  <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate">
                    <AnimatedText text={label} />
                  </CardTitle>
                  {isCurrency && <IndianRupee className="h-3 w-3 md:h-4 md:w-4 text-cocoa/40 shrink-0 ml-1" />}
                </CardHeader>
                <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                  <div className="text-lg md:text-2xl font-bold text-cocoa truncate">
                    <AnimatedNumber 
                      value={isCurrency ? val / 100 : val} 
                      formatValue={(v) => isCurrency ? formatINR(v) : v.toString()} 
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
