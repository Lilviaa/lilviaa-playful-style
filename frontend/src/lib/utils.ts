import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOrderId(rawOrderId: string | number): string {
  if (!rawOrderId) return '';
  const strId = String(rawOrderId);
  const numericHash = parseInt(strId.replace(/-/g, '').substring(0, 6), 16).toString().padStart(6, '0');
  return `ORD-LV-${numericHash}`;
}
