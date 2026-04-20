import type { CategorySlug, Product } from "@/lib/types";

type ProductCopySource = Pick<
  Product,
  "name" | "brand" | "category" | "subCategory" | "sizeOptions" | "colorOptions" | "descriptionSw" | "benefitsSw" | "whoForSw"
>;

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanText = (value: string) => value.replace(/\s+/g, " ").trim();

const swahiliSignals = [
  " bidhaa ",
  " usafiri ",
  " malipo ",
  " oda ",
  " tafadhali ",
  " mkoa ",
  " mji ",
  " anuani ",
  " kwa ",
  " ya ",
  " za ",
  " wa ",
  " na ",
  " inafaa ",
  " ubora ",
  " gharama ",
  " nyumbani ",
  " ofisini ",
  " simu ",
  " watu ",
  " tunafikisha ",
  " imeisha ",
  " haraka ",
  " rahisi "
];

const titleCase = (value: string) =>
  value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const humanizeSlug = (value: string) =>
  titleCase(
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
  );

const joinList = (values: string[]) => {
  if (!values.length) return "";
  if (values.length === 1) return values[0];
  if (values.length === 2) return `${values[0]} and ${values[1]}`;
  return `${values.slice(0, -1).join(", ")}, and ${values.at(-1)}`;
};

const categoryDescriptions: Record<string, string> = {
  electronic: "Modern gadgets and tech essentials selected for everyday use, work, and entertainment.",
  fashion: "Comfortable clothing and wardrobe staples picked for style, value, and daily wear.",
  "fashion-accessories": "Accessories that add polish, convenience, and a finished look to every outfit.",
  "hardware-automobile": "Practical car and utility accessories chosen for performance, convenience, and durability.",
  "health-beauty": "Daily beauty and self-care products selected for simple routines and dependable results.",
  "home-living": "Home essentials that bring comfort, convenience, and a cleaner everyday setup."
};

export const isProbablySwahili = (value: string) => {
  const normalized = ` ${normalizeText(value)} `;
  if (!normalized.trim()) return false;

  let matches = 0;
  swahiliSignals.forEach((signal) => {
    if (normalized.includes(signal)) {
      matches += 1;
    }
  });

  return matches >= 2;
};

export const getStorefrontCategoryDescription = ({
  slug,
  label,
  description
}: {
  slug?: string;
  label: string;
  description?: string | null;
}) => {
  const cleaned = cleanText(description ?? "");
  if (cleaned && !isProbablySwahili(cleaned)) {
    return cleaned;
  }

  const normalizedSlug =
    slug
      ?.trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") ?? "";

  return categoryDescriptions[normalizedSlug] ?? `${label} products chosen for dependable quality and everyday value.`;
};

const getCategoryLabel = (category: CategorySlug) => titleCase(category || "general");

const getGeneratedDescription = (product: ProductCopySource) => {
  const categoryLabel = getCategoryLabel(product.category).toLowerCase();
  const brandPrefix = product.brand ? `${product.brand} ` : "";
  const availableSizes = product.sizeOptions.filter(Boolean);
  const availableColors = product.colorOptions.filter(Boolean);
  const availabilityLine =
    availableSizes.length || availableColors.length
      ? ` Available options include ${joinList(
          [
            availableSizes.length ? `sizes ${joinList(availableSizes)}` : "",
            availableColors.length ? `colors ${joinList(availableColors)}` : ""
          ].filter(Boolean)
        )}.`
      : "";

  switch (product.category) {
    case "electronic":
      return `${brandPrefix}${product.name} is a reliable ${categoryLabel} pick built for smooth everyday performance, easy setup, and practical use at home, at work, or on the move.${availabilityLine}`;
    case "fashion":
      return `${brandPrefix}${product.name} is made for comfortable everyday wear, a clean look, and an easy fit across casual and smart outfits.${availabilityLine}`;
    case "fashion-accessories":
      return `${brandPrefix}${product.name} brings together style and everyday convenience, making it easy to elevate your look without losing comfort or practicality.${availabilityLine}`;
    case "hardware-automobile":
      return `${brandPrefix}${product.name} is designed for dependable use on the road or around your setup, with practical performance that makes everyday tasks easier.${availabilityLine}`;
    case "health-beauty":
      return `${brandPrefix}${product.name} supports a simple daily care routine with easy use, dependable performance, and a finish that feels right for regular use.${availabilityLine}`;
    case "home-living":
      return `${brandPrefix}${product.name} adds comfort and convenience to daily living, with a practical design that fits naturally into home, office, or travel use.${availabilityLine}`;
    default:
      return `${brandPrefix}${product.name} is a dependable everyday product selected for practical use, solid value, and simple convenience.${availabilityLine}`;
  }
};

