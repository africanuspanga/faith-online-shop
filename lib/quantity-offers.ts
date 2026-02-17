import type { QuantityOffer } from "@/lib/types";

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export const defaultQuantityOffers: QuantityOffer[] = [
  {
    id: "buy-1",
    title: "Buy 1",
    subtitle: "50% OFF",
    paidUnits: 1,
    freeUnits: 0
  },
  {
    id: "buy-2-get-1-free",
    title: "Buy 2 Get 1 Free",
    subtitle: "MOST POPULAR",
    paidUnits: 2,
    freeUnits: 1,
    badge: "MOST POPULAR"
  },
  {
    id: "buy-3-get-2-free",
    title: "Buy 3 Get 2 Free",
    subtitle: "BEST VALUE",
    paidUnits: 3,
    freeUnits: 2,
    badge: "BEST VALUE"
  }
];

const normalizeOffer = (value: Partial<QuantityOffer>, index: number): QuantityOffer | null => {
  const paidUnits = Math.max(1, Number(value.paidUnits ?? 0));
  const freeUnits = Math.max(0, Number(value.freeUnits ?? 0));
  const title = String(value.title ?? "").trim();
  const subtitle = String(value.subtitle ?? "").trim();
  const badge = String(value.badge ?? "").trim();

  if (!title || !Number.isFinite(paidUnits) || !Number.isFinite(freeUnits)) {
    return null;
  }

  return {
    id: slugify(value.id || title) || `offer-${index + 1}`,
    title,
    subtitle: subtitle || `${paidUnits} PAID + ${freeUnits} FREE`,
    paidUnits,
    freeUnits,
    ...(badge ? { badge } : {})
  };
};

const parseLineOffer = (line: string, index: number): QuantityOffer | null => {
  const parts = line
    .split("|")
    .map((item) => item.trim())
    .filter((item, idx) => idx < 5);

  if (parts.length < 3) {
    return null;
  }

  const [title, paid, free, subtitle = "", badge = ""] = parts;
  return normalizeOffer(
    {
      title,
      paidUnits: Number(paid),
      freeUnits: Number(free),
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
    return parsed.length ? parsed : defaultQuantityOffers;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    if (!normalized) {
      return defaultQuantityOffers;
    }

    if (normalized.startsWith("[") && normalized.endsWith("]")) {
      try {
        const parsedJson = JSON.parse(normalized) as unknown;
        return toQuantityOffers(parsedJson);
      } catch {
        return defaultQuantityOffers;
      }
    }

    const parsed = normalized
      .split(/\r?\n/)
      .map((line, index) => parseLineOffer(line, index))
      .filter((item): item is QuantityOffer => Boolean(item));

    return parsed.length ? parsed : defaultQuantityOffers;
  }

  return defaultQuantityOffers;
};

export const quantityOffersToText = (offers: QuantityOffer[]): string =>
  offers
    .map((offer) => `${offer.title}|${offer.paidUnits}|${offer.freeUnits}|${offer.subtitle}|${offer.badge ?? ""}`)
    .join("\n");
