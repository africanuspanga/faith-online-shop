import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CartCheckoutForm } from "@/components/cart-checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Kamilisha oda ya bidhaa zako zote ulizoweka kwenye cart kwa malipo salama."
};

export default function Page() {
  return (
    <section className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Cart", href: "/cart" },
          { label: "Checkout" }
        ]}
      />
      <CartCheckoutForm />
    </section>
  );
}
