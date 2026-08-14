import { useState } from "react";
import { MapPin, Loader2, CheckCircle2, XCircle, Truck } from "lucide-react";
import { usePincode } from "@/hooks/usePincode";

interface PincodeCheckerProps {
  /** If provided, pre-fills the pincode input (e.g. from saved address) */
  defaultPincode?: string;
}

export function PincodeChecker({ defaultPincode }: PincodeCheckerProps) {
  const { pincode, result, isChecking, error, checkPincode, reset } = usePincode();
  const [inputVal, setInputVal] = useState(pincode || defaultPincode || "");

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setInputVal(val);
    // If user clears the input, reset saved result
    if (val.length === 0) reset();
  }

  function handleCheck() {
    checkPincode(inputVal);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCheck();
    }
  }

  function handleChange2() {
    reset();
    setInputVal("");
  }

  // Already have a result — show it
  if (result && pincode) {
    return (
      <div className="mt-4">
        {result.is_serviceable ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3.5 py-2.5">
            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-800">
                Delivery available to {pincode}
                {result.city ? ` · ${result.city}` : ""}
              </p>
              {result.estimated_delivery_days != null && (
                <p className="text-xs text-green-700 mt-0.5 flex items-center gap-1">
                  <Truck className="h-3 w-3" />
                  Estimated delivery in {result.estimated_delivery_days} day{result.estimated_delivery_days !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            <button
              onClick={handleChange2}
              className="text-xs font-bold text-green-700 hover:text-green-900 underline shrink-0 mt-0.5"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5">
            <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-700">
                Sorry, we don't deliver to {pincode}
              </p>
              <p className="text-xs text-red-600 mt-0.5">
                Try a nearby city or town pincode.
              </p>
            </div>
            <button
              onClick={handleChange2}
              className="text-xs font-bold text-red-600 hover:text-red-800 underline shrink-0 mt-0.5"
            >
              Change
            </button>
          </div>
        )}
      </div>
    );
  }

  // Input state
  return (
    <div className="mt-4">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-cocoa">Check Delivery</span>
      </div>
      <div className="mt-2 flex gap-2">
        <input
          id="pincode-input"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="Enter 6-digit pincode"
          value={inputVal}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="flex h-10 w-full max-w-[180px] rounded-lg border border-border bg-background px-3 text-sm text-cocoa placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
        />
        <button
          onClick={handleCheck}
          disabled={isChecking || inputVal.length !== 6}
          className="h-10 rounded-lg border border-cocoa bg-background px-4 text-xs font-bold uppercase tracking-wider text-cocoa transition-colors hover:bg-cocoa hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5"
        >
          {isChecking ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking</>
          ) : (
            "Check"
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
