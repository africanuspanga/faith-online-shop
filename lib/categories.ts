import type { Category } from "@/lib/types";

const fallbackCategoryImage = "/placeholder.svg";

const toTitleCase = (value: string) =>
  value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const normalizeCategorySlug = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const createFallbackCategory = (slug: string): Category => {
  const normalized = normalizeCategorySlug(slug);
  const label = toTitleCase(normalized || "General");
  return {
    slug: normalized || "general",
    label,
    description: `Bidhaa za ${label} kwa ubora na bei rafiki.`,
    image: fallbackCategoryImage
  };
};

export const categories: Category[] = [
  {
    slug: "electronic",
    label: "Electronic",
    description: "Vifaa vya kisasa vya kidijitali kwa matumizi ya kila siku.",
    image: "/116plus-smart-watch.webp"
  },
  {
    slug: "fashion",
    label: "Fashion",
    description: "Mavazi ya kisasa kwa muonekano wa kujiamini.",
    image: "/black-hoodie-streetwear.webp"
  },
  {
    slug: "fashion-accessories",
    label: "Fashion & Accessories",
    description: "Saa, miwani, na mifuko inayokamilisha mtindo wako.",
    image: "/womens-crossbody-bag.webp"
  },
  {
    slug: "hardware-automobile",
    label: "Hardware & Automobile",
    description: "Vifaa vya gari na vifaa muhimu vya matumizi ya nje.",
    image: "/12v-car-kettle.webp"
  },
  {
    slug: "health-beauty",
    label: "Health & Beauty",
    description: "Bidhaa za urembo na afya kwa mwonekano bora kila siku.",
    image: "/vitamin-c-serum.webp"
  },
  {
    slug: "home-living",
    label: "Home & Living",
    description: "Bidhaa za nyumbani zinazoongeza urahisi na mwonekano mzuri.",
    image: "/led-desk-lamp.jpg"
  }
];

export const mergeCategories = (...lists: Category[][]): Category[] => {
  const map = new Map<string, Category>();

  lists.flat().forEach((category) => {
    const normalizedSlug = normalizeCategorySlug(category.slug);
    if (!normalizedSlug) return;

    const current = map.get(normalizedSlug);
    map.set(normalizedSlug, {
      slug: normalizedSlug,
      label: category.label?.trim() || current?.label || toTitleCase(normalizedSlug),
      description:
        category.description?.trim() || current?.description || `Bidhaa za ${toTitleCase(normalizedSlug)} kwa ubora na bei rafiki.`,
      image: category.image?.trim() || current?.image || fallbackCategoryImage
    });
  });

  return [...map.values()];
};

export const categoryMap = new Map(categories.map((category) => [category.slug, category]));
