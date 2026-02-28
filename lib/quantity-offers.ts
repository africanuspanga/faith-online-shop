import type { QuantityOffer } from "@/lib/types";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

const roundMoney = (value: number) => Number(value.toFixed(2));
const percentagePattern = /(\d+(?:\.\d+)?)\s*%/i;

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return parsed;
};

const toWholeNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.trunc(parsed);
};

const clampDiscountPercent = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
};

const defaultBuy1Offer: QuantityOffer = {
  id: "buy-1",
  title: "Buy 1",
  subtitle: "STANDARD PRICE",
  paidUnits: 1,
  freeUnits: 0,
  discountPercent: 0
};

const defaultBuy2Offer: QuantityOffer = {
  id: "buy-2-get-10-percent-discount",
  title: "Buy 2 Get 10% Discount",
  subtitle: "10% OFF EACH ITEM",
  paidUnits: 2,
  freeUnits: 0,
  discountPercent: 10,
  badge: "MOST POPULAR"
};

const defaultBuy3Offer: QuantityOffer = {
  id: "buy-3-get-15-percent-discount",
  title: "Buy 3 Get 15% Discount",
  subtitle: "15% OFF EACH ITEM",
  paidUnits: 3,
  freeUnits: 0,
  discountPercent: 15,
  badge: "BEST VALUE"
};

export const defaultQuantityOffers: QuantityOffer[] = [
  defaultBuy1Offer,
  defaultBuy2Offer,
  defaultBuy3Offer
];

const cloneDefaultOffers = () => defaultQuantityOffers.map((offer) => ({ ...offer }));

export const getQuantityOfferDiscountPercent = (offer: Partial<QuantityOffer> | null | undefined) => {
  if (!offer) return 0;

  const explicitDiscount = Number(offer.discountPercent ?? Number.NaN);
  if (Number.isFinite(explicitDiscount)) {
    return clampDiscountPercent(explicitDiscount);
  }

  const textBlob = `${String(offer.title ?? "")} ${String(offer.subtitle ?? "")} ${String(offer.badge ?? "")}`;
  const textMatch = textBlob.match(percentagePattern);
  if (textMatch) {
    return clampDiscountPercent(toNumber(textMatch[1], 0));
  }

  const paidUnits = Math.max(1, toWholeNumber(offer.paidUnits, 1));
  const freeUnits = Math.max(0, toWholeNumber(offer.freeUnits, 0));
  const normalizedId = String(offer.id ?? "").trim().toLowerCase();
  const normalizedTitle = String(offer.title ?? "").trim().toLowerCase();

  if (
    (paidUnits === 2 && freeUnits === 1) ||
    normalizedId === "buy-2-get-1-free" ||
    normalizedTitle.includes("buy 2 get 1 free")
  ) {
    return 10;
  }

  if (
    (paidUnits === 3 && freeUnits === 2) ||
    normalizedId === "buy-3-get-2-free" ||
    normalizedTitle.includes("buy 3 get 2 free")
  ) {
    return 15;
  }

  return 0;
};

const upgradeLegacyBusinessOffer = (offer: QuantityOffer): QuantityOffer => {
  const paidUnits = Math.max(1, toWholeNumber(offer.paidUnits, 1));
  const freeUnits = Math.max(0, toWholeNumber(offer.freeUnits, 0));
  const normalizedId = offer.id.trim().toLowerCase();
  const normalizedTitle = offer.title.trim().toLowerCase();

  const isLegacyBuy2 =
    (paidUnits === 2 && freeUnits === 1) ||
    normalizedId === "buy-2-get-1-free" ||
    normalizedTitle.includes("buy 2 get 1 free");

  if (isLegacyBuy2) {
    return { ...defaultBuy2Offer };
  }

  const isLegacyBuy3 =
    (paidUnits === 3 && freeUnits === 2) ||
    normalizedId === "buy-3-get-2-free" ||
    normalizedTitle.includes("buy 3 get 2 free");

  if (isLegacyBuy3) {
    return { ...defaultBuy3Offer };
  }

  return offer;
};

