import Image from "next/image";
import Link from "next/link";
import { categories } from "@/lib/categories";

export const CategoryNav = () => {
  return (
    <section aria-labelledby="category-title" className="py-6">
      <div className="mb-4 flex items-end justify-between">
        <h2 id="category-title" className="text-3xl font-black leading-none text-[var(--foreground)] sm:text-4xl">
          Categories
        </h2>
        <Link href="/shop" className="text-xs font-black uppercase tracking-[0.1em] text-[var(--primary)]">
          See all
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <Link key={category.slug} href={`/categories/${category.slug}`} className="group min-w-20 text-center">
            <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--border)] transition-all duration-200 group-hover:scale-105 group-hover:border-[var(--primary)] group-hover:shadow-[0_8px_20px_rgba(244,94,2,0.12)]">
              <Image
                src={category.image}
                alt={category.label}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2 text-xs font-bold text-[var(--foreground)] line-clamp-2">{category.label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
};
