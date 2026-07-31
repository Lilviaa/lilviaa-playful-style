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

export interface CmsSection {
  id: string;
  key: "our_story" | "featured_products_section";
  title: string;
  body: string;
  image_url: string | null;
  secondary_image_url?: string | null;
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
const STORAGE_KEY = "lilviaa_cms_mock_data";

const loadMockData = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return JSON.parse(data);
  } catch (e) {}
  return null;
};

const saveMockData = (data: any) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export let MOCK_BANNERS: Banner[] = loadMockData()?.banners || [
  {
    id: "BAN-1",
    type: "hero",
    image_url: "",
    headline: "Made for Little Gentlemen.",
    subtext: "Premium Kidswear",
    description: "Every garment is thoughtfully crafted using premium-quality fabrics and timeless designs, ensuring your little ones stay comfortable all day.",
    cta_text: "Shop the collection",
    cta_link: "/shop",
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

export let MOCK_HERO_SLIDES: HeroSlide[] = loadMockData()?.heroSlides || [
  { id: "HS-1", image_url: "/asset/Images/KVR00022-1-scaled-1-1-1.jpg", sort_order: 1 },
  { id: "HS-2", image_url: "/asset/Images/KVR00026-1-scaled-1-1-1.jpg", sort_order: 2 },
  { id: "HS-3", image_url: "/asset/Images/KVR00058-1-scaled-1-1-1.jpg", sort_order: 3 },
  { id: "HS-4", image_url: "/asset/Images/KVR00114-1-scaled-1-1-1.jpg", sort_order: 4 },
  { id: "HS-5", image_url: "/asset/Images/KVR00130-1-scaled-1-1-1.jpg", sort_order: 5 },
  { id: "HS-6", image_url: "/asset/Images/KVR00145-1-scaled-1-1-1.jpg", sort_order: 6 },
  { id: "HS-7", image_url: "/asset/Images/KVR00238-1-scaled-1-1-1.jpg", sort_order: 7 },
  { id: "HS-8", image_url: "/asset/Images/KVR00248-1-scaled-1-1-1.jpg", sort_order: 8 },
];

export let MOCK_CATEGORY_TILES: CategoryTile[] = loadMockData()?.categoryTiles || [
  {
    id: "CT-1",
    image_url: "https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?auto=format&fit=crop&q=80&w=400",
    label: "Kurtas",
    link: "/shop?category=kurta",
    sort_order: 1,
  },
  {
    id: "CT-2",
    image_url: "https://images.unsplash.com/photo-1514090458221-65bb69cf63e6?auto=format&fit=crop&q=80&w=400",
    label: "Shirts",
    link: "/shop?category=shirt",
    sort_order: 2,
  },
  {
    id: "CT-3",
    image_url: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&q=80&w=400",
    label: "Ethnic",
    link: "/shop?category=ethnic",
    sort_order: 3,
  },
  {
    id: "CT-4",
    image_url: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&q=80&w=400",
    label: "Party",
    link: "/shop?category=party",
    sort_order: 4,
  }
];

export let MOCK_FEATURED_PRODUCTS: FeaturedProduct[] = loadMockData()?.featuredProducts || [
  { id: "FP-1", product_id: "p_1", sort_order: 1 },
  { id: "FP-2", product_id: "p_2", sort_order: 2 },
  { id: "FP-3", product_id: "p_3", sort_order: 3 },
];

export let MOCK_CMS_SECTIONS: CmsSection[] = loadMockData()?.cmsSections || [
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
      saveMockData({ banners: MOCK_BANNERS, categoryTiles: MOCK_CATEGORY_TILES, featuredProducts: MOCK_FEATURED_PRODUCTS, cmsSections: MOCK_CMS_SECTIONS, heroSlides: MOCK_HERO_SLIDES });
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
      saveMockData({ banners: MOCK_BANNERS, categoryTiles: MOCK_CATEGORY_TILES, featuredProducts: MOCK_FEATURED_PRODUCTS, cmsSections: MOCK_CMS_SECTIONS, heroSlides: MOCK_HERO_SLIDES });
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
      saveMockData({ banners: MOCK_BANNERS, categoryTiles: MOCK_CATEGORY_TILES, featuredProducts: MOCK_FEATURED_PRODUCTS, cmsSections: MOCK_CMS_SECTIONS, heroSlides: MOCK_HERO_SLIDES });
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
      await new Promise(resolve => setTimeout(resolve, 500));
      const idx = MOCK_CMS_SECTIONS.findIndex(s => s.key === section.key);
      if (idx !== -1) {
        MOCK_CMS_SECTIONS[idx] = section;
      } else {
        MOCK_CMS_SECTIONS.push(section);
      }
      saveMockData({
        banners: MOCK_BANNERS,
        categoryTiles: MOCK_CATEGORY_TILES,
        featuredProducts: MOCK_FEATURED_PRODUCTS,
        cmsSections: MOCK_CMS_SECTIONS,
        heroSlides: MOCK_HERO_SLIDES
      });
      return section;
    },
    onSuccess: (_, section) => {
      queryClient.invalidateQueries({ queryKey: ["cms_section", section.key] });
      toast.success("Section content saved.");
    },
  });
}

// ==========================================
// HERO SLIDES HOOKS
// ==========================================
export function useHeroSlides() {
  return useQuery({
    queryKey: ["hero_slides"],
    queryFn: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return [...MOCK_HERO_SLIDES].sort((a, b) => a.sort_order - b.sort_order);
    },
  });
}

export function useUpdateHeroSlides() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (slides: HeroSlide[]) => {
      await new Promise(resolve => setTimeout(resolve, 500));
      MOCK_HERO_SLIDES = [...slides];
      saveMockData({
        banners: MOCK_BANNERS,
        categoryTiles: MOCK_CATEGORY_TILES,
        featuredProducts: MOCK_FEATURED_PRODUCTS,
        cmsSections: MOCK_CMS_SECTIONS,
        heroSlides: MOCK_HERO_SLIDES
      });
      return slides;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hero_slides"] });
      toast.success("Default slides saved successfully!");
    },
  });
}
