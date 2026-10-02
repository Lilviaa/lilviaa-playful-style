import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardReport } from "@/lib/admin/dashboard-api";
import { Loader2, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export function OrderReportGenerator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [enabled, setEnabled] = useState(false);

  const { isFetching, refetch } = useDashboardReport(
    startDate ? new Date(startDate).toISOString() : "",
    endDate ? new Date(endDate).toISOString() : "",
    enabled
  );

  const handleGenerate = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }
    
    setEnabled(true);
    try {
      const result = await refetch();
      if (result.data?.reportData) {
        const headers = ["Order ID", "Date", "Customer Name", "Customer Email", "Status", "Payment Method", "Total", "Items"];
        const rows = result.data.reportData.map(r => [
          r.orderId,
          new Date(r.date).toLocaleDateString(),
          `"${r.customerName.replace(/"/g, '""')}"`,
          `"${r.customerEmail.replace(/"/g, '""')}"`,
          r.status,
          r.paymentMethod,
          r.total,
          `"${r.items.replace(/"/g, '""')}"`
        ]);
        
        const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `Order_Report_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success("Report generated and downloaded successfully");
      }
    } catch (e) {
      toast.error("Failed to generate report");
    } finally {
      setEnabled(false);
    }
  };

  return (
    <Card className="border-border shadow-cute">
      <CardHeader>
        <CardTitle className="text-cocoa font-display">Order Reports</CardTitle>
        <CardDescription>Generate and download detailed order records</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-cocoa mb-1 block">Start Date</label>
            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-cocoa mb-1 block">End Date</label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <Button 
            onClick={handleGenerate} 
            disabled={isFetching || !startDate || !endDate}
            className="w-full sm:w-auto active:scale-95 transition-transform"
          >
            {isFetching ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
            Generate
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
