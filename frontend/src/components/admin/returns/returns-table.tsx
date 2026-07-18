import { Return, ReturnStatus, ReturnReason, REASON_LABELS, useReturns, useMarkVideoReceived } from "@/lib/admin/returns-api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Eye, MessageCircle, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

const STATUS_COLORS: Record<ReturnStatus, string> = {
  requested: "bg-amber-100 text-amber-800 border-amber-200",
  approved: "bg-blue-100 text-blue-800 border-blue-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  in_transit: "bg-purple-100 text-purple-800 border-purple-200",
  received: "bg-cyan-100 text-cyan-800 border-cyan-200",
  refund_processed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  in_transit: "In Transit",
  received: "Received",
  refund_processed: "Refund Done",
};

const TAB_OPTIONS = [
  { value: "all", label: "All" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "refund_processed", label: "Completed" },
];

export function ReturnsTable() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"all" | ReturnStatus>("all");
  const { data: returns = [], isLoading } = useReturns(activeTab);
  const { mutate: markVideo, isPending: markingVideo } = useMarkVideoReceived();

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList className="bg-sand/50 rounded-xl">
          {TAB_OPTIONS.map((t) => (
            <TabsTrigger key={t.value} value={t.value} className="rounded-lg">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="rounded-2xl border border-cocoa/10 bg-white p-12 text-center text-muted-foreground">
          Loading returns...
        </div>
      ) : returns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-cocoa/20 bg-sand/10 p-12 text-center text-muted-foreground">
          No returns in this category.
        </div>
      ) : (
        <div className="rounded-2xl border border-cocoa/10 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand/50 border-b border-cocoa/10">
              <tr>
                {["Return ID", "Order ID", "Customer", "Reason", "WhatsApp Video", "Status", "Requested", ""].map((h) => (
                  <th key={h} className="text-left text-cocoa font-bold px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {returns.map((ret) => (
                <tr
                  key={ret.id}
                  className={`border-b border-cocoa/5 transition-colors ${
                    !ret.unboxing_video_provided && ret.status === "requested"
                      ? "bg-amber-50/60 hover:bg-amber-50"
                      : "hover:bg-primary/5"
                  }`}
                >
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono font-bold text-cocoa">{ret.id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs font-mono text-muted-foreground">{ret.order_id}</code>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-cocoa">{ret.customer_name}</p>
                      <p className="text-xs text-muted-foreground">{ret.customer_email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {REASON_LABELS[ret.reason as ReturnReason]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      disabled={markingVideo}
                      onClick={() => markVideo({ id: ret.id, received: !ret.unboxing_video_provided })}
                      title={ret.unboxing_video_provided ? "Click to unmark video" : "Customer sends video via WhatsApp — click to mark received"}
                      className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border transition-all hover:opacity-80 ${
                        ret.unboxing_video_provided
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-amber-50 border-amber-200 text-amber-700"
                      }`}
                    >
                      {ret.unboxing_video_provided ? (
                        <><CheckCircle2 className="h-3.5 w-3.5" /> Received</>
                      ) : (
                        <><MessageCircle className="h-3.5 w-3.5" /> Awaiting <AlertTriangle className="h-3 w-3" /></>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={`text-xs ${STATUS_COLORS[ret.status]}`}>
                      {STATUS_LABEL[ret.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(ret.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => navigate({ to: "/admin/returns/$returnId", params: { returnId: ret.id } })}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