const normalizeOffer = (value: Partial<QuantityOffer>, index: number): QuantityOffer | null => {
  const paidUnits = Math.max(1, toWholeNumber(value.paidUnits, 1));
  const freeUnits = Math.max(0, toWholeNumber(value.freeUnits, 0));
  const title = String(value.title ?? "").trim();
  const subtitle = String(value.subtitle ?? "").trim();
  const badge = String(value.badge ?? "").trim();
  const discountPercent = getQuantityOfferDiscountPercent(value);

  if (!title) {
    return null;
  }

  const normalized: QuantityOffer = {
    id: slugify(value.id || title) || `offer-${index + 1}`,
    title,
    subtitle:
      subtitle ||
      (discountPercent > 0 ? `${discountPercent}% OFF EACH ITEM` : freeUnits > 0 ? `${paidUnits} PAID + ${freeUnits} FREE` : "STANDARD"),
    paidUnits,
    freeUnits,
    ...(discountPercent > 0 ? { discountPercent } : {}),
    ...(badge ? { badge } : {})
  };

  return upgradeLegacyBusinessOffer(normalized);
};

const parseLineOffer = (line: string, index: number): QuantityOffer | null => {
  const parts = line
    .split("|")
    .map((item) => item.trim())
    .filter((item, idx) => idx < 6);

  if (parts.length < 3) {
    return null;
  }

  if (parts.length >= 6) {
    const [title, paid, free, discountPercent, subtitle = "", badge = ""] = parts;
    return normalizeOffer(
      {
        title,
        paidUnits: Number(paid),
        freeUnits: Number(free),
        discountPercent: Number(discountPercent),
        subtitle,
        badge
      },
      index
    );
  }

  const [title, paid, third, subtitle = "", badge = ""] = parts;
  const looksLikeDiscountOffer = /discount|%/i.test(title) || /%/.test(third);

  if (looksLikeDiscountOffer) {
    return normalizeOffer(
      {
        title,
        paidUnits: Number(paid),
        freeUnits: 0,
        discountPercent: Number(third),
        subtitle,
        badge
      },
      index
    );
  }

  return normalizeOffer(
    {
      title,
      paidUnits: Number(paid),
      freeUnits: Number(third),
      subtitle,
      badge
    },
    index
  );
};

export const toQuantityOffers = (value: unknown): QuantityOffer[] => {
  if (Array.isArray(value)) {
    const parsed = value
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        return normalizeOffer(item as Partial<QuantityOffer>, index);
      })
      .filter((item): item is QuantityOffer => Boolean(item));
    return parsed.length ? parsed : cloneDefaultOffers();
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return cloneDefaultOffers();
    }

    if (normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        const parsedJson = JSON.parse(normalized) as unknown;
        return toQuantityOffers(parsedJson);
      } catch {
        return cloneDefaultOffers();
      }
    }

    const parsed = normalized
      .split(/\r?\n/)
      .map((line, index) => parseLineOffer(line, index))
      .filter((item): item is QuantityOffer => Boolean(item));

    return parsed.length ? parsed : cloneDefaultOffers();
  }

  return cloneDefaultOffers();
};

export interface QuantityOfferPricing {
  paidUnits: number;
  freeUnits: number;
  quantity: number;
  discountPercent: number;
  discountedUnitPrice: number;
  subtotal: number;
  originalTotal: number;
  savings: number;
}

export const computeQuantityOfferPricing = (
  offer: Partial<QuantityOffer> | null | undefined,
  salePrice: number,
  originalPrice: number
): QuantityOfferPricing => {
  const paidUnits = Math.max(1, toWholeNumber(offer?.paidUnits, 1));
  const freeUnits = Math.max(0, toWholeNumber(offer?.freeUnits, 0));
  const quantity = paidUnits + freeUnits;
  const discountPercent = getQuantityOfferDiscountPercent(offer);
  const safeSalePrice = Math.max(0, toNumber(salePrice, 0));
  const safeOriginalPrice = Math.max(safeSalePrice, toNumber(originalPrice, safeSalePrice));
  const discountedUnitPrice = roundMoney(safeSalePrice * (1 - discountPercent / 100));
  const subtotal = roundMoney(discountedUnitPrice * paidUnits);
  const originalTotal = roundMoney(safeOriginalPrice * quantity);
  const savings = roundMoney(Math.max(0, originalTotal - subtotal));

  return {
    paidUnits,
    freeUnits,
    quantity,
    discountPercent,
    discountedUnitPrice,
    subtotal,
    originalTotal,
    savings
  };
};

const formatOfferNumber = (value: number) => {
  if (!Number.isFinite(value)) return "0";
  return String(Number(value.toFixed(2)));
};

export const quantityOffersToText = (offers: QuantityOffer[]): string =>
  offers
    .map((offer) =>
      [
        offer.title,
        offer.paidUnits,
        offer.freeUnits,
        formatOfferNumber(getQuantityOfferDiscountPercent(offer)),
        offer.subtitle,
        offer.badge ?? ""
      ].join("|")
    )
    .join("\n");
