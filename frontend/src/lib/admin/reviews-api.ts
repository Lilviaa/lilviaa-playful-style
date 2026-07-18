import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MOCK_PRODUCTS } from "./products-api";

// ==========================================
// TYPES
// ==========================================
export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  customer_id: string;
  customer_name: string;
  order_item_id: string | null; // null = unverified, truthy = verified purchase
  rating: number; // 1-5
  text: string;
  status: ReviewStatus;
  is_featured: boolean;
  created_at: string;
}

// ==========================================
// MOCK DATABASE STATE
// ==========================================
export let MOCK_REVIEWS: Review[] = [
  {
    id: "REV-001",
    product_id: "p_1",
    product_name: "Sunny Picnic Shirt",
    product_image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=80&h=80&fit=crop",
    customer_id: "CUST-001",
    customer_name: "Priya Sharma",
    order_item_id: "OI-001",
    rating: 5,
    text: "Absolutely love this shirt! The fabric is so soft and breathable. My daughter wore it to her school picnic and got so many compliments. The color is just as vibrant as in the photos. Will definitely be ordering more from Lilviaa!",
    status: "pending",
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "REV-002",
    product_id: "p_2",
    product_name: "Midnight Leaf Kurta",
    product_image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=80&h=80&fit=crop",
    customer_id: "CUST-002",
    customer_name: "Rahul Verma",
    order_item_id: "OI-002",
    rating: 4,
    text: "Beautiful kurta, the embroidery is exquisite. Fits true to size. Only minor issue is the colour looked slightly different from the website photo in direct sunlight, but still gorgeous. Packaging was also very premium.",
    status: "pending",
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "REV-003",
    product_id: "p_1",
    product_name: "Sunny Picnic Shirt",
    product_image: "https://images.unsplash.com/photo-1622290291468-a28f7a7dc6a8?w=80&h=80&fit=crop",
    customer_id: "CUST-003",
    customer_name: "Anita Desai",
    order_item_id: null, // unverified
    rating: 3,
    text: "Quality is decent but the stitching at the collar started coming loose after 2 washes. Expected better for this price. Customer service was responsive though.",
    status: "approved",
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "REV-004",
    product_id: "p_2",
    product_name: "Midnight Leaf Kurta",
    product_image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=80&h=80&fit=crop",
    customer_id: "CUST-001",
    customer_name: "Priya Sharma",
    order_item_id: "OI-005",
    rating: 5,
    text: "This kurta is a masterpiece. The cotton silk blend feels incredibly luxurious. I wore it to a wedding and received compliments all evening. True to size, great packaging. 100% recommend!",
    status: "approved",
    is_featured: true,
    created_at: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: "REV-005",
    product_id: "p_3",
    product_name: "Sunset Orange Romper",
    product_image: "https://images.unsplash.com/photo-1471286174890-9c112ffaa5f5?w=80&h=80&fit=crop",
    customer_id: "CUST-004",
    customer_name: "Kavya Nair",
    order_item_id: null,
    rating: 1,
    text: "SCAM! Never received my order. Pathetic service. Will report to consumer forum!!!",
    status: "rejected",
    is_featured: false,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

// ==========================================
// HELPERS
// ==========================================
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export function getPendingCount(): number {
  return MOCK_REVIEWS.filter((r) => r.status === "pending").length;
}

// ==========================================
// REACT QUERY HOOKS
// ==========================================
export function useReviews(status?: ReviewStatus | "all") {
  return useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: async (): Promise<Review[]> => {
      await delay(350);
      const list = status && status !== "all"
        ? MOCK_REVIEWS.filter((r) => r.status === status)
        : [...MOCK_REVIEWS];
      return list.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ["admin-reviews-pending-count"],
    queryFn: async () => {
      await delay(200);
      return getPendingCount();
    },
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useUpdateReviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReviewStatus }) => {
      await delay(350);
      const review = MOCK_REVIEWS.find((r) => r.id === id);
      if (!review) throw new Error("Review not found");
      review.status = status;
      return review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-pending-count"] });
      const msg = data.status === "approved" ? "Review approved ✓" : "Review rejected";
      toast.success(msg);
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useToggleFeature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, featured }: { id: string; featured: boolean }) => {
      await delay(300);
      const review = MOCK_REVIEWS.find((r) => r.id === id);
      if (!review) throw new Error("Review not found");
      review.is_featured = featured;
      return review;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success(data.is_featured ? "Pinned to top of product reviews!" : "Unpinned from featured.");
    },
  });
}

export function useEditReviewText() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      await delay(300);
      const review = MOCK_REVIEWS.find((r) => r.id === id);
      if (!review) throw new Error("Review not found");
      review.text = text;
      return review;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("Review text saved (typo fix applied).");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
