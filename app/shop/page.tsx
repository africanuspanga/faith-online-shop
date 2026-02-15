import type { Metadata } from "next";
import { ShopView } from "@/components/shop-view";
import { getCatalogProducts } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop All Products | Faith Online Shop Tanzania",
  description:
    "Nunua bidhaa zote za Faith Online Shop kwa bei nafuu: electronics, fashion, health & beauty, hardware, na home living. Pata usafiri BURE."
};

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const products = await getCatalogProducts();

  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-black sm:text-4xl">All Products</h1>
      <ShopView products={products} />
    </section>
  );
}
