import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "../api";

// ==========================================
// TYPES
// ==========================================
export type BannerType = "hero" | "promo_strip";

export interface Banner {
  id: string;
  type: BannerType;
  image_url: string | null;
  headline: string;
  subtext: string;
  description?: string;
  cta_text: string;
  cta_link: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
}

export interface HeroSlide {
  id: string;
  image_url: string;
  sort_order: number;
  file?: File;
}

export interface CategoryTile {
  id: string;
  image_url: string;
  label: string;
  link: string;
  sort_order: number;
}

export interface FeaturedProduct {
  id: string;
  product_id: string; // FK to products
  sort_order: number;
}

export interface PhilosophyCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
}

export interface CmsSection {
  id: string;
  key: "our_story" | "featured_products_section" | "our_philosophy";
  title: string;
  body: string;
  image_url: string | null;
  secondary_image_url?: string | null;
  section_key?: string;
}

// Map Backend to Frontend
function mapBackendBanner(b: any): Banner {
  return {
    ...b,
    headline: b.title || "",
    subtext: b.subtitle || "",
    cta_link: b.link_url || "",
  };
}

function mapFrontendBanner(b: Banner): any {
  return {
    ...b,
    title: b.headline,
    subtitle: b.subtext,
    link_url: b.cta_link,
  };
}

export async function uploadCmsImage(file: File): Promise<string> {
  try {
    // 1. Request upload URL
    const reqRes = await apiFetch("/admin/cms/upload/request-url", {
      method: "POST",
      body: JSON.stringify({
        filename: file.name,
        content_type: file.type,
      })
    });
    
    if (!reqRes.ok) throw new Error("Failed to get upload URL");
    const { upload_url, public_url } = await reqRes.json();
    
    // 2. Upload file bytes directly
    const uploadRes = await apiFetch(upload_url, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type
      }
    });
    
    if (!uploadRes.ok) throw new Error("Failed to upload image");
    
    return public_url;
  } catch (error) {
    console.error("Upload error:", error);
    toast.error("Failed to upload image");
    throw error;
  }
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================

// BANNERS
export function useBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const res = await apiFetch("/admin/banners");
      if (!res.ok) throw new Error("Failed to fetch banners");
      const data = await res.json();
      return data.map(mapBackendBanner);
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedBanner: Banner) => {
      const payload = mapFrontendBanner(updatedBanner);
      let res;
      if (updatedBanner.id.startsWith("BAN-") || updatedBanner.id.includes("NEW")) {
        // Create new banner
        const { id, ...createPayload } = payload;
        res = await apiFetch("/admin/banners", {
          method: "POST",
          body: JSON.stringify(createPayload)
        });
      } else {
        // Update existing banner
        res = await apiFetch(`/admin/banners/${updatedBanner.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
      }
      
      if (!res.ok) throw new Error("Failed to update banner");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner saved successfully.");
    },
    onError: () => {
      toast.error("Failed to save banner.");
    }
  });
}

// CATEGORY TILES
export function useCategoryTiles() {
  return useQuery({
    queryKey: ["admin-category-tiles"],
    queryFn: async () => {
      const res = await apiFetch("/admin/cms/category-tiles");
      if (!res.ok) throw new Error("Failed to fetch category tiles");
      return await res.json();
    },
  });
}

export function useUpdateCategoryTiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tiles: CategoryTile[]) => {
      const res = await apiFetch("/admin/cms/category-tiles", {
        method: "PUT",
        body: JSON.stringify(tiles)
      });
      if (!res.ok) throw new Error("Failed to update category tiles");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-category-tiles"] });
      toast.success("Category tiles updated.");
    },
  });
}

// FEATURED PRODUCTS
export function useFeaturedProducts() {
  return useQuery({
    queryKey: ["admin-featured-products"],
    queryFn: async () => {
      const res = await apiFetch("/admin/cms/featured-products");
      if (!res.ok) throw new Error("Failed to fetch featured products");
      return await res.json();
    },
  });
}

export function useUpdateFeaturedProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (products: FeaturedProduct[]) => {
      const res = await apiFetch("/admin/cms/featured-products", {
        method: "PUT",
        body: JSON.stringify(products)
      });
      if (!res.ok) throw new Error("Failed to update featured products");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-featured-products"] });
      toast.success("Featured products updated.");
    },
  });
}

// CMS SECTIONS
export function useCmsSection(key: string) {
  return useQuery({
    queryKey: ["admin-cms-section", key],
    queryFn: async () => {
      const res = await apiFetch(`/admin/cms/sections/${key}`);
      if (!res.ok) {
        if (res.status === 404) return null;
        throw new Error("Failed to fetch section");
      }
      const data = await res.json();
      if (!data) return null;
      return { ...data, key: data.section_key };
    },
  });
}

export function useUpdateCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: CmsSection) => {
      const res = await apiFetch(`/admin/cms/sections/${section.key}`, {
        method: "PUT",
        body: JSON.stringify(section)
      });
      if (!res.ok) throw new Error("Failed to update section");
      return await res.json();
    },
    onSuccess: (_, section) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-section", section.key] });
      toast.success("Section content saved.");
    },
  });
}

// HERO SLIDES
export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero_slides"],
    queryFn: async () => {
      const res = await apiFetch("/admin/cms/hero-slides");
      if (!res.ok) throw new Error("Failed to fetch hero slides");
      return await res.json();
    },
  });
}

export function useUpdateHeroSlides() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (slides: HeroSlide[]) => {
      const res = await apiFetch("/admin/cms/hero-slides", {
        method: "PUT",
        body: JSON.stringify(slides)
      });
      if (!res.ok) throw new Error("Failed to update hero slides");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero_slides"] });
      toast.success("Hero slides saved successfully!");
    },
  });
}

// PHILOSOPHY CARDS
export function usePhilosophyCards() {
  return useQuery({
    queryKey: ["admin-philosophy-cards"],
    queryFn: async () => {
      const res = await apiFetch("/admin/cms/philosophy-cards");
      if (!res.ok) throw new Error("Failed to fetch philosophy cards");
      return await res.json();
    },
  });
}

export function useUpdatePhilosophyCards() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cards: PhilosophyCard[]) => {
      const res = await apiFetch("/admin/cms/philosophy-cards", {
        method: "PUT",
        body: JSON.stringify(cards)
      });
      if (!res.ok) throw new Error("Failed to update philosophy cards");
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-philosophy-cards"] });
      toast.success("Philosophy cards updated.");
    },
  });
}
