import { categoryMap } from "@/lib/categories";
import { products as staticProducts } from "@/lib/products";
import { getSupabaseServerClient } from "@/lib/supabase";
import type { CategorySlug, Product } from "@/lib/types";

type DatabaseProductRow = {
  id: string;
  name: string;
  slug: string | null;
  category: string;
  original_price: number;
  sale_price: number;
  image: string | null;
  in_stock: boolean | null;
  rating: number | null;
  gallery: string[] | string | null;
  sold: number | null;
  is_new: boolean | null;
  best_selling: boolean | null;
  description_sw: string | null;
  benefits_sw: string[] | string | null;
  who_for_sw: string | null;
  created_at: string | null;
};

const fallbackImage = "/placeholder.svg";
const staticImageBySlug = new Map(staticProducts.map((item) => [item.slug, item.image]));

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
const toLocalPath = (value: string) => {
  if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
    return value;
  }
  return `/${value}`;
};

const normalizeImageSource = (value: string | null | undefined, slug: string) => {
  const raw = value?.trim() ?? "";
  if (!raw || raw.includes("/placeholder.svg")) {
    return staticImageBySlug.get(slug) ?? fallbackImage;
  }
  return toLocalPath(raw);
};

const normalizeCategory = (value: string): CategorySlug => {
  const candidate = value.trim().toLowerCase() as CategorySlug;
  if (categoryMap.has(candidate)) {
    return candidate;
  }
  return "electronic";
};

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
  const gallery = toStringArray(row.gallery);
  const benefitsSw = toStringArray(row.benefits_sw);
  const image = normalizeImageSource(row.image, slug);
  const normalizedGallery = gallery.map((item) => toLocalPath(item));
  const salePrice = Number(row.sale_price) || 0;
  const originalPrice = Number(row.original_price) || salePrice;

  return {
    id: String(row.id),
    name: row.name,
    slug,
    category,
    originalPrice,
    salePrice,
    rating: Number(row.rating ?? 4.5),
    inStock: Boolean(row.in_stock ?? true),
    image,
    gallery: normalizedGallery.length ? normalizedGallery : [image, image, image],
    sold: Number(row.sold ?? 0),
    isNew: Boolean(row.is_new ?? false),
    bestSelling: Boolean(row.best_selling ?? false),
    descriptionSw: row.description_sw?.trim() || "Bidhaa bora kwa matumizi ya kila siku, usafirishaji bure Tanzania nzima.",
    benefitsSw: benefitsSw.length
      ? benefitsSw
      : [
          "Ubora wa juu uliothibitishwa",
          "Malipo baada ya kupokea bidhaa",
          "Usafirishaji bure Tanzania nzima"
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
