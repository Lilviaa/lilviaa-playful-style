import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatINR } from "@/lib/cart";
import { DashboardStats } from "@/lib/admin/dashboard-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function TopProductsWidget({ data }: { data: DashboardStats["topProducts"] }) {
  const renderList = (items: typeof data.byUnits, isRevenue: boolean) => (
    <div className="space-y-4 pt-4">
      {items.map((item, idx) => (
        <div key={item.id} className="flex items-center gap-3">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand text-xs font-bold text-cocoa">
            {idx + 1}
          </div>
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md bg-sand">
            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-cocoa">{item.name}</p>
          </div>
          <div className="font-bold text-cocoa text-sm whitespace-nowrap">
            {isRevenue ? formatINR(item.value) : `${item.value} units`}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-2 border-border shadow-cute flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle className="text-cocoa font-display">Top Products (30 Days)</CardTitle>
      </CardHeader>
      <CardContent className="flex-1">
        <Tabs defaultValue="revenue" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-sand/50">
            <TabsTrigger 
              value="revenue" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              By Revenue
            </TabsTrigger>
            <TabsTrigger 
              value="units" 
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              By Units Sold
            </TabsTrigger>
          </TabsList>
          <TabsContent value="revenue">
            {renderList(data.byRevenue, true)}
          </TabsContent>
          <TabsContent value="units">
            {renderList(data.byUnits, false)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
