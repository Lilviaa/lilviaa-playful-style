import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOrderId(rawOrderId: string | number, displayId?: string): string {
  if (displayId) return displayId;
  if (!rawOrderId) return '';
  const strId = String(rawOrderId);
  
  // If it's already a display ID (e.g. ORD-LV-0001), just return it
  if (strId.startsWith('ORD-LV-')) {
    return strId;
  }
  
  try {
    const cleanId = strId.replace(/-/g, '').substring(0, 6);
    const parsedInt = parseInt(cleanId, 16);
    if (!isNaN(parsedInt)) {
      const numericHash = parsedInt.toString().padStart(6, '0');
      return `ORD-LV-${numericHash}`;
    }
  } catch (e) {
    // Fallback
  }
  
  return `ORD-LV-${strId.substring(0, 6).toUpperCase()}`;
}
