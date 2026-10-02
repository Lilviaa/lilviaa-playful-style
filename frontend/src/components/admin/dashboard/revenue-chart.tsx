import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useDashboardChart } from "@/lib/admin/dashboard-api";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { exportToPNG, exportToPDF } from "@/lib/admin/export-utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AnimatedText } from "@/components/ui/animated-text";

export function RevenueChart() {
  const [timeRange, setTimeRange] = useState("30d");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const isCustom = timeRange === "custom";
  const canFetchCustom = isCustom && startDate !== "" && endDate !== "";
  
  const { data, isLoading } = useDashboardChart(
    isCustom ? undefined : timeRange,
    isCustom && canFetchCustom ? new Date(startDate).toISOString() : undefined,
    isCustom && canFetchCustom ? new Date(endDate).toISOString() : undefined
  );

  const chartData = data?.chartData || [];

  const handleExport = async (format: "png" | "pdf") => {
    setIsExporting(true);
    try {
      if (format === "png") await exportToPNG("dashboard-export-area");
      if (format === "pdf") await exportToPDF("dashboard-export-area");
    } finally {
      setIsExporting(false);
    }
  };

  const getTitle = () => {
    if (isCustom) return "Revenue Overview (Custom Range)";
    if (timeRange === "1d") return "Revenue Overview (Today)";
    if (timeRange === "7d") return "Revenue Overview (Last 7 Days)";
    if (timeRange === "1y") return "Revenue Overview (This Year)";
    return "Revenue Overview (Last 30 Days)";
  };

  return (
    <Card className="border-border shadow-cute">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <CardTitle className="text-cocoa font-display">
          <AnimatedText text={getTitle()} />
        </CardTitle>
        <div className="flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
          
          {isCustom && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-[130px] h-9 text-xs"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-[130px] h-9 text-xs"
              />
            </div>
          )}

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="1y">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs" disabled={isExporting}>
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport("png")}>Save as PNG</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("pdf")}>Save as PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-cocoa" />
            </div>
          )}
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7E6A5B" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7E6A5B" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                minTickGap={20}
              />
              <YAxis
                stroke="#a1a1aa"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value / 100000}k`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border border-border bg-card p-3 shadow-pop">
                        <p className="text-sm text-muted-foreground mb-1">{label}</p>
                        <p className="text-base font-bold text-cocoa">
                          ₹{((payload[0].value as number) / 100)?.toLocaleString("en-IN")}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#7E6A5B"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
