import Link from "next/link";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";

interface CategoryShowcaseProps {
  categories: Category[];
  products: Product[];
}

export const CategoryShowcase = ({ categories, products }: CategoryShowcaseProps) => {
  return (
    <div className="space-y-10">
      {categories.map((category) => {
        const categoryProducts = products.filter((item) => item.category === category.slug).slice(0, 6);
        if (!categoryProducts.length) return null;

        return (
          <section key={category.slug} aria-labelledby={`showcase-${category.slug}`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 id={`showcase-${category.slug}`} className="text-2xl font-black leading-none sm:text-3xl">
                {category.label}
              </h2>
              <Link
                href={`/categories/${category.slug}`}
                className="text-xs font-black uppercase tracking-[0.1em] text-[var(--primary)]"
              >
                View all
              </Link>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {categoryProducts.map((product) => (
                <div key={product.id} className="min-w-[220px] max-w-[220px] sm:min-w-[250px] sm:max-w-[250px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
};
