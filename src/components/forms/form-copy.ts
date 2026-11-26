import type { Bilingual } from "./use-local-copy";
import type { ListingStatus, RequestStatus } from "@/types";

/** Copy condivisa dei form. È volutamente locale: nessuna modifica a i18n.tsx. */

export const CATEGORY_COPY = {
  it: {
    paper_cardboard: {
      label: "Carta e cartone",
      short: "Carta",
      blurb: "OCC, ritagli kraft, carta da disinchiostro, carta da ufficio.",
    },
    wood: {
      label: "Legno",
      short: "Legno",
      blurb: "Ritagli essiccati in forno, legno da pallet, segatura, MDF.",
    },
    plastic: {
      label: "Plastica",
      short: "Plastica",
      blurb: "Film LDPE, fiocchi rPET, granuli HDPE, sacchi PP.",
    },
  },
  en: {
    paper_cardboard: {
      label: "Paper and cardboard",
      short: "Paper",
      blurb: "OCC, kraft offcuts, de-inking paper, office paper.",
    },
    wood: {
      label: "Wood",
      short: "Wood",
      blurb: "Kiln-dried offcuts, pallet wood, sawdust, MDF.",
    },
    plastic: {
      label: "Plastic",
      short: "Plastic",
      blurb: "LDPE film, rPET flakes, HDPE pellets, PP bags.",
    },
  },
} as const;

export const CONDITION_COPY = {
  it: {
    clean: { label: "Pulito", hint: "Flusso unico e omogeneo" },
    mixed: { label: "Misto", hint: "Flussi misti, separabili" },
    needs_processing: {
      label: "Da lavorare",
      hint: "Lavaggio, cernita o rigranulazione",
    },
  },
  en: {
    clean: { label: "Clean", hint: "Single, homogeneous stream" },
    mixed: { label: "Mixed", hint: "Mixed streams, separable" },
    needs_processing: {
      label: "Needs processing",
      hint: "Washing, sorting or re-pelletising",
    },
  },
} as const;

export const PROCESSING_COPY: Record<
  "sorting" | "washing" | "shredding" | "pelletizing" | "deinking" | "drying" | "baling",
  Bilingual<string>
> = {
  sorting: { it: "Cernita e QC", en: "Sorting and QC" },
  washing: { it: "Lavaggio", en: "Washing" },
  shredding: { it: "Triturazione / macinazione", en: "Shredding / grinding" },
  pelletizing: { it: "Rigranulazione", en: "Re-pelletising" },
  deinking: { it: "Disinchiostro", en: "De-inking" },
  drying: { it: "Asciugatura", en: "Drying" },
  baling: { it: "Imballaggio in balle", en: "Baling" },
};

export const HANDLING_COPY: Record<string, Bilingual<string>> = {
  "Su pallet": { it: "Su pallet", en: "On pallets" },
  "In balle": { it: "In balle", en: "In bales" },
  Sfuso: { it: "Sfuso", en: "Bulk" },
  "Avvolto in pellicola": { it: "Avvolto in pellicola", en: "Shrink-wrapped" },
  "Stoccaggio coperto": { it: "Stoccaggio coperto", en: "Covered storage" },
  "Banchina di carico disponibile": {
    it: "Banchina di carico disponibile",
    en: "Loading dock available",
  },
  "Carrello elevatore in loco": {
    it: "Carrello elevatore in loco",
    en: "Forklift on site",
  },
  "Dichiarazione di assenza di pericoli": {
    it: "Dichiarazione di assenza di pericoli",
    en: "Non-hazardous declaration",
  },
};

export const FREQUENCY_COPY: Record<
  "one_off" | "weekly" | "monthly" | "quarterly",
  Bilingual<string>
> = {
  one_off: { it: "Acquisto una tantum", en: "One-off purchase" },
  weekly: { it: "Ricorrenza settimanale", en: "Weekly recurrence" },
  monthly: { it: "Ricorrenza mensile", en: "Monthly recurrence" },
  quarterly: { it: "Ricorrenza trimestrale", en: "Quarterly recurrence" },
};

export const LISTING_STATUS_COPY: Record<ListingStatus, Bilingual<string>> = {
  draft: { it: "Bozza", en: "Draft" },
  active: { it: "Attivo", en: "Active" },
  matched: { it: "Abbinato", en: "Matched" },
  reserved: { it: "Riservato", en: "Reserved" },
  sold: { it: "Venduto", en: "Sold" },
  archived: { it: "Archiviato", en: "Archived" },
};

export const REQUEST_STATUS_COPY: Record<RequestStatus, Bilingual<string>> = {
  draft: { it: "Bozza", en: "Draft" },
  open: { it: "Aperta", en: "Open" },
  matched: { it: "Abbinata", en: "Matched" },
  fulfilled: { it: "Evasa", en: "Fulfilled" },
  closed: { it: "Chiusa", en: "Closed" },
};

export const STATUS_TONE: Record<string, string> = {
  draft: "border-line bg-sand text-muted",
  active: "border-moss/25 bg-mist/60 text-moss",
  open: "border-moss/25 bg-mist/60 text-moss",
  matched: "border-sage/30 bg-mist/50 text-forest",
  reserved: "border-sage/30 bg-mist/50 text-forest",
  sold: "border-line bg-paper text-muted",
  archived: "border-line bg-paper text-muted",
  fulfilled: "border-line bg-paper text-muted",
  closed: "border-line bg-paper text-muted",
};

export function localLabel(entry: Bilingual<string> | undefined, lang: "it" | "en"): string {
  return entry ? entry[lang] : "—";
}
