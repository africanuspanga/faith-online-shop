export type CategorySlug = string;

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
  sku: string;
  brand: string;
  originalPrice: number;
  salePrice: number;
  rating: number;
  inStock: boolean;
  image: string;
  gallery: string[];
  sizeOptions: string[];
  colorOptions: string[];
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
  sizes: string[];
  colors: string[];
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

export type PaymentMethod = "cash-on-delivery" | "pesapal" | "bank-deposit";
export type PaymentStatus = "unpaid" | "pending" | "partial" | "paid" | "failed" | "pending-verification";
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface OrderPayload {
  productId: string;
  productName: string;
  quantity: number;
  fullName: string;
  phone: string;
  regionCity: string;
  address: string;
  selectedSize: string;
  selectedColor: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installmentEnabled: boolean;
  depositAmount: number;
  installmentNotes: string;
  paymentReference?: string;
  paymentTrackingId?: string;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
}

export interface ProductReview {
  id: string;
  orderId: string;
  productId: string;
  rating: number;
  comment: string;
  customerName: string;
  createdAt: string;
}
