import type { Metadata } from "next";
import { CartPage } from "@/components/cart-page";

export const metadata: Metadata = {
  title: "Cart",
  description: "Pitia bidhaa ulizoongeza kwenye cart na fanya checkout ya bidhaa nyingi mara moja."
};

export default function Page() {
  return <CartPage />;
}
