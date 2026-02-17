import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { categories } from "@/lib/categories";
import { getCatalogCategories, getCatalogProducts } from "@/lib/catalog";
import type { CategorySlug } from "@/lib/types";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ShopView } from "@/components/shop-view";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const catalogCategories = await getCatalogCategories();
  const category = catalogCategories.find((item) => item.slug === (slug as CategorySlug));

  if (!category) {
    return { title: "Category Not Found" };
  }

  return {
    title: `${category.label} | Faith Online Shop`,
    description: `${category.description} Nunua ${category.label} kwa usafiri wa uhakika Tanzania nzima na chagua njia ya malipo unayotaka.`
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const catalogCategories = await getCatalogCategories();
  const category = catalogCategories.find((item) => item.slug === (slug as CategorySlug));
  const products = await getCatalogProducts();

  if (!category) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Categories", href: "/shop" }, { label: category.label }]} />
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h1 className="text-3xl font-black sm:text-4xl">{category.label}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">{category.description}</p>
      </div>

      <ShopView products={products} forcedCategory={category.slug} />
    </section>
  );
}
