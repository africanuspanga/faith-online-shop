import type { Category } from "@/lib/types";
import { getStorefrontCategoryDescription } from "@/lib/storefront-copy";

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
    description: getStorefrontCategoryDescription({ slug: normalized, label }),
    image: fallbackCategoryImage
  };
};

export const categories: Category[] = [
  {
    slug: "electronic",
    label: "Electronic",
    description: "Modern gadgets and tech essentials selected for everyday use, work, and entertainment.",
    image: "/116plus-smart-watch.webp"
  },
  {
    slug: "fashion",
    label: "Fashion",
    description: "Comfortable clothing and wardrobe staples picked for style, value, and daily wear.",
    image: "/black-hoodie-streetwear.webp"
  },
  {
    slug: "fashion-accessories",
    label: "Fashion & Accessories",
    description: "Accessories that add polish, convenience, and a finished look to every outfit.",
    image: "/womens-crossbody-bag.webp"
  },
  {
    slug: "hardware-automobile",
    label: "Hardware & Automobile",
    description: "Practical car and utility accessories chosen for performance, convenience, and durability.",
    image: "/12v-car-kettle.webp"
  },
  {
    slug: "health-beauty",
    label: "Health & Beauty",
    description: "Daily beauty and self-care products selected for simple routines and dependable results.",
    image: "/vitamin-c-serum.webp"
  },
  {
    slug: "home-living",
    label: "Home & Living",
    description: "Home essentials that bring comfort, convenience, and a cleaner everyday setup.",
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
      description: getStorefrontCategoryDescription({
        slug: normalizedSlug,
        label: category.label?.trim() || current?.label || toTitleCase(normalizedSlug),
        description: category.description?.trim() || current?.description
      }),
      image: category.image?.trim() || current?.image || fallbackCategoryImage,
      subCategories: [
        ...new Set([...(current?.subCategories ?? []), ...(category.subCategories ?? [])].map(normalizeCategorySlug).filter(Boolean))
      ]
    });
  });

  return [...map.values()];
};

export const categoryMap = new Map(categories.map((category) => [category.slug, category]));
