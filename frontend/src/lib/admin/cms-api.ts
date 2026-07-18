import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  cta_text: string;
  cta_link: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  sort_order: number;
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

export interface CmsSection {
  id: string;
  key: "our_story";
  title: string;
  body: string;
  image_url: string | null;
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
export let MOCK_BANNERS: Banner[] = [
  {
    id: "BAN-1",
    type: "hero",
    image_url: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=1200",
    headline: "Summer Collection 2024",
    subtext: "Discover the perfect outfits for your little ones.",
    cta_text: "Shop Now",
    cta_link: "/collections/summer",
    active: true,
    start_date: null,
    end_date: null,
    sort_order: 1,
  },
  {
    id: "BAN-2",
    type: "promo_strip",
    image_url: null,
    headline: "Free shipping on orders over ₹1000! 🚚",
    subtext: "",
    cta_text: "",
    cta_link: "",
    active: true,
    start_date: null,
    end_date: null,
    sort_order: 1,
  }
];

export let MOCK_CATEGORY_TILES: CategoryTile[] = [
  {
    id: "CT-1",
    image_url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=400",
    label: "Boys",
    link: "/collections/boys",
    sort_order: 1,
  },
  {
    id: "CT-2",
    image_url: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=400",
    label: "Girls",
    link: "/collections/girls",
    sort_order: 2,
  },
  {
    id: "CT-3",
    image_url: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=400",
    label: "Infants",
    link: "/collections/infants",
    sort_order: 3,
  }
];

export let MOCK_FEATURED_PRODUCTS: FeaturedProduct[] = [
  { id: "FP-1", product_id: "p_1", sort_order: 1 },
  { id: "FP-2", product_id: "p_2", sort_order: 2 },
  { id: "FP-3", product_id: "p_3", sort_order: 3 },
];

export let MOCK_CMS_SECTIONS: CmsSection[] = [
  {
    id: "CMS-1",
    key: "our_story",
    title: "Crafting Childhood Memories",
    body: "At Lilviaa, we believe every child deserves clothing that is as playful and vibrant as their imagination. Founded in 2024, our mission is to create comfortable, sustainable, and stylish apparel for the little ones you love.",
    image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=800",
  }
];

// ==========================================
// HELPERS
// ==========================================
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

// ==========================================
// REACT QUERY HOOKS
// ==========================================

// BANNERS
export function useBanners() {
  return useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      await delay(200);
      return [...MOCK_BANNERS].sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (updatedBanner: Banner) => {
      await delay(300);
      const index = MOCK_BANNERS.findIndex(b => b.id === updatedBanner.id);
      if (index !== -1) {
        MOCK_BANNERS[index] = updatedBanner;
      } else {
        MOCK_BANNERS.push(updatedBanner);
      }
      return updatedBanner;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success("Banner saved successfully.");
    },
  });
}

// CATEGORY TILES
export function useCategoryTiles() {
  return useQuery({
    queryKey: ["admin-category-tiles"],
    queryFn: async () => {
      await delay(200);
      return [...MOCK_CATEGORY_TILES].sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useUpdateCategoryTiles() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tiles: CategoryTile[]) => {
      await delay(300);
      MOCK_CATEGORY_TILES = [...tiles];
      return tiles;
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
      await delay(200);
      return [...MOCK_FEATURED_PRODUCTS].sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useUpdateFeaturedProducts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (products: FeaturedProduct[]) => {
      await delay(300);
      MOCK_FEATURED_PRODUCTS = [...products];
      return products;
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
      await delay(200);
      return MOCK_CMS_SECTIONS.find(s => s.key === key) || null;
    },
  });
}

export function useUpdateCmsSection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (section: CmsSection) => {
      await delay(300);
      const index = MOCK_CMS_SECTIONS.findIndex(s => s.id === section.id);
      if (index !== -1) {
        MOCK_CMS_SECTIONS[index] = section;
      } else {
        MOCK_CMS_SECTIONS.push(section);
      }
      return section;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cms-section", data.key] });
      toast.success("Section content saved.");
    },
  });
}
