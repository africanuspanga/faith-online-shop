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

const normalizeSearchText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const tokenize = (value: string) => normalizeSearchText(value).split(/\s+/).filter(Boolean);

const levenshteinDistance = (left: string, right: string) => {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);

  for (let col = 1; col <= right.length; col += 1) {
    let previous = rows[0];
    rows[0] = col;

    for (let row = 1; row <= left.length; row += 1) {
      const current = rows[row];
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        previous + cost
      );
      previous = current;
    }
  }

  return rows[left.length];
};

const isLooseTokenMatch = (queryToken: string, candidateToken: string) => {
  if (!queryToken || !candidateToken) return false;
  if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) return true;

  const threshold = queryToken.length <= 4 ? 1 : queryToken.length <= 8 ? 2 : 3;
  if (Math.abs(candidateToken.length - queryToken.length) > threshold) return false;

  return levenshteinDistance(queryToken, candidateToken) <= threshold;
};

const productMatchesQuery = (product: Product, query: string) => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const searchTerms = tokenize(normalizedQuery);
  if (!searchTerms.length) return true;

  const searchableText = normalizeSearchText(
    [
      product.name,
      product.sku,
      product.brand,
      product.category,
      product.subCategory,
      product.descriptionSw,
      product.whoForSw,
      ...product.benefitsSw,
      ...product.sizeOptions,
      ...product.colorOptions
    ].join(" ")
  );

  const searchableTokens = [...new Set(tokenize(searchableText))];

  return searchTerms.every((term) => {
    if (searchableText.includes(term)) return true;
    return searchableTokens.some((candidate) => isLooseTokenMatch(term, candidate));
  });
};

export const filterProducts = (products: Product[], filters: FilterState): FilterResult => {
  let filtered = [...products];

  if (filters.categories.length) {
    filtered = filtered.filter((item) => filters.categories.includes(item.category));
  }

  if (filters.subCategories.length) {
    const requiredSubCategories = new Set(filters.subCategories.map((item) => item.toLowerCase()));
    filtered = filtered.filter((item) => requiredSubCategories.has(item.subCategory.toLowerCase()));
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
    filtered = filtered.filter((item) => productMatchesQuery(item, filters.query));
  }

  filtered.sort(sorters[filters.sort]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.perPage));
  const safePage = Math.min(filters.page, totalPages);
  const start = (safePage - 1) * filters.perPage;
  const items = filtered.slice(start, start + filters.perPage);

  return { items, total, totalPages };
};
