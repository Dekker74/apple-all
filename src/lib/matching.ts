import { PROCESSING_MAP } from "@/lib/constants";
import { computePriceBreakdown, formatKg, formatPerKg, haversineKm, resolveProcessing } from "@/lib/pricing";
import type {
  Location,
  MatchConfidence,
  MaterialListing,
  MaterialRequest,
  PriceBreakdown,
  ProcessingType,
} from "@/types";

export interface MatchEvaluation {
  score: number;
  confidence: MatchConfidence;
  reasons: string[];
  risks: string[];
  requiredProcessing: ProcessingType[];
  distanceKm: number;
  quantityKg: number;
  breakdown: PriceBreakdown;
}

const SYNONYMS: Record<string, string[]> = {
  pet: ["pet", "rpet", "polyethylene terephthalate", "bottle flake"],
  ldpe: ["ldpe", "pe-ld", "low density polyethylene", "film", "stretch film"],
  hdpe: ["hdpe", "pe-hd", "high density polyethylene", "regrind"],
  pp: ["pp", "polypropylene", "big bag"],
  occ: ["occ", "corrugated", "kraft", "containerboard", "cardboard"],
  paper: ["paper", "carta", "cartone", "giornale", "ufficio", "deinking", "de-inking", "newsprint", "office paper", "white paper"],
  wood: ["wood", "legno", "rovere", "pino", "duro", "pallet", "timber", "oak", "pine", "hardwood", "softwood", "offcut"],
  mdf: ["mdf", "fibreboard", "fiberboard"],
  sawdust: ["sawdust", "segatura", "wood dust", "shaving"],
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s-]/g, " ").replace(/\s+/g, " ").trim();
}

function tokens(value: string): string[] {
  const normalized = normalize(value);
  const out = new Set<string>();
  for (const [canonical, variants] of Object.entries(SYNONYMS)) {
    if (variants.some((v) => normalized.includes(v))) out.add(canonical);
  }
  normalized.split(" ").forEach((t) => {
    if (t.length > 2) out.add(t);
  });
  return Array.from(out);
}

export function compositionAffinity(
  acceptable: string[],
  listing: MaterialListing,
): { score: number; matched: string[] } {
  const listingText = [
    listing.title,
    listing.description,
    ...listing.composition.map((c) => c.material),
  ].join(" ");
  const listingTokens = new Set(tokens(listingText));

  if (acceptable.length === 0) {
    return { score: 0.72, matched: [] };
  }

  const matched: string[] = [];
  let best = 0;
  for (const entry of acceptable) {
    const entryTokens = tokens(entry);
    if (entryTokens.length === 0) continue;
    const hits = entryTokens.filter((t) => listingTokens.has(t)).length;
    const ratio = hits / entryTokens.length;
    if (ratio >= 0.5) matched.push(entry);
    best = Math.max(best, ratio);
  }

  return { score: Math.min(1, best * 0.85 + (matched.length > 0 ? 0.15 : 0)), matched };
}

