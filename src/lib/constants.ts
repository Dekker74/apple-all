import type {
  MaterialCategory,
  MaterialCondition,
  MatchConfidence,
  OrderStatus,
  OrgType,
  ProcessingType,
  RequestStatus,
  ListingStatus,
} from "@/types";

export const CATEGORIES: {
  value: MaterialCategory;
  label: string;
  short: string;
  blurb: string;
  glyph: string;
}[] = [
  {
    value: "paper_cardboard",
    label: "Carta e cartone",
    short: "Carta",
    blurb: "OCC, ritagli kraft, carta da disinchiostro, carta da ufficio.",
    glyph: "▤",
  },
  {
    value: "wood",
    label: "Legno",
    short: "Legno",
    blurb: "Ritagli essiccati in forno, legno da pallet, segatura, MDF.",
    glyph: "▨",
  },
  {
    value: "plastic",
    label: "Plastica",
    short: "Plastica",
    blurb: "Film LDPE, fiocchi rPET, granuli HDPE, sacchi PP.",
    glyph: "◈",
  },
];

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c]),
) as Record<MaterialCategory, (typeof CATEGORIES)[number]>;

export const CONDITIONS: { value: MaterialCondition; label: string; hint: string }[] = [
  { value: "clean", label: "Pulito", hint: "Flusso unico, bassa contaminazione" },
  { value: "mixed", label: "Misto", hint: "Flussi misti, separabili" },
  { value: "needs_processing", label: "Da lavorare", hint: "Lavaggio, cernita o rigranulazione" },
];

export const CONDITION_MAP = Object.fromEntries(
  CONDITIONS.map((c) => [c.value, c]),
) as Record<MaterialCondition, (typeof CONDITIONS)[number]>;

/** Internal quality values used by the matching engine. The UI never asks for
 *  a purity percentage: sellers and buyers describe the material condition. */
const CONDITION_QUALITY: Record<
  MaterialCondition,
  { purityPct: number; minPurityPct: number; maxMoisturePct: number; maxContaminationPct: number }
> = {
  clean: { purityPct: 95, minPurityPct: 90, maxMoisturePct: 8, maxContaminationPct: 2 },
  mixed: { purityPct: 80, minPurityPct: 78, maxMoisturePct: 12, maxContaminationPct: 4 },
  needs_processing: {
    purityPct: 65,
    minPurityPct: 60,
    maxMoisturePct: 20,
    maxContaminationPct: 8,
  },
};

/** Most conservative selected condition wins, so matches never overstate quality. */
export function deriveCondition(selected: MaterialCondition[]): MaterialCondition {
  if (selected.includes("needs_processing")) return "needs_processing";
  if (selected.includes("mixed")) return "mixed";
  return "clean";
}

export function derivePurityPct(selected: MaterialCondition[]): number {
  if (selected.length === 0) return CONDITION_QUALITY.clean.purityPct;
  return Math.min(...selected.map((value) => CONDITION_QUALITY[value].purityPct));
}

export function deriveQualityThresholds(selected: MaterialCondition[]): {
  minPurityPct: number;
  maxMoisturePct: number;
  maxContaminationPct: number;
} {
  const values = selected.length > 0 ? selected : (["clean"] as MaterialCondition[]);
  return {
    minPurityPct: Math.min(...values.map((v) => CONDITION_QUALITY[v].minPurityPct)),
    maxMoisturePct: Math.max(...values.map((v) => CONDITION_QUALITY[v].maxMoisturePct)),
    maxContaminationPct: Math.max(...values.map((v) => CONDITION_QUALITY[v].maxContaminationPct)),
  };
}

export const PROCESSING_OPTIONS: { value: ProcessingType; label: string; perKg: number }[] = [
  { value: "sorting", label: "Cernita e QC", perKg: 0.035 },
  { value: "washing", label: "Lavaggio", perKg: 0.085 },
  { value: "shredding", label: "Triturazione / macinazione", perKg: 0.06 },
  { value: "pelletizing", label: "Rigranulazione", perKg: 0.14 },
  { value: "deinking", label: "Disinchiostro", perKg: 0.11 },
  { value: "drying", label: "Asciugatura", perKg: 0.05 },
  { value: "baling", label: "Imballaggio in balle", perKg: 0.025 },
];

export const PROCESSING_MAP = Object.fromEntries(
  PROCESSING_OPTIONS.map((p) => [p.value, p]),
) as Record<ProcessingType, (typeof PROCESSING_OPTIONS)[number]>;

export const COMMISSION_RATE = 0.06;
export const VAT_RATE = 0.22;

