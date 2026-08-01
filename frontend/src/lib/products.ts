export type Product = {
  id: string;
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
  tag?: "new" | "bestseller" | "sale" | string;
  description: string;
  fabric: string;
  care: string;
  sku?: string;
  stock?: number;
  variants?: {
    id: string;
    size: string;
    sku: string;
    stock: number;
    price_override: number | null;
  }[];
};

