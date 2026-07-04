import img1 from "@/assets/IMG_0815.jpeg.asset.json";
import img2 from "@/assets/IMG_0816.jpeg.asset.json";
import img3 from "@/assets/IMG_0819.jpeg.asset.json";
import img4 from "@/assets/IMG_1253.jpeg.asset.json";
import img5 from "@/assets/IMG_2691.jpeg.asset.json";
import img6 from "@/assets/IMG_2693.jpeg.asset.json";
import img7 from "@/assets/IMG_2694.jpeg.asset.json";
import img8 from "@/assets/IMG_2696.jpeg.asset.json";
import img9 from "@/assets/IMG_2707.jpeg.asset.json";
import k1 from "@/assets/KVR00022.jpg.asset.json";
import k2 from "@/assets/KVR00026.jpg.asset.json";
import k3 from "@/assets/KVR00058.jpg.asset.json";
import k4 from "@/assets/KVR00114.jpg.asset.json";
import k5 from "@/assets/KVR00130.jpg.asset.json";
import k6 from "@/assets/KVR00145.jpg.asset.json";
import k7 from "@/assets/KVR00238.jpg.asset.json";
import k8 from "@/assets/KVR00248.jpg.asset.json";
import k9 from "@/assets/KVR00361.jpg.asset.json";

export type Product = {
  slug: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  gallery: string[];
  category: "kurta" | "shirt" | "ethnic" | "party";
  gender: "boys" | "girls" | "unisex";
  ageRange: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  tag?: "new" | "bestseller" | "sale";
  description: string;
  fabric: string;
  care: string;
};

const sizes = ["0-1Y", "1-2Y", "2-3Y", "3-4Y", "4-5Y", "5-6Y", "6-7Y"];

