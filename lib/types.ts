export type CategorySlug =
  | "electronic"
  | "fashion"
  | "fashion-accessories"
  | "hardware-automobile"
  | "health-beauty"
  | "home-living";

export interface Category {
  slug: CategorySlug;
  label: string;
  description: string;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  originalPrice: number;
  salePrice: number;
  rating: number;
  inStock: boolean;
  image: string;
  gallery: string[];
  sold: number;
  isNew?: boolean;
  bestSelling?: boolean;
  descriptionSw: string;
  benefitsSw: string[];
  whoForSw: string;
  createdAt: string;
}

export interface FilterState {
  categories: CategorySlug[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  minRating: number;
  saleOnly: boolean;
  query: string;
  sort: SortKey;
  page: number;
  perPage: 28 | 56 | 84;
  view: "grid" | "list";
}

export type SortKey =
  | "default"
  | "price-asc"
  | "price-desc"
  | "newest"
  | "best-selling";

export interface OrderPayload {
  productId: string;
  quantity: number;
  fullName: string;
  phone: string;
  regionCity: string;
  address: string;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  createdAt: string;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  total: number;
}
