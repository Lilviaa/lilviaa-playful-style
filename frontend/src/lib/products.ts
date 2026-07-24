export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  gallery: string[];
  category: "kurta" | "shirt" | "ethnic" | "party" | string;
  gender: "boys" | "girls" | "unisex" | string;
  ageRange: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  tag?: "new" | "bestseller" | "sale" | string;
  description: string;
  fabric: string;
  care: string;
  sku?: string;
  stock?: number;
  variants?: {
    size: string;
    color: string;
    sku: string;
    stock: number;
    price_override: number | null;
  }[];
};

export const categories = [
  { slug: "kurta", label: "Kurtas", emoji: "🌼" },
  { slug: "shirt", label: "Shirts", emoji: "☀️" },
  { slug: "ethnic", label: "Ethnic", emoji: "🪁" },
  { slug: "party", label: "Party", emoji: "🎈" },
] as const;