export function evaluateMatch(
  listing: MaterialListing,
  request: MaterialRequest,
  listingLocation: Location | undefined,
  requestLocation: Location | undefined,
): MatchEvaluation | null {
  if (listing.category !== request.category) return null;
  if (!listingLocation || !requestLocation) return null;

  const distanceKm = haversineKm(listingLocation, requestLocation);
  const quantityKg = Math.min(listing.quantityKg, request.quantityKg);
  const requiredProcessing = resolveProcessing(listing, request);
  const breakdown = computePriceBreakdown({
    listing,
    quantityKg,
    distanceKm,
    processing: requiredProcessing,
  });

  const composition = compositionAffinity(request.acceptableComposition, listing);
  const compositionScore = composition.score;

  const quantityScore = Math.pow(Math.min(1, listing.quantityKg / request.quantityKg), 0.7);

  const { minPurityPct } = request.qualityThresholds;
  const purityScore =
    listing.purityPct >= minPurityPct
      ? 1
      : Math.max(0, 1 - (minPurityPct - listing.purityPct) / 15);

  const radius = Math.max(request.radiusKm, 1);
  const distanceScore =
    distanceKm <= radius
      ? 1 - (distanceKm / radius) * 0.15
      : Math.max(0, 1 - (distanceKm - radius) / (radius * 1.5)) * 0.6;

  const budgetForQuantity = request.maxBudget * (quantityKg / request.quantityKg);
  const budgetRatio = budgetForQuantity / Math.max(breakdown.total, 1);
  const budgetScore =
    budgetRatio >= 1 ? 1 : Math.max(0, (budgetRatio - 0.15) / 0.85);

  const conditionScore =
    listing.condition === "clean" ? 1 : listing.condition === "mixed" ? 0.75 : 0.55;

  const score = Math.round(
    (compositionScore * 0.28 +
      quantityScore * 0.2 +
      purityScore * 0.14 +
      distanceScore * 0.14 +
      budgetScore * 0.16 +
      conditionScore * 0.08) *
      100,
  );

  const confidence: MatchConfidence = score >= 80 ? "strong" : score >= 60 ? "review" : "weak";

  const reasons: string[] = [];
  const risks: string[] = [];

  if (composition.matched.length > 0) {
    reasons.push(`Composizione compatibile: ${composition.matched.slice(0, 3).join(", ")}`);
  } else {
    reasons.push("Stessa famiglia di materiale — composizione da verificare");
  }

  if (quantityKg >= request.quantityKg) {
    reasons.push(`${formatKg(listing.quantityKg)} disponibili, richiesta completamente coperta`);
  } else {
    const coverage = Math.round((listing.quantityKg / request.quantityKg) * 100);
    reasons.push(`${formatKg(listing.quantityKg)} disponibili — ${coverage}% del volume richiesto`);
    risks.push(`Volume insufficiente: ${formatKg(request.quantityKg - listing.quantityKg)} sotto il target`);
  }

  if (distanceKm <= radius) {
    reasons.push(`Entro il raggio: ${distanceKm} km da ${requestLocation.city} (limite ${radius} km)`);
  } else {
    risks.push(
      `Punto di ritiro a ${distanceKm} km di distanza — ${distanceKm - radius} km oltre il raggio richiesto`,
    );
  }

  if (listing.purityPct >= minPurityPct) {
    reasons.push(`Purezza ${listing.purityPct}% soddisfa la soglia del ${minPurityPct}% threshold`);
  } else {
    risks.push(`Purezza ${listing.purityPct}% è sotto la soglia del ${minPurityPct}% threshold`);
  }

  const budgetPerKg = budgetForQuantity / quantityKg;
  if (breakdown.total <= budgetForQuantity) {
    reasons.push(
      `Consegnato a ${formatPerKg(breakdown.deliveredPerKg)} rispetto al budget ${formatPerKg(budgetPerKg)}`,
    );
  } else {
    const over = Math.round((breakdown.total / budgetForQuantity - 1) * 100);
    risks.push(`Il costo consegnato è del ${over}% sopra il massimale di budget`);
  }

  if (requiredProcessing.length > 0) {
    reasons.push(
      `Lavorazione coordinata: ${requiredProcessing.map((p) => PROCESSING_MAP[p].label).join(", ")}`,
    );
  }

  if (listing.condition !== "clean") {
    risks.push(
      listing.condition === "mixed"
        ? "Flusso misto — campionamento QC richiesto prima dell'accettazione del preventivo"
        : "Il materiale richiede lavorazione prima di soddisfare le specifiche di produzione",
    );
  }

  if (new Date(listing.availableFrom) > new Date(request.neededBy)) {
    risks.push("La disponibilità inizia dopo la data di consegna richiesta");
  }

  return {
    score: Math.min(99, Math.max(0, score)),
    confidence,
    reasons,
    risks,
    requiredProcessing,
    distanceKm,
    quantityKg,
    breakdown,
  };
}

export function buildMatchId(requestId: string, listingId: string): string {
  return `mt_${requestId.replace(/^req_/, "")}_${listingId.replace(/^lst_/, "")}`;
}
