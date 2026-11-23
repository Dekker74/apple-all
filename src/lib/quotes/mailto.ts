import type { QuotePayload } from "./schema";

type MailtoInput = {
  to: string;
  reference?: string | null;
  payload: QuotePayload;
  lang: "it" | "en";
  siteUrl?: string;
};

/**
 * Verified-domain email is still the preferred server-side path. Until a domain
 * is connected, this handoff lets any recipient receive the request from the
 * user's own mail client, with the full summary prefilled.
 */
export function buildQuoteMailto({ to, reference, payload, lang, siteUrl }: MailtoInput): string {
  const subject =
    lang === "en"
      ? `Offcut · quote request ${reference ?? ""}`.trim()
      : `Offcut · richiesta preventivo ${reference ?? ""}`.trim();

  const lines =
    lang === "en"
      ? [
          `Reference: ${reference ?? "pending"}`,
          `I have material: ${payload.intent === "have" ? "yes" : "no"}`,
          `Material: ${payload.material}`,
          `Quantity: ${payload.quantityKg.toLocaleString("en-GB")} kg`,
          `Area: ${payload.zone}`,
          payload.company ? `Company: ${payload.company}` : "",
          payload.notes ? `Notes: ${payload.notes}` : "",
          siteUrl ? `Open Offcut: ${siteUrl}/preventivo` : "",
        ]
      : [
          `Riferimento: ${reference ?? "in attesa"}`,
          `Ho materiale: ${payload.intent === "have" ? "sì" : "no"}`,
          `Materiale: ${payload.material}`,
          `Quantità: ${payload.quantityKg.toLocaleString("it-IT")} kg`,
          `Zona: ${payload.zone}`,
          payload.company ? `Azienda: ${payload.company}` : "",
          payload.notes ? `Note: ${payload.notes}` : "",
          siteUrl ? `Apri Offcut: ${siteUrl}/preventivo` : "",
        ];

  const body = lines.filter(Boolean).join("\n").slice(0, 1800);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
