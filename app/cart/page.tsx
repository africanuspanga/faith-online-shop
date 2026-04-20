import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the products in your cart and check out multiple items in one order.",
  robots: {
    index: false,
    follow: false
  }
};

export default function Page() {
  return <CartPage />;
}
