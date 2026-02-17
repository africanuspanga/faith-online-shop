import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getCatalogCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop by Category | Faith Online Shop",
  description:
    "Chagua category unayotaka kuona bidhaa zake kwenye Faith Online Shop."
};

export default async function CategoriesIndexPage() {
  const categories = await getCatalogCategories();

  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-black sm:text-4xl">All Categories</h1>
      <p className="text-sm text-[var(--muted)]">Chagua category unayotaka kuona bidhaa zake.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/categories/${category.slug}`}
            className="rounded-2xl border border-[var(--border)] bg-white p-3 text-center transition hover:-translate-y-0.5 hover:border-[var(--primary)] hover:shadow-[0_8px_24px_rgba(244,94,2,0.10)]"
          >
            <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--border)]">
              <Image src={category.image} alt={category.label} width={80} height={80} className="h-full w-full object-cover" />
            </div>
            <p className="mt-2 text-xs font-bold sm:text-sm">{category.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
