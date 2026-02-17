import type { CategorySlug, SortKey } from "@/lib/types";
import { normalizeCategorySlug } from "@/lib/categories";

const tzsFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const formatTZS = (value: number): string => `TZS ${tzsFormatter.format(value)}`;

export const parseCategories = (value: string | null): CategorySlug[] => {
  if (!value) return [];
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => normalizeCategorySlug(item))
    .filter((item): item is CategorySlug => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

export const parseSort = (value: string | null): SortKey => {
  const allowed: SortKey[] = ["default", "price-asc", "price-desc", "newest", "best-selling"];
  if (value && allowed.includes(value as SortKey)) {
    return value as SortKey;
  }
  return "default";
};

export const toPositiveNumber = (value: string | null, fallback: number): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
};

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