export const products: Product[] = [
  {
    slug: "sunrise-block-print-kurta",
    name: "Sunrise Block-Print Kurta",
    price: 799,
    compareAt: 999,
    image: img3.url,
    gallery: [img3.url, img1.url, img2.url],
    category: "kurta",
    gender: "boys",
    ageRange: "6M – 7Y",
    sizes,
    colors: [
      { name: "Terracotta", hex: "#b4442b" },
      { name: "Indigo", hex: "#2c3e8f" },
    ],
    tag: "bestseller",
    description:
      "Hand block-printed on breathable cotton — a cheerful mandarin-collar kurta perfect for pujas, playdates and picture day.",
    fabric: "100% soft cotton",
    care: "Machine wash cold, tumble dry low",
  },
  {
    slug: "midnight-leaf-mandarin-kurta",
    name: "Midnight Leaf Mandarin Kurta",
    price: 899,
    image: img6.url,
    gallery: [img6.url, img7.url, img5.url],
    category: "ethnic",
    gender: "boys",
    ageRange: "1Y – 7Y",
    sizes,
    colors: [
      { name: "Royal Blue", hex: "#2937b3" },
      { name: "Emerald", hex: "#0f6e4c" },
    ],
    tag: "new",
    description:
      "Textured self-check weave with metallic silver leaf motifs. Coconut buttons and a stand collar make this our little gentleman favourite.",
    fabric: "Cotton blend jacquard",
    care: "Gentle wash, iron on reverse",
  },
  {
    slug: "sunshine-cotton-shirt",
    name: "Sunshine Cotton Shirt",
    price: 649,
    compareAt: 799,
    image: img4.url,
    gallery: [img4.url, img8.url, img9.url],
    category: "shirt",
    gender: "unisex",
    ageRange: "6M – 6Y",
    sizes,
    colors: [
      { name: "Buttercup", hex: "#f5c443" },
      { name: "Sky", hex: "#7ec6e0" },
    ],
    tag: "sale",
    description:
      "Everyday cotton shirt in cheerful mini-prints. Roomy fit, coconut buttons, and a curved hem for happy tummies.",
    fabric: "100% breathable cotton",
    care: "Machine wash cold",
  },
  {
    slug: "party-pop-festive-set",
    name: "Party Pop Festive Set",
    price: 1299,
    image: img5.url,
    gallery: [img5.url, img2.url, img6.url],
    category: "party",
    gender: "boys",
    ageRange: "1Y – 7Y",
    sizes,
    colors: [
      { name: "Wine", hex: "#7b2b3b" },
      { name: "Ivory", hex: "#f2ead7" },
    ],
    tag: "new",
    description:
      "A two-piece festive kurta set that keeps up with cake fights and photo booths. Soft on skin, brilliant on camera.",
    fabric: "Cotton silk",
    care: "Dry clean recommended",
  },
  {
    slug: "little-explorer-check-shirt",
    name: "Little Explorer Check Shirt",
    price: 599,
    image: img7.url,
    gallery: [img7.url, img8.url, img1.url],
    category: "shirt",
    gender: "boys",
    ageRange: "1Y – 7Y",
    sizes,
    colors: [{ name: "Pine", hex: "#2e5744" }],
    description:
      "Classic gingham check with a soft-brushed finish. Made for tree-climbing, story-time and everything in between.",
    fabric: "Cotton flannel",
    care: "Machine wash cold",
  },
  {
    slug: "cocoa-heritage-kurta-pyjama",
    name: "Cocoa Heritage Kurta-Pyjama",
    price: 1099,
    image: img8.url,
    gallery: [img8.url, img9.url, img3.url],
    category: "ethnic",
    gender: "boys",
    ageRange: "2Y – 7Y",
    sizes,
    colors: [{ name: "Cocoa", hex: "#6b4a2b" }],
    tag: "bestseller",
    description:
      "A heritage-inspired kurta-pyjama in warm cocoa tones. Handloom cotton that gets softer with every wash.",
    fabric: "Handloom cotton",
    care: "Hand wash for best care",
  },
  {
    slug: "meadow-mint-shirt",
    name: "Meadow Mint Shirt",
    price: 699,
    image: img9.url,
    gallery: [img9.url, img4.url, img7.url],
    category: "shirt",
    gender: "unisex",
    ageRange: "6M – 6Y",
    sizes,
    colors: [{ name: "Meadow", hex: "#8fc3a5" }],
    tag: "new",
    description:
      "Soft mint with a tiny floral all-over print. A go-to for brunches and grandparent visits.",
    fabric: "Cotton poplin",
    care: "Machine wash cold",
  },
  {
    slug: "blossom-blush-frock",
    name: "Blossom Blush Frock",
    price: 949,
    compareAt: 1199,
    image: k1.url,
    gallery: [k1.url, k2.url, k3.url],
    category: "party",
    gender: "girls",
    ageRange: "6M – 6Y",
    sizes,
    colors: [{ name: "Blush", hex: "#f2b8b5" }],
    tag: "sale",
    description:
      "A twirl-worthy frock with delicate lace trim and a soft cotton lining that keeps little ones comfy all day.",
    fabric: "Cotton with tulle overlay",
    care: "Gentle wash, air dry",
  },
  {
    slug: "buttercup-tea-dress",
    name: "Buttercup Tea Dress",
    price: 849,
    image: k2.url,
    gallery: [k2.url, k4.url, k5.url],
    category: "party",
    gender: "girls",
    ageRange: "1Y – 7Y",
    sizes,
    colors: [{ name: "Buttercup", hex: "#f5c443" }],
    description:
      "Sunny yellow tea dress with a smocked bodice — made for garden birthdays and afternoon adventures.",
    fabric: "Cotton voile",
    care: "Machine wash gentle",
  },
  {
    slug: "sky-stripe-romper",
    name: "Sky Stripe Romper",
    price: 749,
    image: k3.url,
    gallery: [k3.url, k6.url, k4.url],
    category: "shirt",
    gender: "unisex",
    ageRange: "0-1Y – 2Y",
    sizes: sizes.slice(0, 4),
    colors: [{ name: "Sky", hex: "#7ec6e0" }],
    tag: "bestseller",
    description:
      "Soft striped romper with easy snap closures — nap-approved, parent-approved.",
    fabric: "Organic cotton knit",
    care: "Machine wash cold",
  },
  {
    slug: "lilac-day-dreamer-set",
    name: "Lilac Day-Dreamer Set",
    price: 999,
    image: k4.url,
    gallery: [k4.url, k7.url, k8.url],
    category: "party",
    gender: "girls",
    ageRange: "1Y – 6Y",
    sizes,
    colors: [{ name: "Lilac", hex: "#c9b3e0" }],
    tag: "new",
    description:
      "A dreamy lilac co-ord set with tiny embroidered stars. Soft, breathable, and utterly adorable.",
    fabric: "Cotton muslin",
    care: "Gentle wash",
  },
  {
    slug: "sunny-picnic-shirt",
    name: "Sunny Picnic Shirt",
    price: 629,
    image: k5.url,
    gallery: [k5.url, k9.url, k6.url],
    category: "shirt",
    gender: "boys",
    ageRange: "1Y – 6Y",
    sizes,
    colors: [{ name: "Sunny", hex: "#f4b23a" }],
    description:
      "A cheery button-down with playful prints — light enough for summer, warm enough for spring.",
    fabric: "Cotton poplin",
    care: "Machine wash cold",
  },
];

export const featured = products.slice(0, 8);

export const findProduct = (slug: string) =>
  products.find((p) => p.slug === slug);

export const categories = [
  { slug: "kurta", label: "Kurtas", emoji: "🌼" },
  { slug: "shirt", label: "Shirts", emoji: "☀️" },
  { slug: "ethnic", label: "Ethnic", emoji: "🪁" },
  { slug: "party", label: "Party", emoji: "🎈" },
] as const;
