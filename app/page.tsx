import type { Metadata } from "next";
import { CategoryNav } from "@/components/category-nav";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductCard } from "@/components/product-card";
import { CategoryShowcase } from "@/components/category-showcase";
import { TrustBar } from "@/components/trust-bar";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";
import { serviceHours } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Faith Online Shop Tanzania | Agiza Sasa, Lipa Ukipokea",
  description:
    "Faith Online Shop Tanzania: Electronics, Fashion, Beauty, Home & Living. Usafiri wa uhakika Tanzania nzima na malipo COD, Pesapal, au Bank Deposit."
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getCatalogProducts();
  const categoryItems = await getCatalogCategories();
  const featured = products.slice(0, 12);

  return (
    <div className="space-y-10">
      <HeroCarousel />
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center text-xs font-semibold text-[var(--foreground)] sm:text-sm">
        Usafiri Tanzania Nzima | COD • Pesapal • Bank Deposit | Bidhaa Bora Tu
      </section>
      <CategoryNav items={categoryItems} />

      <section aria-labelledby="featured-title">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Weekly Picks</p>
            <h2 id="featured-title" className="text-3xl font-black leading-none sm:text-4xl">
              Featured Products
            </h2>
          </div>
          <p className="hidden text-xs font-semibold text-[var(--muted)] sm:block">Best pricing this week</p>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {featured.map((product, index) => (
            <div key={product.id} className="animate-[fadeUp_.35s_ease-out_forwards]" style={{ animationDelay: `${index * 28}ms` }}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
        <div className="grid gap-2 text-xs font-bold uppercase tracking-wide text-[var(--foreground)] sm:grid-cols-3 sm:text-sm">
          <p className="rounded-xl bg-white px-3 py-2 text-center">Cash on Delivery</p>
          <p className="rounded-xl bg-white px-3 py-2 text-center">Usafiri wa Uhakika Tanzania Nzima</p>
          <p className="rounded-xl bg-white px-3 py-2 text-center">Customer Support {serviceHours}</p>
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[var(--primary)]">Browse Fast</p>
          <h2 className="text-3xl font-black leading-none sm:text-4xl">
            Category Collections
          </h2>
        </div>
        <CategoryShowcase products={products} slugs={["electronic", "health-beauty", "home-living"]} />
      </section>

      <TrustBar />
    </div>
  );
}
