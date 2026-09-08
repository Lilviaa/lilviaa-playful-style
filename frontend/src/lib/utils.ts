import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOrderId(rawOrderId: string | number): string {
  if (!rawOrderId) return '';
  const strId = String(rawOrderId);
  
  // If it's already a display ID (e.g. ORD-LV-0001), just return it
  if (strId.startsWith('ORD-LV-')) {
    return strId;
  }
  
  return strId;
}
