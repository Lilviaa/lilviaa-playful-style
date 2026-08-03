import { createFileRoute } from "@tanstack/react-router";
import { useDashboardStats } from "@/lib/admin/dashboard-api";
import { RevenueCards } from "@/components/admin/dashboard/revenue-cards";
import { RevenueChart } from "@/components/admin/dashboard/revenue-chart";
import { LowStockBadge } from "@/components/admin/dashboard/low-stock-badge";
import { PendingOrdersBadge } from "@/components/admin/dashboard/pending-orders-badge";
import { RecentActivityFeed } from "@/components/admin/dashboard/recent-activity-feed";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/admin/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { data, isLoading } = useDashboardStats();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
          <Skeleton className="h-[120px] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-6">
          <Skeleton className="h-[400px] rounded-xl" />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-6 md:col-span-1">
            <Skeleton className="h-[120px] rounded-xl" />
            <Skeleton className="h-[120px] rounded-xl" />
          </div>
          <Skeleton className="h-[300px] rounded-xl md:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="font-display text-3xl font-bold text-cocoa">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Here's what's happening with your store today.</p>
      </div>

      {/* Top Row: Revenue Cards */}
      <RevenueCards data={data.revenue} />

      {/* Middle Row: Chart */}
      <div className="grid grid-cols-1 gap-6">
        <RevenueChart data={data.chartData} />
      </div>

      {/* Bottom Row: Badges & Activity */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col gap-6 md:col-span-1">
          <PendingOrdersBadge count={data.pendingOrdersCount} />
          <LowStockBadge count={data.lowStockCount} />
        </div>
        <div className="md:col-span-2">
          <RecentActivityFeed data={data.recentActivity} />
        </div>
      </div>
    </div>
  );
}
