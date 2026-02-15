"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, Filter, Grid3X3, List, Search, Star, X } from "lucide-react";
import { categories } from "@/lib/categories";
import type { CategorySlug, FilterState, Product } from "@/lib/types";
import { clamp, formatTZS, parseCategories, parseSort, toPositiveNumber } from "@/lib/format";
import { filterProducts } from "@/lib/filters";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductCard } from "@/components/product-card";
import { ProductListItem } from "@/components/product-list-item";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";

interface ShopViewProps {
  products: Product[];
  forcedCategory?: CategorySlug;
}

const MIN_PRICE = 0;
const MAX_PRICE = 500000;

export const ShopView = ({ products, forcedCategory }: ShopViewProps) => {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filters = useMemo<FilterState>(() => {
    const selectedCategories = parseCategories(searchParams.get("category"));
    const forcedCategories = forcedCategory ? [forcedCategory] : selectedCategories;

    return {
      categories: forcedCategories,
      saleOnly: searchParams.get("sale") === "1",
      inStockOnly: searchParams.get("stock") === "1",
      minPrice: clamp(toPositiveNumber(searchParams.get("min"), MIN_PRICE), MIN_PRICE, MAX_PRICE),
      maxPrice: clamp(toPositiveNumber(searchParams.get("max"), MAX_PRICE), MIN_PRICE, MAX_PRICE),
      minRating: clamp(toPositiveNumber(searchParams.get("rating"), 0), 0, 5),
      sort: parseSort(searchParams.get("sort")),
      page: clamp(toPositiveNumber(searchParams.get("page"), 1), 1, 999),
      perPage: [28, 56, 84].includes(Number(searchParams.get("perPage")))
        ? (Number(searchParams.get("perPage")) as 28 | 56 | 84)
        : 28,
      query: searchParams.get("q") ?? "",
      view: searchParams.get("view") === "list" ? "list" : "grid"
    };
  }, [searchParams, forcedCategory]);

  const { items, total, totalPages } = useMemo(() => filterProducts(products, filters), [products, filters]);

  const safePage = Math.min(filters.page, totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * filters.perPage + 1;
  const end = Math.min(total, safePage * filters.perPage);

  const activeFilterCount =
    (forcedCategory ? 0 : filters.categories.length) +
    (filters.saleOnly ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.minRating > 0 ? 1 : 0) +
    (filters.minPrice > MIN_PRICE || filters.maxPrice < MAX_PRICE ? 1 : 0);

  const buildHref = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  };

  const updateParams = (updates: Record<string, string | null>) => {
    router.replace(buildHref(updates), { scroll: false });
  };

  const toggleCategory = (slug: CategorySlug) => {
    if (forcedCategory) return;
    const next = filters.categories.includes(slug)
      ? filters.categories.filter((item) => item !== slug)
      : [...filters.categories, slug];

    updateParams({
      category: next.length ? next.join(",") : null,
      page: "1"
    });
  };

  const clearFilters = () => {
    updateParams({
      category: forcedCategory ? forcedCategory : null,
      sale: null,
      stock: null,
      rating: null,
      min: null,
      max: null,
      sort: null,
      page: null,
      perPage: null,
      view: null,
      q: searchParams.get("q")
    });
  };

  const filtersPanel = (
    <div className="space-y-6">
      {!forcedCategory ? (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide">Category</h3>
          <div className="mt-3 grid grid-cols-1 gap-2">
            {categories.map((category) => (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className={`flex min-h-11 items-center justify-between rounded-xl border px-3 text-left text-sm font-semibold transition ${
                  filters.categories.includes(category.slug)
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]/50"
                }`}
              >
                <span>{category.label}</span>
                {filters.categories.includes(category.slug) ? <span className="text-xs font-black">ON</span> : null}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide">Price Range</h3>
        <div className="mt-4 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          <div>
            <label htmlFor="min-price" className="mb-1 block text-xs font-semibold text-[var(--muted)]">
              Minimum: {formatTZS(filters.minPrice)}
            </label>
            <input
              id="min-price"
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={5000}
              value={filters.minPrice}
              onChange={(event) => updateParams({ min: event.target.value, page: "1" })}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          <div>
            <label htmlFor="max-price" className="mb-1 block text-xs font-semibold text-[var(--muted)]">
              Maximum: {formatTZS(filters.maxPrice)}
            </label>
            <input
              id="max-price"
              type="range"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={5000}
              value={filters.maxPrice}
              onChange={(event) => updateParams({ max: event.target.value, page: "1" })}
              className="w-full accent-[var(--primary)]"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide">Stock</h3>
        <Checkbox
          id="stock-only"
          checked={filters.inStockOnly}
          onChange={(value) => updateParams({ stock: value ? "1" : null, page: "1" })}
          label="In stock only"
          className="mt-3"
        />
      </section>

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide">Rating</h3>
        <div className="mt-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
          {[4, 3, 2].map((value) => (
            <label key={value} className="inline-flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="radio"
                name="rating"
                checked={filters.minRating === value}
                onChange={() => updateParams({ rating: String(value), page: "1" })}
                className="h-4 w-4 accent-[var(--primary)]"
              />
              <span className="inline-flex items-center gap-1">
                {value}+ <Star className="h-3.5 w-3.5 fill-[var(--secondary)] text-[var(--secondary)]" />
              </span>
            </label>
          ))}
          <button
            type="button"
            className="block text-xs font-semibold text-[var(--primary)]"
            onClick={() => updateParams({ rating: null, page: "1" })}
          >
            Clear rating
          </button>
        </div>
      </section>

      <section>
        <Checkbox
          id="sale-only"
          checked={filters.saleOnly}
          onChange={(value) => updateParams({ sale: value ? "1" : null, page: "1" })}
          label="Show only products on sale"
        />
      </section>

      {activeFilterCount > 0 ? (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          Clear All Filters
        </Button>
      ) : null}
    </div>
  );

  return (
    <div className="space-y-5">
      {!forcedCategory ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const active = filters.categories.includes(category.slug);
            return (
              <button
                key={category.slug}
                type="button"
                onClick={() => toggleCategory(category.slug)}
                className={`rounded-full border px-4 py-2 text-xs font-bold shadow-sm transition sm:text-sm ${
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--primary)]/50"
                }`}
              >
                {category.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-bold"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${sidebarOpen ? "rotate-180" : ""}`} />
            Filters
          </button>
          {sidebarOpen ? (
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-[0_8px_24px_rgba(244,94,2,0.08)]">
              {filtersPanel}
            </div>
          ) : null}
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-[var(--border)] bg-white p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3 sm:text-sm">
              <p className="mr-auto font-semibold text-[var(--muted)]">
                Showing {start}-{end} of {total} results
              </p>

              <label className="inline-flex items-center gap-2 text-xs font-semibold sm:text-sm">
                <input
                  type="checkbox"
                  checked={filters.saleOnly}
                  onChange={(event) => updateParams({ sale: event.target.checked ? "1" : null, page: "1" })}
                  className="h-4 w-4 accent-[var(--primary)]"
                />
                Show only products on sale
              </label>

              <div className="relative w-full sm:w-auto sm:min-w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  value={filters.query}
                  onChange={(event) => updateParams({ q: event.target.value || null, page: "1" })}
                  placeholder="Search products..."
                  className="h-11 w-full rounded-lg border border-[var(--border)] pl-9 pr-3"
                  aria-label="Search products in shop"
                />
              </div>

              <select
                value={String(filters.perPage)}
                onChange={(event) => updateParams({ perPage: event.target.value, page: "1" })}
                className="h-11 rounded-lg border border-[var(--border)] px-3"
                aria-label="Items per page"
              >
                <option value="28">28</option>
                <option value="56">56</option>
                <option value="84">84</option>
              </select>

              <select
                value={filters.sort}
                onChange={(event) => updateParams({ sort: event.target.value, page: "1" })}
                className="h-11 rounded-lg border border-[var(--border)] px-3"
                aria-label="Sort products"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="newest">Newest</option>
                <option value="best-selling">Best Selling</option>
              </select>

              <div className="inline-flex items-center rounded-lg border border-[var(--border)]">
                <button
                  type="button"
                  aria-label="Grid view"
                  onClick={() => updateParams({ view: null })}
                  className={`inline-flex h-11 w-11 items-center justify-center ${filters.view === "grid" ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="List view"
                  onClick={() => updateParams({ view: "list" })}
                  className={`inline-flex h-11 w-11 items-center justify-center ${filters.view === "list" ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              <Button variant="outline" onClick={() => setDrawerOpen(true)} className="lg:hidden">
                <Filter className="mr-2 h-4 w-4" /> FILTER {activeFilterCount > 0 ? `(${activeFilterCount})` : ""}
              </Button>
            </div>
          </div>

          <div className="transition-opacity duration-300">
            {items.length === 0 ? (
              <EmptyState />
            ) : filters.view === "grid" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          <Pagination
            totalPages={totalPages}
            currentPage={safePage}
            createPageLink={(page) => buildHref({ page: String(page) })}
          />
        </section>
      </div>

      <div
        className={`fixed inset-0 z-50 bg-black/35 transition-opacity lg:hidden ${drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setDrawerOpen(false)}
      >
        <aside
          className={`absolute right-0 top-0 h-full w-full max-w-sm overflow-y-auto bg-white p-5 transition-transform ${drawerOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black">Filters</h2>
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close filters">
              <X className="h-5 w-5" />
            </Button>
          </div>
          {filtersPanel}
        </aside>
      </div>
    </div>
  );
};
