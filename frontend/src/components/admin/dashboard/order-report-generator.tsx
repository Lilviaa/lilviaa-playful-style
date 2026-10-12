import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDashboardReport } from "@/lib/admin/dashboard-api";
import { buildReportRows, downloadReportCSV, downloadReportPDF } from "@/lib/admin/order-report-export";
import { Loader2, FileSpreadsheet, FileDown } from "lucide-react";
import { toast } from "sonner";

export function OrderReportGenerator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportType, setExportType] = useState<"csv" | "pdf" | null>(null);

  const startIso = startDate ? `${startDate}T00:00:00.000Z` : "";
  const endIso = endDate ? `${endDate}T23:59:59.999Z` : "";

  const { isFetching, refetch } = useDashboardReport(
    startIso,
    endIso,
    false
  );

  const handleGenerate = async (type: "csv" | "pdf") => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setExportType(type);
    try {
      const result = await refetch();
      const reportData = result.data?.reportData || [];

      if (!reportData.length) {
        toast.info("No orders found for the selected date range");
        return;
      }

      const rows = buildReportRows(reportData, result.data?.settings);

      if (type === "csv") {
        downloadReportCSV(rows, startDate, endDate);
        toast.success(`Exported ${reportData.length} orders (${rows.length} rows) to CSV`);
      } else {
        downloadReportPDF(reportData, rows, startDate, endDate, result.data?.settings);
        toast.success(`Exported ${reportData.length} orders (${rows.length} rows) to PDF`);
      }
    } catch (e) {
      console.error(e);
      toast.error(`Failed to generate ${type.toUpperCase()} report`);
    } finally {
      setExportType(null);
    }
  };

  const isExporting = isFetching || exportType !== null;

  return (
    <Card className="border-border shadow-cute">
      <CardHeader>
        <CardTitle className="text-cocoa font-display">Order Reports</CardTitle>
        <CardDescription>
          Generate and download detailed order records with product items, GST breakdowns, and totals in CSV or PDF.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-cocoa mb-1 block">Start Date</label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-cocoa mb-1 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white/80"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() => handleGenerate("csv")}
              disabled={isExporting || !startDate || !endDate}
              variant="outline"
              className="flex-1 sm:flex-initial active:scale-95 transition-transform border-[#5C3A21]/30 text-cocoa hover:bg-[#5C3A21]/10 font-medium"
            >
              {exportType === "csv" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2 text-emerald-600" />
              )}
              Export CSV
            </Button>
            <Button
              onClick={() => handleGenerate("pdf")}
              disabled={isExporting || !startDate || !endDate}
              className="flex-1 sm:flex-initial active:scale-95 transition-transform bg-[#5C3A21] hover:bg-[#4A2E1A] text-white font-medium"
            >
              {exportType === "pdf" ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4 mr-2 text-rose-300" />
              )}
              Export PDF
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
