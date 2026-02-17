import type { FilterState, Product } from "@/lib/types";

export interface FilterResult {
  items: Product[];
  total: number;
  totalPages: number;
}

const sorters: Record<FilterState["sort"], (a: Product, b: Product) => number> = {
  // Preserve current array order for the default experience.
  default: () => 0,
  "price-asc": (a, b) => a.salePrice - b.salePrice,
  "price-desc": (a, b) => b.salePrice - a.salePrice,
  newest: (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  "best-selling": (a, b) => b.sold - a.sold
};

export const filterProducts = (products: Product[], filters: FilterState): FilterResult => {
  let filtered = [...products];

  if (filters.categories.length) {
    filtered = filtered.filter((item) => filters.categories.includes(item.category));
  }

  if (filters.sizes.length) {
    const requiredSizes = new Set(filters.sizes.map((item) => item.toLowerCase()));
    filtered = filtered.filter((item) => item.sizeOptions.some((size) => requiredSizes.has(size.toLowerCase())));
  }

  if (filters.colors.length) {
    const requiredColors = new Set(filters.colors.map((item) => item.toLowerCase()));
    filtered = filtered.filter((item) => item.colorOptions.some((color) => requiredColors.has(color.toLowerCase())));
  }

  if (filters.saleOnly) {
    filtered = filtered.filter((item) => item.salePrice < item.originalPrice);
  }

  if (filters.inStockOnly) {
    filtered = filtered.filter((item) => item.inStock);
  }

  if (filters.minRating > 0) {
    filtered = filtered.filter((item) => item.rating >= filters.minRating);
  }

  filtered = filtered.filter((item) => item.salePrice >= filters.minPrice && item.salePrice <= filters.maxPrice);

  if (filters.query.trim().length) {
    const query = filters.query.trim().toLowerCase();
    filtered = filtered.filter((item) =>
      item.name.toLowerCase().includes(query) ||
      item.sku.toLowerCase().includes(query) ||
      item.brand.toLowerCase().includes(query)
    );
  }

  filtered.sort(sorters[filters.sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.perPage));
  const safePage = Math.min(filters.page, totalPages);
  const start = (safePage - 1) * filters.perPage;
  const items = filtered.slice(start, start + filters.perPage);

  return { items, total, totalPages };
};
