export type CategorySlug = string;

export interface Category {
  slug: CategorySlug;
  label: string;
  description: string;
  image: string;
}

export interface QuantityOffer {
  id: string;
  title: string;
  subtitle: string;
  paidUnits: number;
  freeUnits: number;
  badge?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: CategorySlug;
  subCategory: string;
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
  quantityOptions: QuantityOffer[];
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
  subCategories: string[];
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
export type OrderPaymentMethod = PaymentMethod | "manual";
export type PaymentStatus = "unpaid" | "pending" | "partial" | "paid" | "failed" | "pending-verification";
export type OrderStatus = "pending" | "confirmed" | "delivered" | "cancelled";

export interface OrderLineItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  paidQuantity: number;
  freeQuantity: number;
  unitPrice: number;
  originalUnitPrice: number;
  lineSubtotal: number;
  lineOriginalTotal: number;
  selectedSize: string;
  selectedColor: string;
}

export interface OrderPaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  method: OrderPaymentMethod;
  status: PaymentStatus;
  reference: string;
  trackingId: string;
  notes: string;
  createdAt: string;
  paidAt: string;
}

export interface OrderPayload {
  productId: string;
  productName: string;
  quantity: number;
  orderItems: OrderLineItem[];
  fullName: string;
  phone: string;
  phoneNormalized?: string;
  regionCity: string;
  address: string;
  selectedSize: string;
  selectedColor: string;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installmentEnabled: boolean;
  depositAmount: number;
  installmentNotes: string;
  subtotal: number;
  shippingFee: number;
  shippingLabel: string;
  shippingAdjustment: number;
  shippingAdjustmentNote: string;
  amountPaid: number;
  paymentReference?: string;
  paymentTrackingId?: string;
  lastPaymentAt?: string;
}

export interface OrderRecord extends OrderPayload {
  id: string;
  createdAt: string;
  status: OrderStatus;
  total: number;
  balanceDue: number;
  payments: OrderPaymentRecord[];
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
