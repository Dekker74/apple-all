import { COMMISSION_RATE, PROCESSING_MAP, VAT_RATE } from "@/lib/constants";
import type { MaterialListing, MaterialRequest, PriceBreakdown, ProcessingType } from "@/types";

export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

export function resolveProcessing(
  listing: MaterialListing,
  request?: MaterialRequest,
): ProcessingType[] {
  const set = new Set<ProcessingType>(request?.requiredProcessing ?? []);
  if (listing.condition === "needs_processing") set.add("sorting");
  if (listing.condition === "mixed" && listing.category === "plastic") set.add("sorting");
  if (listing.category === "paper_cardboard" && request?.requiredProcessing.includes("deinking")) {
    set.add("baling");
  }
  return Array.from(set);
}

export function computePriceBreakdown(params: {
  listing: MaterialListing;
  quantityKg: number;
  distanceKm: number;
  processing: ProcessingType[];
  commissionRate?: number;
  taxRate?: number;
}): PriceBreakdown {
  const { listing, quantityKg, distanceKm, processing } = params;
  const commissionRate = params.commissionRate ?? COMMISSION_RATE;
  const taxRate = params.taxRate ?? VAT_RATE;

  const volumeDiscount = quantityKg >= 10000 ? 0.95 : quantityKg >= 5000 ? 0.975 : 1;
  const materialPerKg = round(listing.pricePerKg * volumeDiscount, 4);
  const materialCost = round(materialPerKg * quantityKg, 2);

  const processingPerKg = processing.reduce(
    (sum, p) => sum + (PROCESSING_MAP[p]?.perKg ?? 0),
    0,
  );
  const processingCost = round(processingPerKg * quantityKg, 2);

  // Line-haul + handling. Consolidation discounts for full truck loads.
  const loadFactor = Math.min(1, quantityKg / 12000);
  const transportCost = round(
    (260 + distanceKm * 1.85) * (0.55 + loadFactor * 0.45) + quantityKg * 0.011,
    2,
  );

  const commissionAmount = round(materialCost * commissionRate, 2);
  const subtotal = round(materialCost + processingCost + transportCost + commissionAmount, 2);
  const taxAmount = round(subtotal * taxRate, 2);
  const total = round(subtotal + taxAmount, 2);

  return {
    quantityKg,
    materialCost,
    processingCost,
    transportCost,
    commissionRate,
    commissionAmount,
    subtotal,
    taxRate,
    taxAmount,
    total,
    deliveredPerKg: round(total / Math.max(quantityKg, 1), 4),
    materialPerKg,
  };
}

export function round(value: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round((value + Number.EPSILON) * f) / f;
}

// CLDR's `it-IT` locale sets minimumGroupingDigits=2, so 4-digit values render
// as "2828,17 €". `de-DE` uses the same separators and symbol position but
// groups from 4 digits, giving the conventional Italian "2.828,17 €".
const GROUPED_LOCALE = "de-DE";

export function formatCurrency(value: number, opts?: { compact?: boolean; cents?: boolean }): string {
  if (opts?.compact && Math.abs(value) >= 1000) {
    const abs = Math.abs(value);
    const divisor = abs >= 1_000_000 ? 1_000_000 : 1_000;
    const suffix = abs >= 1_000_000 ? "mln" : "mila";
    const scaled = new Intl.NumberFormat(GROUPED_LOCALE, {
      maximumFractionDigits: 1,
    }).format(value / divisor);
    return `${scaled} ${suffix} €`;
  }
  return new Intl.NumberFormat(GROUPED_LOCALE, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: opts?.cents ? 2 : 0,
    maximumFractionDigits: opts?.cents ? 2 : 0,
  }).format(value);
}

export function formatPerKg(value: number, digits = 2): string {
  return `${new Intl.NumberFormat(GROUPED_LOCALE, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)}/kg`;
}

export function formatKg(value: number): string {
  if (value >= 1000) {
    return `${new Intl.NumberFormat(GROUPED_LOCALE, {
      maximumFractionDigits: value % 1000 === 0 ? 0 : 1,
    }).format(value / 1000)} t`;
  }
  return `${new Intl.NumberFormat(GROUPED_LOCALE).format(value)} kg`;
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(GROUPED_LOCALE).format(value);
}
