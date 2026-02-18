import type { OrderPaymentRecord, OrderRecord, ProductReview } from "@/lib/types";

export const memoryOrders: OrderRecord[] = [];
export const memoryOrderPayments: OrderPaymentRecord[] = [];
export const memoryReviews: ProductReview[] = [];

export type MemorySignup = {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  createdAt: string;
};

export type MemoryVisit = {
  id: string;
  path: string;
  referrer: string;
  userAgent: string;
  createdAt: string;
};

export const memorySignups: MemorySignup[] = [];
export const memoryVisits: MemoryVisit[] = [];
