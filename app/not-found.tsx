import Link from "next/link";
import { Search } from "lucide-react";
import { getCatalogProducts } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";

export default async function NotFound() {
  const products = await getCatalogProducts();
  const popularProducts = [...products].sort((a, b) => b.sold - a.sold).slice(0, 4);

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center sm:p-10">
        <p className="text-sm font-bold uppercase tracking-wide text-[var(--primary)]">404</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">Page Not Found</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Ukurasa unaotafuta haujapatikana. Tafuta bidhaa au rudi kwenye shop.</p>
        <form action="/shop" className="mx-auto mt-4 flex w-full max-w-md items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
            <input
              name="q"
              placeholder="Search products..."
              className="h-12 w-full rounded-xl border border-[var(--border)] pl-9 pr-3 text-sm"
            />
          </div>
          <button type="submit" className="min-h-12 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>
        <Link href="/shop" className="mt-3 inline-block text-sm font-semibold text-[var(--primary)]">
          Go to all products
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-2xl font-black">Popular Products</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          {popularProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </section>
  );
}
