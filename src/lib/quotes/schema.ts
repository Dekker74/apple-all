export type QuoteIntent = "have" | "search";
export type QuoteLocale = "it" | "en";

export type QuotePayload = {
  intent: QuoteIntent;
  material: string;
  quantityKg: number;
  zone: string;
  email: string;
  company?: string;
  notes?: string;
  locale?: QuoteLocale;
  website?: string;
  clientRequestId?: string;
};

export type QuoteField = "intent" | "material" | "quantityKg" | "zone" | "email" | "company" | "notes";

export type ValidationResult =
  | { ok: true; value: Required<Pick<QuotePayload, "intent" | "material" | "quantityKg" | "zone" | "email">> & QuotePayload }
  | { ok: false; error: string; fields?: Partial<Record<QuoteField, string>> };

const MATERIALS = new Set(["Carta e cartone", "Legno", "Plastica"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function validateQuotePayload(input: unknown): ValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "invalid_body" };
  }
  const body = input as Record<string, unknown>;
  const fields: Partial<Record<QuoteField, string>> = {};

  // Honeypot: bots fill hidden fields. Pretend success upstream, never store.
  if (str(body.website).length > 0) {
    return { ok: false, error: "spam" };
  }

  const intent = str(body.intent);
  if (intent !== "have" && intent !== "search") fields.intent = "required";

  const material = str(body.material);
  if (!MATERIALS.has(material)) fields.material = "invalid";

  const rawQuantity = typeof body.quantityKg === "number" ? body.quantityKg : Number(str(body.quantityKg).replace(/[.\s]/g, "").replace(",", "."));
  const quantityKg = Number.isFinite(rawQuantity) ? Math.round(rawQuantity) : NaN;
  if (!Number.isFinite(quantityKg) || quantityKg < 1 || quantityKg > 1_000_000) fields.quantityKg = "invalid";

  const zone = str(body.zone);
  if (zone.length < 2 || zone.length > 80) fields.zone = "invalid";

  const email = str(body.email).toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) fields.email = "invalid";

  const company = str(body.company);
  if (company.length > 120) fields.company = "too_long";

  const notes = str(body.notes);
  if (notes.length > 2000) fields.notes = "too_long";

  const locale = str(body.locale) === "en" ? "en" : "it";
  const clientRequestId = str(body.clientRequestId).slice(0, 64) || undefined;

  if (Object.keys(fields).length > 0) {
    return { ok: false, error: "validation_failed", fields };
  }

  return {
    ok: true,
    value: {
      intent: intent as QuoteIntent,
      material,
      quantityKg,
      zone,
      email,
      company: company || undefined,
      notes: notes || undefined,
      locale,
      clientRequestId,
    },
  };
}

export function referenceFromId(id: string): string {
  return `CL-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
