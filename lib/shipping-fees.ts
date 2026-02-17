export type DarDeliveryRate = {
  area: string;
  baseFee: number;
  notes?: string;
};

const DAR_RATE_INCREASE_THRESHOLD = 4000;
const DAR_RATE_INCREMENT = 1000;

const darRatesFromSheet: DarDeliveryRate[] = [
  { area: "Area 1 Bibi Titi / Morogoro", baseFee: 3000 },
  { area: "Area 2 Uhuru St", baseFee: 3000 },
  { area: "Area 3 Nyerere 1", baseFee: 3000, notes: "Imewekwa kwenye band ya karibu ya mjini." },
  { area: "Area 4 Nyerere 2", baseFee: 5000 },
  { area: "Area 5 Mandela Rd", baseFee: 8000 },
  { area: "Area 6 Morogoro 1", baseFee: 4000 },
  { area: "Area 7 Morogoro 2", baseFee: 5000 },
  { area: "Area 8 Bagamoyo 1", baseFee: 4000 },
  { area: "Area 9 Bagamoyo 2", baseFee: 9000 },
  { area: "Area 10 Bagamoyo 3", baseFee: 23000 },
  { area: "Area 11 Kilwa Rd 1", baseFee: 7000 },
  { area: "Area 12 Kilwa Rd 2", baseFee: 10000 },
  { area: "Area 13 Nyerere 3", baseFee: 7000 },
  { area: "Area 14 Nyerere 4", baseFee: 20000 },
  { area: "Area 15 Morogoro 3", baseFee: 9000 },
  { area: "Area 16 Morogoro 4", baseFee: 25000 },
  { area: "Area 18 Kigamboni 1", baseFee: 10000 },
  { area: "Mbezi (Mpigi Magoye route)", baseFee: 20000 }
];

const adjustDarRate = (fee: number) => (fee >= DAR_RATE_INCREASE_THRESHOLD ? fee + DAR_RATE_INCREMENT : fee);

export const darDeliveryRates = darRatesFromSheet.map((item) => ({
  ...item,
  finalFee: adjustDarRate(item.baseFee)
}));

export const upcountryFlatShippingFee = 10000;

export const darDeliveryFeeRange = {
  min: Math.min(...darDeliveryRates.map((item) => item.finalFee)),
  max: Math.max(...darDeliveryRates.map((item) => item.finalFee))
};

type ShippingEstimate = {
  fee: number;
  regionLabel: string;
  matchedArea: string;
  isDar: boolean;
};

const darKeywords = [
  "dar",
  "dar es salaam",
  "dsm",
  "kinondoni",
  "ilala",
  "temeke",
  "ubungo",
  "kigamboni"
];

const genericAreaTokens = new Set([
  "area",
  "route",
  "road",
  "rd",
  "st",
  "street",
  "dar",
  "es",
  "salaam",
  "dsm"
]);

const normalizeLocation = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const tokenize = (value: string) =>
  normalizeLocation(value)
    .split(" ")
    .map((item) => item.trim())
    .filter((item) => item.length > 1 && !genericAreaTokens.has(item));

const isDarLocation = (location: string) => {
  const normalized = normalizeLocation(location);
  return darKeywords.some((keyword) => normalized.includes(keyword));
};

const getBestDarArea = (location: string) => {
  const normalizedLocation = normalizeLocation(location);
  let bestMatch = darDeliveryRates[0];
  let bestScore = 0;

  darDeliveryRates.forEach((rate) => {
    const tokens = tokenize(rate.area);
    const score = tokens.reduce((sum, token) => (normalizedLocation.includes(token) ? sum + 1 : sum), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = rate;
    }
  });

  if (bestScore === 0) {
    return null;
  }

  return bestMatch;
};

export const calculateShippingFee = ({
  regionCity,
  address
}: {
  regionCity: string;
  address?: string;
}): ShippingEstimate => {
  const location = `${regionCity} ${address ?? ""}`.trim();
  const darDetected = isDarLocation(location);

  if (!darDetected) {
    return {
      fee: upcountryFlatShippingFee,
      regionLabel: "Mikoa (Outside Dar)",
      matchedArea: "Flat Rate",
      isDar: false
    };
  }

  const matchedArea = getBestDarArea(location);
  if (matchedArea) {
    return {
      fee: matchedArea.finalFee,
      regionLabel: "Dar es Salaam",
      matchedArea: matchedArea.area,
      isDar: true
    };
  }

  return {
    fee: darDeliveryFeeRange.min,
    regionLabel: "Dar es Salaam",
    matchedArea: "Standard Dar Rate",
    isDar: true
  };
};
