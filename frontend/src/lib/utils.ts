import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatOrderId(rawOrderId: string | number, displayId?: string): string {
  if (displayId) {
    if (displayId.startsWith('ORD-LV-')) {
      return displayId.replace('ORD-LV-', 'ORD-LIL-');
    }
    return displayId;
  }
  if (!rawOrderId) return '';
  const strId = String(rawOrderId);
  
  // If it's already an ORD-LIL- display ID, return it
  if (strId.startsWith('ORD-LIL-')) {
    return strId;
  }
  // Convert legacy ORD-LV- prefix
  if (strId.startsWith('ORD-LV-')) {
    return strId.replace('ORD-LV-', 'ORD-LIL-');
  }

  // If pure numeric (e.g. order_number)
  if (/^\d+$/.test(strId)) {
    return `ORD-LIL-${strId.padStart(4, '0')}`;
  }
  
  try {
    const cleanId = strId.replace(/-/g, '').substring(0, 6);
    const parsedInt = parseInt(cleanId, 16);
    if (!isNaN(parsedInt)) {
      const numericHash = parsedInt.toString().padStart(6, '0');
      return `ORD-LIL-${numericHash}`;
    }
  } catch (e) {
    // Fallback
  }
  
  return `ORD-LIL-${strId.substring(0, 6).toUpperCase()}`;
}

export function getOptimizedImageUrl(url: string, width: number = 400, quality: number = 75): string {
  if (!url) return "";
  if (url.startsWith("/") && !url.startsWith("http")) return url;
  
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    // Vercel image optimization only works when deployed
    return url;
  }
  
  return `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=${quality}`;
}
