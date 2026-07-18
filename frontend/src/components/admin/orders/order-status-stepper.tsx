import { Order, OrderStatus } from "@/lib/admin/orders-api";
import { Check, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusStepperProps {
  order: Order;
  onUpdateStatus: (status: OrderStatus) => void;
}

const STEPS: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Delivered", value: "delivered" },
];

export function OrderStatusStepper({ order, onUpdateStatus }: OrderStatusStepperProps) {
  const currentStepIndex = STEPS.findIndex((s) => s.value === order.status);

  if (order.status === "cancelled" || order.status === "returned") {
    return (
      <div className="rounded-lg bg-rose-50 p-4 border border-rose-100">
        <p className="text-sm font-semibold text-rose-800 capitalize">Order {order.status}</p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute left-0 top-4 -z-10 h-0.5 w-full bg-slate-100">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${currentStepIndex >= 0 ? (currentStepIndex / (STEPS.length - 1)) * 100 : 0}%`,
            }}
          />
        </div>

        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isNext = index === currentStepIndex + 1;
          const isPending = index > currentStepIndex;

          let Icon = Circle;
          if (isCompleted) Icon = Check;
          else if (isCurrent) Icon = CircleDot;

          const isClickable = isNext; // Only allow clicking the immediate next step

          return (
            <div key={step.value} className="flex flex-col items-center gap-2">
              <button
                disabled={!isClickable}
                onClick={() => isClickable && onUpdateStatus(step.value)}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white transition-all",
                  isCompleted && "border-emerald-500 bg-emerald-500 text-white",
                  isCurrent && "border-emerald-500 text-emerald-500",
                  isPending && "border-slate-300 text-slate-300",
                  isClickable &&
                    "hover:border-emerald-400 hover:text-emerald-400 cursor-pointer shadow-sm hover:scale-110",
                  !isClickable && !isCurrent && !isCompleted && "cursor-not-allowed opacity-50",
                )}
                title={isClickable ? `Mark as ${step.label}` : ""}
              >
                <Icon className="h-4 w-4" strokeWidth={isCompleted ? 3 : 2} />
              </button>
              <span
                className={cn(
                  "text-xs font-medium",
                  isCompleted || isCurrent ? "text-cocoa" : "text-slate-400",
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
