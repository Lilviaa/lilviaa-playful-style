import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDashboardReport } from "@/lib/admin/dashboard-api";
import {
  DEFAULT_COLUMN_IDS,
  downloadReportCSV,
  downloadReportPDF
} from "@/lib/admin/order-report-export";
import { CustomizeColumnsDialog } from "./customize-columns-dialog";
import { Loader2, FileSpreadsheet, FileDown, SlidersHorizontal, Check } from "lucide-react";
import { toast } from "sonner";

export function OrderReportGenerator() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exportType, setExportType] = useState<"csv" | "pdf" | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(DEFAULT_COLUMN_IDS);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

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

      if (type === "csv") {
        downloadReportCSV(
          reportData,
          selectedColumns,
          startDate,
          endDate,
          result.data?.settings
        );
        toast.success(
          `Exported ${reportData.length} orders (${selectedColumns.length} columns) to CSV`
        );
      } else {
        downloadReportPDF(
          reportData,
          selectedColumns,
          startDate,
          endDate,
          result.data?.settings
        );
        toast.success(
          `Exported ${reportData.length} orders (${selectedColumns.length} columns) to PDF`
        );
      }
    } catch (e) {
      console.error(e);
      toast.error(`Failed to generate ${type.toUpperCase()} report`);
    } finally {
      setExportType(null);
    }
  };

  const isExporting = isFetching || exportType !== null;
  const isDefaultColumns =
    selectedColumns.length === DEFAULT_COLUMN_IDS.length &&
    DEFAULT_COLUMN_IDS.every((id) => selectedColumns.includes(id));

  return (
    <>
      <Card className="border-border shadow-cute">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle className="text-cocoa font-display">Order Reports</CardTitle>
              <CardDescription className="mt-1">
                Generate clean, 1-row-per-order sales reports with customizable product, GST, and customer fields in CSV or PDF.
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizeOpen(true)}
              className="self-start sm:self-auto h-8 text-xs border-[#5C3A21]/30 text-cocoa hover:bg-[#5C3A21]/10 gap-1.5"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Customize Columns
              <Badge
                variant="secondary"
                className="ml-1 text-[10px] px-1.5 py-0 h-4 bg-[#5C3A21]/10 text-cocoa font-bold"
              >
                {selectedColumns.length}
              </Badge>
            </Button>
          </div>
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

          {/* Active Columns Indicator */}
          <div className="mt-3 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-600" />
              <span>
                Exporting with <strong className="text-cocoa font-medium">{selectedColumns.length}</strong> columns{" "}
                {isDefaultColumns ? "(Default 13)" : "(Custom Selection)"}
              </span>
            </span>
            <button
              type="button"
              onClick={() => setIsCustomizeOpen(true)}
              className="text-[#5C3A21] hover:underline font-medium cursor-pointer"
            >
              Change columns
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Customize Columns Modal */}
      <CustomizeColumnsDialog
        open={isCustomizeOpen}
        onOpenChange={setIsCustomizeOpen}
        selectedColumnIds={selectedColumns}
        onApply={(cols) => {
          setSelectedColumns(cols);
          toast.success(`Updated report columns (${cols.length} selected)`);
        }}
      />
    </>
  );
}