export const ORG_TYPES: { value: OrgType; label: string; hint: string }[] = [
  { value: "supplier", label: "Fornitore", hint: "Ho materiale da vendere" },
  { value: "buyer", label: "Acquirente", hint: "Cerco materiale" },
  { value: "both", label: "Entrambi", hint: "Compro e vendo" },
];

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: string; step: number; description: string }
> = {
  draft: {
    label: "Bozza",
    tone: "bg-sand text-ink border-line",
    step: 0,
    description: "Ordine creato, non ancora abbinato.",
  },
  matched: {
    label: "Abbinato",
    tone: "bg-mist text-forest border-sage/40",
    step: 1,
    description: "Offerta e domanda collegate dal motore di abbinamento.",
  },
  quote_issued: {
    label: "Preventivo inviato",
    tone: "bg-lime/25 text-forest border-lime/60",
    step: 2,
    description: "Preventivo trasparente inviato all'acquirente.",
  },
  quote_accepted: {
    label: "Preventivo accettato",
    tone: "bg-lime text-forest border-lime",
    step: 3,
    description: "Acquirente ha accettato. Inizia il coordinamento logistico.",
  },
  collection_scheduled: {
    label: "Ritiro programmato",
    tone: "bg-sky/15 text-sky border-sky/30",
    step: 4,
    description: "Trasportatore, lavoratore e partner QC prenotati.",
  },
  completed: {
    label: "Completato",
    tone: "bg-forest text-paper border-forest",
    step: 5,
    description: "Materiale consegnato, QC superato, fattura saldata.",
  },
  cancelled: {
    label: "Annullato",
    tone: "bg-danger/10 text-danger border-danger/20",
    step: -1,
    description: "Ordine annullato.",
  },
};

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "draft", label: "Bozza" },
  { status: "matched", label: "Abbinato" },
  { status: "quote_issued", label: "Preventivo" },
  { status: "quote_accepted", label: "Accettato" },
  { status: "collection_scheduled", label: "Ritiro" },
  { status: "completed", label: "Completato" },
];

export const LISTING_STATUS_META: Record<ListingStatus, { label: string; tone: string }> = {
  draft: { label: "Bozza", tone: "bg-sand text-muted border-line" },
  active: { label: "Attivo", tone: "bg-mist text-forest border-sage/40" },
  matched: { label: "Abbinato", tone: "bg-lime/30 text-forest border-lime/60" },
  reserved: { label: "Riservato", tone: "bg-amber/15 text-amber border-amber/30" },
  sold: { label: "Venduto", tone: "bg-forest text-paper border-forest" },
  archived: { label: "Archiviato", tone: "bg-sand text-muted border-line" },
};

export const REQUEST_STATUS_META: Record<RequestStatus, { label: string; tone: string }> = {
  draft: { label: "Bozza", tone: "bg-sand text-muted border-line" },
  open: { label: "Aperto", tone: "bg-mist text-forest border-sage/40" },
  matched: { label: "Abbinato", tone: "bg-lime/30 text-forest border-lime/60" },
  fulfilled: { label: "Evaso", tone: "bg-forest text-paper border-forest" },
  closed: { label: "Chiuso", tone: "bg-sand text-muted border-line" },
};

export const CONFIDENCE_META: Record<
  MatchConfidence,
  { label: string; tone: string; dot: string }
> = {
  strong: {
    label: "Candidato solido",
    tone: "bg-forest text-paper border-forest",
    dot: "bg-lime",
  },
  review: {
    label: "Richiede revisione tecnica",
    tone: "bg-amber/15 text-amber border-amber/35",
    dot: "bg-amber",
  },
  weak: {
    label: "Bassa affidabilità",
    tone: "bg-sand text-muted border-line",
    dot: "bg-muted",
  },
};

export const HANDLING_OPTIONS = [
  "Su pallet",
  "In balle",
  "Sfuso",
  "Avvolto in pellicola",
  "Stoccaggio coperto",
  "Banchina di carico disponibile",
  "Carrello elevatore in loco",
  "Dichiarazione di assenza di pericoli",
];

export const COUNTRIES = [
  { code: "IT", label: "Italia", vatPrefix: "IT" },
  { code: "DE", label: "Germania", vatPrefix: "DE" },
  { code: "FR", label: "Francia", vatPrefix: "FR" },
  { code: "ES", label: "Spagna", vatPrefix: "ES" },
  { code: "NL", label: "Paesi Bassi", vatPrefix: "NL" },
  { code: "AT", label: "Austria", vatPrefix: "AT" },
];

export const CITIES: { city: string; country: string; lat: number; lng: number; postalCode: string }[] = [
  { city: "Milano", country: "IT", lat: 45.4642, lng: 9.19, postalCode: "20121" },
  { city: "Torino", country: "IT", lat: 45.0703, lng: 7.6869, postalCode: "10121" },
  { city: "Bologna", country: "IT", lat: 44.4949, lng: 11.3426, postalCode: "40121" },
  { city: "Verona", country: "IT", lat: 45.4384, lng: 10.9916, postalCode: "37121" },
  { city: "Padova", country: "IT", lat: 45.4064, lng: 11.8768, postalCode: "35121" },
  { city: "Brescia", country: "IT", lat: 45.5416, lng: 10.2118, postalCode: "25121" },
  { city: "Modena", country: "IT", lat: 44.6471, lng: 10.9252, postalCode: "41121" },
  { city: "Bergamo", country: "IT", lat: 45.6983, lng: 9.6773, postalCode: "24121" },
  { city: "Ravenna", country: "IT", lat: 44.4184, lng: 12.2035, postalCode: "48121" },
  { city: "Monza", country: "IT", lat: 45.5845, lng: 9.2744, postalCode: "20900" },
  { city: "Monaco di Baviera", country: "DE", lat: 48.1351, lng: 11.582, postalCode: "80331" },
  { city: "Lione", country: "FR", lat: 45.764, lng: 4.8357, postalCode: "69001" },
];

export const DEMO_EMAILS = {
  buyer: "elena.ricci@northwind.demo",
  supplier: "marco.bianchi@greenloop.demo",
} as const;

export const DEMO_PASSWORD = "circular2026";
