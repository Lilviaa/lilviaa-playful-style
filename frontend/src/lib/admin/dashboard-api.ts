import { useQuery } from "@tanstack/react-query";
import { products } from "@/lib/products";

export interface RevenueData {
  current: number;
  previous: number;
  percentageChange: number;
}

export interface ProductStat {
  id: string;
  name: string;
  image: string;
  value: number; // units or revenue
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

// --- MOCK API CALLS (Simulating Supabase) ---

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function getRevenueData(): Promise<DashboardStats["revenue"]> {
  await delay(400);
  return {
    today: { current: 12450, previous: 9800, percentageChange: 27 },
    week: { current: 85600, previous: 91200, percentageChange: -6 },
    month: { current: 342000, previous: 285000, percentageChange: 20 },
    year: { current: 4105000, previous: 2800000, percentageChange: 46 },
  };
}

async function getRevenueChartData(): Promise<{ date: string; revenue: number }[]> {
  await delay(200);
  const data = [];
  const now = new Date();
  for (let i = 30; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: Math.floor(Math.random() * 20000) + 5000,
    });
  }
  return data;
}

async function getTopProducts(limit = 5): Promise<TopProductsData> {
  await delay(300);
  const byUnits = [...products]
    .sort(() => 0.5 - Math.random())
    .slice(0, limit)
    .map((p) => ({
      id: p.slug,
      name: p.name,
      image: p.image,
      value: Math.floor(Math.random() * 150) + 20,
    }))
    .sort((a, b) => b.value - a.value);

  const byRevenue = [...products]
    .sort(() => 0.5 - Math.random())
    .slice(0, limit)
    .map((p) => ({
      id: p.slug,
      name: p.name,
      image: p.image,
      value: Math.floor(Math.random() * 50000) + 10000,
    }))
    .sort((a, b) => b.value - a.value);

  return { byUnits, byRevenue };
}

async function getLowStockCount(threshold = 5): Promise<number> {
  await delay(100);
  return 8; // Mock value
}

async function getPendingOrdersCount(): Promise<number> {
  await delay(100);
  return 14; // Mock value
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  await delay(400);
  return [
    { id: "ord-1", type: "order", title: "Order #1042 placed", timestamp: "10 mins ago", status: "pending" },
    { id: "ord-2", type: "order", title: "Order #1041 delivered", timestamp: "1 hour ago", status: "completed" },
    { id: "stk-1", type: "stock", title: "Midnight Leaf Kurta is running low", timestamp: "2 hours ago", status: "low_stock" },
    { id: "ord-3", type: "order", title: "Order #1040 placed", timestamp: "3 hours ago", status: "pending" },
    { id: "stk-2", type: "stock", title: "Meadow Mint Shirt is out of stock", timestamp: "5 hours ago", status: "low_stock" },
  ];
}

// --- HOOK ---

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["admin", "dashboardStats"],
    queryFn: async () => {
      const [
        revenue,
        chartData,
        topProducts,
        lowStockCount,
        pendingOrdersCount,
        recentActivity,
      ] = await Promise.all([
        getRevenueData(),
        getRevenueChartData(),
        getTopProducts(),
        getLowStockCount(),
        getPendingOrdersCount(),
        getRecentActivity(),
      ]);

      return {
        revenue,
        chartData,
        topProducts,
        lowStockCount,
        pendingOrdersCount,
        recentActivity,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
