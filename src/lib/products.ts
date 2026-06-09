// Mock catalog — replaced with Cloud queries in Wave 2.

export type Category = {
  slug: string;
  name: string;
  emoji: string;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewCount: number;
  sellerId: string;
  sellerName: string;
  inStock: number;
  badge?: "hot" | "new" | "deal";
  imageHue: number;
};

export const categories: Category[] = [
  { slug: "phones", name: "Phones", emoji: "📱" },
  { slug: "electronics", name: "Electronics", emoji: "💻" },
  { slug: "fashion", name: "Fashion", emoji: "👗" },
  { slug: "groceries", name: "Groceries", emoji: "🛒" },
  { slug: "home-kitchen", name: "Home & Kitchen", emoji: "🍳" },
  { slug: "beauty", name: "Beauty", emoji: "💄" },
  { slug: "power", name: "Generators & Power", emoji: "⚡" },
];

export const products: Product[] = [
  {
    id: "p_001",
    slug: "tecno-camon-20-pro-256gb",
    name: "Tecno Camon 20 Pro 256GB",
    description:
      "8GB RAM, 256GB storage, 64MP OCIS camera with night photography. Original Tecno Nigeria warranty.",
    category: "phones",
    price: 185000,
    originalPrice: 215000,
    rating: 4.8,
    reviewCount: 312,
    sellerId: "s_ibrahim",
    sellerName: "Ibrahim Gadgets",
    inStock: 24,
    badge: "deal",
    imageHue: 200,
  },
  {
    id: "p_002",
    slug: "sumec-firman-3-5kva-generator",
    name: "Sumec Firman 3.5kVA Generator",
    description:
      "Key-start, fuel-efficient, 12-hour runtime on a full tank. Powers fridge, TV, lights and fans.",
    category: "power",
    price: 410000,
    rating: 4.7,
    reviewCount: 89,
    sellerId: "s_alaba",
    sellerName: "Alaba Megastore",
    inStock: 7,
    imageHue: 28,
  },
  {
    id: "p_003",
    slug: "vlisco-premium-ankara-6yds",
    name: "Vlisco Premium Ankara (6 Yards)",
    description:
      "Authentic Hollandais wax print. Vivid, color-fast, premium cotton — perfect for ceremonial wear.",
    category: "fashion",
    price: 28500,
    rating: 4.9,
    reviewCount: 421,
    sellerId: "s_heritage",
    sellerName: "Heritage Fabrics",
    inStock: 42,
    badge: "hot",
    imageHue: 350,
  },
  {
    id: "p_004",
    slug: "gino-party-jollof-pack",
    name: "Gino Party Jollof Pack (50pcs)",
    description:
      "Curated party pack — tomato mix, curry, thyme, stock cubes. Enough for 100 guests.",
    category: "groceries",
    price: 12400,
    rating: 4.6,
    reviewCount: 156,
    sellerId: "s_mamat",
    sellerName: "Mama T Groceries",
    inStock: 120,
    imageHue: 12,
  },
  {
    id: "p_005",
    slug: "scanfrost-20l-microwave",
    name: "Scanfrost 20L Solo Microwave",
    description:
      "Compact 700W microwave with 6 power levels and child lock. 12-month warranty.",
    category: "home-kitchen",
    price: 82000,
    originalPrice: 95000,
    rating: 4.5,
    reviewCount: 67,
    sellerId: "s_eke",
    sellerName: "Eke Electronics",
    inStock: 18,
    badge: "deal",
    imageHue: 220,
  },
  {
    id: "p_006",
    slug: "nike-air-force-1-grade-a",
    name: "Nike Air Force 1 (Grade A)",
    description:
      "London-fairly used, grade-A condition. Sizes 40–46 available. Original box not included.",
    category: "fashion",
    price: 45000,
    rating: 4.4,
    reviewCount: 203,
    sellerId: "s_thrift",
    sellerName: "Thrift Lord Lagos",
    inStock: 11,
    imageHue: 0,
  },
  {
    id: "p_007",
    slug: "devon-kings-vegetable-oil-25l",
    name: "Devon King's Vegetable Oil 25L",
    description:
      "Pure vegetable oil, 25-litre keg. Sealed and dated. Wholesale pricing available.",
    category: "groceries",
    price: 54500,
    rating: 4.7,
    reviewCount: 98,
    sellerId: "s_bulk",
    sellerName: "Bulk Hub",
    inStock: 56,
    imageHue: 80,
  },
  {
    id: "p_008",
    slug: "oraimo-20000mah-powerbank",
    name: "Oraimo 20,000mAh Powerbank",
    description:
      "Fast-charge 22.5W, dual USB output, LED indicator. Charges iPhone 14 up to 4 times.",
    category: "electronics",
    price: 21000,
    originalPrice: 26500,
    rating: 4.8,
    reviewCount: 540,
    sellerId: "s_techconnect",
    sellerName: "Tech Connect",
    inStock: 88,
    badge: "hot",
    imageHue: 260,
  },
  {
    id: "p_009",
    slug: "infinix-zerobook-ultra",
    name: "Infinix ZeroBook Ultra (i7, 16GB)",
    description:
      "13th-gen Intel i7, 16GB RAM, 1TB SSD, 14” 2.8K OLED display. Brand new, sealed.",
    category: "electronics",
    price: 980000,
    rating: 4.6,
    reviewCount: 41,
    sellerId: "s_ibrahim",
    sellerName: "Ibrahim Gadgets",
    inStock: 4,
    badge: "new",
    imageHue: 240,
  },
  {
    id: "p_010",
    slug: "organic-shea-butter-500g",
    name: "Raw Organic Shea Butter 500g",
    description:
      "Unrefined northern shea butter, hand-processed. Natural moisturiser for skin and hair.",
    category: "beauty",
    price: 8000,
    rating: 4.9,
    reviewCount: 287,
    sellerId: "s_nature",
    sellerName: "Nature's Secret NG",
    inStock: 73,
    imageHue: 40,
  },
  {
    id: "p_011",
    slug: "ox-18-inch-standing-fan",
    name: "OX 18\" Standing Fan",
    description:
      "Heavy-duty 18-inch fan, 3 speeds, oscillating, timer. Quiet operation.",
    category: "home-kitchen",
    price: 32000,
    rating: 4.6,
    reviewCount: 134,
    sellerId: "s_eke",
    sellerName: "Eke Electronics",
    inStock: 22,
    imageHue: 190,
  },
  {
    id: "p_012",
    slug: "aba-leather-loafers",
    name: "Aba-Made Italian Loafers",
    description:
      "Handcrafted in Aba, full-grain leather, sizes 40–46. Built to last 5+ years.",
    category: "fashion",
    price: 15000,
    rating: 4.5,
    reviewCount: 88,
    sellerId: "s_kingsway",
    sellerName: "Kingsway Footwear",
    inStock: 35,
    imageHue: 25,
  },
];

export function formatNaira(amount: number): string {
  return "₦" + amount.toLocaleString("en-NG");
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductsByCategory(slug: string): Product[] {
  return products.filter((p) => p.category === slug);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find((c) => c.slug === slug);
}
