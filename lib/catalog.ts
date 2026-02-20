import { categories as defaultCategories, createFallbackCategory, mergeCategories, normalizeCategorySlug } from "@/lib/categories";
import { products as staticProducts } from "@/lib/products";
import { defaultQuantityOffers, toQuantityOffers } from "@/lib/quantity-offers";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { Category, CategorySlug, Product } from "@/lib/types";

type DatabaseProductRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  sub_category: string | null;
  sku: string | null;
  brand: string | null;
  original_price: number;
  sale_price: number;
  image: string | null;
  in_stock: boolean | null;
  rating: number | null;
  gallery: string[] | string | null;
  size_options: string[] | string | null;
  color_options: string[] | string | null;
  quantity_options: unknown;
  sold: number | null;
  is_new: boolean | null;
  best_selling: boolean | null;
  description_sw: string | null;
  benefits_sw: string[] | string | null;
  who_for_sw: string | null;
  created_at: string | null;
};

const fallbackImage = "/placeholder.svg";
const placeholderPattern = /(^|\/)placeholder\.svg(?:[?#].*)?$/i;
const staticImageBySlug = new Map(staticProducts.map((item) => [item.slug, item.image]));
const staticProductBySlug = new Map(staticProducts.map((item) => [item.slug, item]));

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
const toLocalPath = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return fallbackImage;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  if (/^[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return `/${trimmed}`;
};

const isPlaceholderImage = (value: string | null | undefined) => {
  const raw = value?.trim() ?? "";
  return !raw || placeholderPattern.test(raw);
};

const normalizeImageSource = (value: string | null | undefined, slug: string, gallery: string[]) => {
  const raw = value?.trim() ?? "";
  if (isPlaceholderImage(raw)) {
    const galleryFallback = gallery.find((item) => !isPlaceholderImage(item));
    if (galleryFallback) {
      return galleryFallback;
    }
    return staticImageBySlug.get(slug) ?? fallbackImage;
  }
  return toLocalPath(raw);
};

const normalizeCategory = (value: string): CategorySlug => normalizeCategorySlug(value) || "electronic";

const toStringArray = (value: string[] | string | null | undefined): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }
  const normalized = value.trim();
  if (!normalized) return [];
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    try {
      const parsed = JSON.parse(normalized);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      return [];
    }
  }
  return normalized
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeDatabaseProduct = (row: DatabaseProductRow): Product => {
  const category = normalizeCategory(row.category);
  const slug = row.slug?.trim() || slugify(row.name);
  const staticProduct = staticProductBySlug.get(slug);
  const gallery = toStringArray(row.gallery);
  const benefitsSw = toStringArray(row.benefits_sw);
  const sizeOptions = toStringArray(row.size_options);
  const colorOptions = toStringArray(row.color_options);
  const quantityOptions = toQuantityOffers(row.quantity_options ?? staticProduct?.quantityOptions ?? defaultQuantityOffers);
  const normalizedGallery = gallery.map((item) => toLocalPath(item));
  const image = normalizeImageSource(row.image, slug, normalizedGallery);
  const salePrice = Number(row.sale_price) || 0;
  const originalPrice = Number(row.original_price) || salePrice;

  return {
    id: String(row.id),
    name: row.name,
    slug,
    category,
    subCategory: normalizeCategorySlug(row.sub_category ?? "") || staticProduct?.subCategory || "",
    sku: row.sku?.trim() || staticProduct?.sku || `SKU-${String(row.id).slice(0, 8).toUpperCase()}`,
    brand: row.brand?.trim() || staticProduct?.brand || "Faith Select",
    originalPrice,
    salePrice,
    rating: Number(row.rating ?? 4.5),
    inStock: Boolean(row.in_stock ?? true),
    image,
    gallery: normalizedGallery.length ? normalizedGallery : [image, image, image],
    sizeOptions: sizeOptions.length ? sizeOptions : (staticProduct?.sizeOptions ?? []),
    colorOptions: colorOptions.length ? colorOptions : (staticProduct?.colorOptions ?? []),
    quantityOptions,
    sold: Number(row.sold ?? 0),
    isNew: Boolean(row.is_new ?? false),
    bestSelling: Boolean(row.best_selling ?? false),
    descriptionSw: row.description_sw?.trim() || "Bidhaa bora kwa matumizi ya kila siku, tunafikisha Tanzania nzima kwa gharama nafuu.",
    benefitsSw: benefitsSw.length
      ? benefitsSw
      : [
          "Ubora wa juu uliothibitishwa",
          "Malipo baada ya kupokea bidhaa",
          "Tunafikisha oda Tanzania nzima kwa gharama nafuu ya usafiri"
        ],
    whoForSw: row.who_for_sw?.trim() || "Inafaa kwa mtu yeyote anayehitaji bidhaa bora kwa bei nafuu.",
    createdAt: row.created_at ?? new Date().toISOString()
  };
};

const dedupeBySlug = (items: Product[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
};

const categoriesFromProducts = (items: Product[]): Category[] => {
  const existing = new Map(defaultCategories.map((item) => [item.slug, item]));
  const generated: Category[] = [];

  items.forEach((item) => {
    const slug = normalizeCategory(item.category);
    if (existing.has(slug)) {
      generated.push(existing.get(slug) as Category);
      return;
    }
    generated.push(createFallbackCategory(slug));
  });

  return generated;
};

export const getCatalogProducts = async (): Promise<Product[]> => {
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return staticProducts;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data?.length) {
    return staticProducts;
  }

  const normalizedDynamic = data.map((row) => normalizeDatabaseProduct(row as DatabaseProductRow));
  return dedupeBySlug([...normalizedDynamic, ...staticProducts]);
};

export const getCatalogProductById = async (id: string): Promise<Product | undefined> => {
  const normalized = id.trim();
  if (!normalized) return undefined;

  const catalog = await getCatalogProducts();
  return catalog.find((item) => item.id === normalized);
};

export const getCatalogCategories = async (): Promise<Category[]> => {
  const catalog = await getCatalogProducts();
  return mergeCategories(defaultCategories, categoriesFromProducts(catalog));
};
