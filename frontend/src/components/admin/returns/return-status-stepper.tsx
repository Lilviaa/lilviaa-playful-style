import { Return, ReturnStatus, STATUS_STEPS, useUpdateReturnStatus } from "@/lib/admin/returns-api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const STEP_LABELS: Record<ReturnStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  in_transit: "In Transit",
  received: "Received",
  refund_processed: "Refund Done",
};

interface ReturnStatusStepperProps {
  ret: Return;
}

export function ReturnStatusStepper({ ret }: ReturnStatusStepperProps) {
  const { mutate: updateStatus, isPending } = useUpdateReturnStatus();
  const [rejectionNote, setRejectionNote] = useState(ret.rejection_note || "");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const currentStepIndex = STATUS_STEPS.indexOf(ret.status);
  const isRejected = ret.status === "rejected";

  const handleAdvance = () => {
    if (ret.status === "approved") {
      updateStatus({ id: ret.id, status: "in_transit" });
    } else if (ret.status === "in_transit") {
      updateStatus({ id: ret.id, status: "received" });
    } else if (ret.status === "received") {
      updateStatus({ id: ret.id, status: "refund_processed" });
    }
  };

  const handleApprove = () => {
    updateStatus({ id: ret.id, status: "approved" });
    setShowRejectForm(false);
  };

  const handleReject = () => {
    if (!rejectionNote.trim()) return;
    updateStatus({ id: ret.id, status: "rejected", rejectionNote });
    setShowRejectForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Stepper Visual */}
      {isRejected ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <div className="p-2 rounded-full bg-red-100">
            <X className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="font-semibold text-red-800">Return Rejected</p>
            {ret.rejection_note && (
              <p className="text-sm text-red-700 mt-0.5">{ret.rejection_note}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {STATUS_STEPS.map((step, idx) => {
            const isDone = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            return (
              <div key={step} className="flex items-center gap-1 shrink-0">
                <div
                  className={cn(
                    "flex items-center justify-center h-7 w-7 rounded-full border-2 text-xs font-bold transition-all",
                    isDone && "bg-emerald-500 border-emerald-500 text-white",
                    isCurrent && "bg-cocoa border-cocoa text-white scale-110",
                    !isDone && !isCurrent && "bg-white border-cocoa/20 text-muted-foreground"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                </div>
                <span
                  className={cn(
                    "text-[11px] font-medium whitespace-nowrap hidden sm:block",
                    isCurrent ? "text-cocoa font-bold" : "text-muted-foreground"
                  )}
                >
                  {STEP_LABELS[step]}
                </span>
                {idx < STATUS_STEPS.length - 1 && (
                  <div className={cn("h-0.5 w-6 mx-0.5 rounded-full", isDone ? "bg-emerald-400" : "bg-cocoa/10")} />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      {!isRejected && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-cocoa/10">
          {ret.status === "requested" && (
            <>
              <Button
                size="sm"
                className="rounded-full gap-2 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleApprove}
                disabled={isPending}
              >
                <Check className="h-3.5 w-3.5" />
                Approve Return
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full gap-2 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => setShowRejectForm((v) => !v)}
                disabled={isPending}
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </Button>
            </>
          )}
          {(ret.status === "approved" || ret.status === "in_transit" || ret.status === "received") && (
            <Button
              size="sm"
              className="rounded-full"
              onClick={handleAdvance}
              disabled={isPending}
            >
              {ret.status === "approved"
                ? "Mark In Transit"
                : ret.status === "in_transit"
                ? "Mark Received"
                : "Process Refund"}
            </Button>
          )}
        </div>
      )}

      {/* Rejection Note Form */}
      {showRejectForm && (
        <div className="space-y-3 p-4 bg-red-50 rounded-xl border border-red-200">
          <Label className="text-red-800 font-semibold">Rejection Reason (Required)</Label>
          <Textarea
            placeholder="Explain why this return is being rejected..."
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            className="bg-white border-red-200 focus-visible:ring-red-400"
            rows={3}
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              className="rounded-full bg-red-600 hover:bg-red-700"
              onClick={handleReject}
              disabled={isPending || !rejectionNote.trim()}
            >
              Confirm Rejection
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowRejectForm(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
