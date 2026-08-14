import { useState, useEffect, useCallback } from "react";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "lilviaa_pincode";

export interface PincodeResult {
  is_serviceable: boolean;
  estimated_delivery_days: number | null;
  city: string | null;
  state: string | null;
}

export interface PincodeState {
  pincode: string | null;
  result: PincodeResult | null;
  isChecking: boolean;
  error: string | null;
}

/**
 * Reads the last-checked pincode from localStorage.
 * Returns null if nothing has been checked yet.
 */
function readStoredPincode(): { pincode: string; result: PincodeResult } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStoredPincode(pincode: string, result: PincodeResult) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ pincode, result }));
  } catch {}
}

export function clearStoredPincode() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/**
 * Hook to check and cache Shiprocket serviceability for a given pincode.
 * 
 * Usage:
 *   const { pincode, result, isChecking, error, checkPincode } = usePincode();
 */
export function usePincode() {
  const stored = readStoredPincode();

  const [pincode, setPincode] = useState<string | null>(stored?.pincode ?? null);
  const [result, setResult] = useState<PincodeResult | null>(stored?.result ?? null);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkPincode = useCallback(async (pin: string) => {
    if (!pin || !/^\d{6}$/.test(pin)) {
      setError("Please enter a valid 6-digit pincode.");
      return;
    }

    // If same pincode already checked, skip API call
    if (pin === pincode && result !== null) return;

    setIsChecking(true);
    setError(null);

    try {
      const res = await apiFetch(`/shipping/check-pincode?pincode=${pin}`);
      const data: PincodeResult = await res.json();

      setPincode(pin);
      setResult(data);
      writeStoredPincode(pin, data);
    } catch (err: any) {
      setError("Could not check pincode. Please try again.");
    } finally {
      setIsChecking(false);
    }
  }, [pincode, result]);

  /**
   * Pre-populate from a saved address (called from checkout when user selects address).
   * Does NOT hit the API if the pincode hasn't changed.
   */
  const setFromAddress = useCallback(async (pin: string) => {
    if (!pin || pin === pincode) return;
    await checkPincode(pin);
  }, [pincode, checkPincode]);

  const reset = useCallback(() => {
    setPincode(null);
    setResult(null);
    setError(null);
    clearStoredPincode();
  }, []);

  return { pincode, result, isChecking, error, checkPincode, setFromAddress, reset };
}
