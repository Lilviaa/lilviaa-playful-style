import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardStats } from "@/lib/admin/dashboard-api";
import { ShoppingBag, PackageOpen } from "lucide-react";

export function RecentActivityFeed({ data }: { data: DashboardStats["recentActivity"] }) {
  return (
    <Card className="border-border shadow-cute h-full">
      <CardHeader>
        <CardTitle className="text-cocoa font-display">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {data.map((item, index) => (
            <div key={item.id} className="relative flex gap-4">
              {/* Timeline line connecting items (except last) */}
              {index !== data.length - 1 && (
                <div className="absolute left-4 top-10 -bottom-6 w-px bg-border" />
              )}
              
              <div
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border shadow-sm ${
                  item.type === "order" ? "bg-cream text-primary" : "bg-cream text-rose-500"
                }`}
              >
                {item.type === "order" ? (
                  <ShoppingBag className="h-4 w-4" />
                ) : (
                  <PackageOpen className="h-4 w-4" />
                )}
              </div>
              
              <div className="flex-1 space-y-1 pb-2">
                <p className="text-sm font-semibold text-cocoa">{item.title}</p>
                <div className="flex items-center text-xs text-muted-foreground gap-2">
                  <span>{item.timestamp}</span>
                  {item.status && (
                    <span className="capitalize px-1.5 py-0.5 rounded bg-sand/50 font-medium">
                      {item.status.replace("_", " ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