const getGeneratedBenefits = (product: ProductCopySource) => {
  switch (product.category) {
    case "electronic":
      return [
        "Reliable daily performance",
        "Easy to use at home, at work, or on the move",
        "Fast nationwide delivery across Tanzania"
      ];
    case "fashion":
      return [
        "Comfortable for regular wear",
        "Easy to style for different occasions",
        "Fast nationwide delivery across Tanzania"
      ];
    case "fashion-accessories":
      return [
        "Adds a polished everyday finish",
        "Comfortable and practical to carry or wear",
        "Fast nationwide delivery across Tanzania"
      ];
    case "hardware-automobile":
      return [
        "Built for practical daily use",
        "Useful for travel, driving, or setup improvements",
        "Fast nationwide delivery across Tanzania"
      ];
    case "health-beauty":
      return [
        "Simple to use in a daily care routine",
        "Designed for consistent, everyday results",
        "Fast nationwide delivery across Tanzania"
      ];
    case "home-living":
      return [
        "Adds comfort and convenience to daily use",
        "Easy to place, use, and maintain",
        "Fast nationwide delivery across Tanzania"
      ];
    default:
      return [
        "Dependable everyday value",
        "Simple and practical to use",
        "Fast nationwide delivery across Tanzania"
      ];
  }
};

const getGeneratedWhoFor = (product: ProductCopySource) => {
  switch (product.category) {
    case "electronic":
      return "Great for customers who want reliable tech for work, study, content creation, or daily convenience.";
    case "fashion":
      return "A solid choice for shoppers who want comfortable clothing with an easy everyday look.";
    case "fashion-accessories":
      return "Ideal for shoppers who want useful accessories that also sharpen their everyday style.";
    case "hardware-automobile":
      return "Best for drivers, commuters, and anyone who wants smarter everyday utility.";
    case "health-beauty":
      return "Well suited to customers building a simple, dependable self-care routine.";
    case "home-living":
      return "Perfect for homes, offices, and everyday spaces that need a little more comfort and convenience.";
    default:
      return "A practical choice for anyone looking for dependable everyday value.";
  }
};

export const getStorefrontProductDescription = (product: ProductCopySource) => {
  const cleaned = cleanText(product.descriptionSw);
  if (cleaned && !isProbablySwahili(cleaned)) {
    return cleaned;
  }
  return getGeneratedDescription(product);
};

export const getStorefrontProductBenefits = (product: ProductCopySource) => {
  const benefits = product.benefitsSw.map(cleanText).filter(Boolean);
  if (benefits.length && benefits.every((item) => !isProbablySwahili(item))) {
    return benefits;
  }
  return getGeneratedBenefits(product);
};

export const getStorefrontProductWhoFor = (product: ProductCopySource) => {
  const cleaned = cleanText(product.whoForSw);
  if (cleaned && !isProbablySwahili(cleaned)) {
    return cleaned;
  }
  return getGeneratedWhoFor(product);
};

export const getDescriptionParagraphs = (description: string) => {
  const normalized = cleanText(description);
  if (!normalized) return [];

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length <= 2) {
    return [normalized];
  }

  const paragraphs: string[] = [];
  for (let index = 0; index < sentences.length; index += 2) {
    paragraphs.push(sentences.slice(index, index + 2).join(" "));
  }
  return paragraphs;
};

export const getDescriptionHighlights = (description: string, fallbackHighlights: string[]) => {
  const normalized = cleanText(description);
  if (!normalized) {
    return fallbackHighlights.slice(0, 4);
  }

  const highlights = normalized
    .split(/(?<=[.!?])\s+|;/)
    .map((part) => part.replace(/[.!?]+$/, "").trim())
    .filter((part) => part.length >= 18)
    .slice(0, 4);

  return highlights.length ? highlights : fallbackHighlights.slice(0, 4);
};
