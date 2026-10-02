import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface RevenueData {
  current: number;
  previous: number;
  percentageChange: number;
}

export interface ProductStat {
  id: string;
  name: string;
  image: string;
  value: number;
}

export interface TopProductsData {
  byUnits: ProductStat[];
  byRevenue: ProductStat[];
}

export interface ActivityItem {
  id: string;
  type: "order" | "stock";
  title: string;
  timestamp: string;
  status?: "pending" | "completed" | "low_stock";
}

export interface DashboardStats {
  revenue: {
    today: RevenueData;
    week: RevenueData;
    month: RevenueData;
    year: RevenueData;
  };
  chartData: { date: string; revenue: number }[];
  topProducts: TopProductsData;
  lowStockCount: number;
  pendingOrdersCount: number;
  recentActivity: ActivityItem[];
}

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboardStats"],
    queryFn: async () => {
      const res = await apiFetch("/admin/dashboard/stats");
      if (!res.ok) {
        throw new Error("Failed to fetch dashboard stats");
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export interface DashboardMetrics {
  totalRevenue: number;
  avgDailyRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
}

export function useDashboardMetrics(startDate: string, endDate: string, enabled: boolean = true) {
  return useQuery<DashboardMetrics>({
    queryKey: ["admin", "dashboardMetrics", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch(`/admin/dashboard/metrics?start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch metrics");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}

export function useDashboardChart(timeRange?: string, startDate?: string, endDate?: string) {
  return useQuery<{ chartData: { date: string; revenue: number }[] }>({
    queryKey: ["admin", "dashboardChart", timeRange, startDate, endDate],
    queryFn: async () => {
      let url = "/admin/dashboard/chart?";
      if (timeRange) url += `time_range=${timeRange}`;
      else if (startDate && endDate) url += `start_date=${startDate}&end_date=${endDate}`;
      
      const res = await apiFetch(url);
      if (!res.ok) throw new Error("Failed to fetch chart data");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });
}

export interface ReportItem {
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  status: string;
  paymentMethod: string;
  total: number;
  items: string;
}

export function useDashboardReport(startDate: string, endDate: string, enabled: boolean = false) {
  return useQuery<{ reportData: ReportItem[] }>({
    queryKey: ["admin", "dashboardReport", startDate, endDate],
    queryFn: async () => {
      const res = await apiFetch(`/admin/dashboard/report?start_date=${startDate}&end_date=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch report");
      return res.json();
    },
    staleTime: 0,
    enabled,
  });
}
