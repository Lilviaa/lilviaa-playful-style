import { createFileRoute } from "@tanstack/react-router";
import { ReturnsTable } from "@/components/admin/returns/returns-table";

export const Route = createFileRoute("/admin/returns/")({
  component: ReturnsIndexPage,
});

function ReturnsIndexPage() {
  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-cocoa">Returns & Refunds</h1>
          <p className="text-muted-foreground mt-1">
            Manage return requests and process refunds.
          </p>
        </div>
      </div>

      <ReturnsTable />
    </div>
  );
}
