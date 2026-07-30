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
