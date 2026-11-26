import type { QuotePayload } from "./schema";

export type QuoteEmailInput = {
  id: string;
  reference: string;
  createdAt: string;
  payload: Required<Pick<QuotePayload, "intent" | "material" | "quantityKg" | "zone" | "email">> & QuotePayload;
  userAgent?: string;
  referrer?: string;
};

export type EmailResult =
  | { sent: true; confirmationSent: boolean; confirmationDetail?: string }
  | { sent: false; reason: "not_configured" | "provider_error"; detail?: string };

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function fromAddress(): string {
  return process.env.QUOTE_FROM_EMAIL?.trim() || "Offcut <onboarding@resend.dev>";
}

export function teamAddress(): string | undefined {
  return process.env.QUOTE_NOTIFICATION_EMAIL?.trim() || undefined;
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all-andrea-grecos-projects.vercel.app").replace(/\/$/, "");
}

const LABELS = {
  it: {
    have: "Ho materiale",
    search: "Cerco materiale",
    material: "Materiale",
    quantity: "Quantità",
    zone: "Zona",
    email: "Email",
    company: "Azienda",
    notes: "Note",
    received: "Richiesta ricevuta",
    reference: "Riferimento",
    next: "Ti rispondiamo entro 48 ore lavorative con un preventivo consegnato.",
    notQuote: "Questa è una richiesta di preventivo, non un prezzo emesso: il costo finale sarà confermato dopo la verifica del materiale.",
    summary: "Riepilogo della richiesta",
    reply: "Puoi rispondere direttamente a questa email.",
    notStored: "Questa è una conferma automatica: non serve rispondere se non hai inviato tu la richiesta.",
  },
  en: {
    have: "I have material",
    search: "I'm looking for material",
    material: "Material",
    quantity: "Quantity",
    zone: "Area",
    email: "Email",
    company: "Company",
    notes: "Notes",
    received: "Request received",
    reference: "Reference",
    next: "We'll reply within 48 working hours with a delivered quote.",
    notQuote: "This is a quote request, not an issued price: the final cost will be confirmed after the material has been checked.",
    summary: "Request summary",
    reply: "You can reply directly to this email.",
    notStored: "This is an automatic confirmation: no action needed if you did not send this request.",
  },
} as const;

function rows(input: QuoteEmailInput, lang: "it" | "en"): Array<[string, string]> {
  const l = LABELS[lang];
  const p = input.payload;
  const list: Array<[string, string]> = [
    [l.material, p.material],
    [l.quantity, `${p.quantityKg.toLocaleString(lang === "it" ? "it-IT" : "en-GB")} kg`],
    [l.zone, p.zone],
    [l.email, p.email],
  ];
  if (p.company) list.push([l.company, p.company]);
  if (p.notes) list.push([l.notes, p.notes]);
  return list;
}

function summaryTable(input: QuoteEmailInput, lang: "it" | "en"): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;font-size:14px;line-height:1.5;color:#1c2b24">
${rows(input, lang)
  .map(
    ([label, value]) =>
      `<tr><td style="padding:6px 12px 6px 0;color:#5b6b62;white-space:nowrap;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;vertical-align:top">${escapeHtml(value)}</td></tr>`,
  )
  .join("\n")}
</table>`;
}

function teamHtml(input: QuoteEmailInput): string {
  const p = input.payload;
  const intent = p.intent === "have" ? LABELS.it.have : LABELS.it.search;
  return `<!doctype html><html lang="it"><body style="margin:0;background:#f6f5ef;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe3da;border-radius:16px;padding:24px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b62">Offcut · ${escapeHtml(input.reference)}</p>
  <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;color:#14261d">Nuova richiesta di preventivo</h1>
  <p style="margin:0 0 16px;font-size:15px;color:#1c2b24"><strong>${escapeHtml(intent)}</strong></p>
  ${summaryTable(input, "it")}
  <hr style="border:none;border-top:1px solid #dfe3da;margin:20px 0" />
  <p style="margin:0;font-size:12px;color:#5b6b62">Ricevuta il ${escapeHtml(new Date(input.createdAt).toLocaleString("it-IT", { timeZone: "Europe/Rome" }))} · ${escapeHtml(siteUrl())}/preventivo</p>
  ${input.referrer ? `<p style="margin:6px 0 0;font-size:12px;color:#5b6b62">Referrer: ${escapeHtml(input.referrer)}</p>` : ""}
  ${input.userAgent ? `<p style="margin:6px 0 0;font-size:12px;color:#5b6b62">User agent: ${escapeHtml(input.userAgent.slice(0, 200))}</p>` : ""}
  <p style="margin:16px 0 0;font-size:13px;color:#1c2b24">Rispondi a questa email per scrivere direttamente al richiedente.</p>
</div></body></html>`;
}

function confirmationHtml(input: QuoteEmailInput, lang: "it" | "en"): string {
  const l = LABELS[lang];
  return `<!doctype html><html lang="${lang}"><body style="margin:0;background:#f6f5ef;padding:24px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
<div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dfe3da;border-radius:16px;padding:24px">
  <p style="margin:0 0 4px;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#5b6b62">Offcut · ${escapeHtml(input.reference)}</p>
  <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#14261d">${escapeHtml(l.received)}</h1>
  <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#1c2b24">${escapeHtml(l.next)}</p>
  <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#5b6b62">${escapeHtml(l.notQuote)}</p>
  <p style="margin:0 0 8px;font-size:13px;color:#5b6b62">${escapeHtml(l.summary)}</p>
  ${summaryTable(input, lang)}
  <hr style="border:none;border-top:1px solid #dfe3da;margin:20px 0" />
  <p style="margin:0;font-size:13px;line-height:1.6;color:#1c2b24">${escapeHtml(l.reply)}<br />${escapeHtml(l.notStored)}</p>
</div></body></html>`;
}

async function sendOne(params: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ ok: true } | { ok: false; detail: string }> {
  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${params.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress(),
        to: [params.to],
        subject: params.subject,
        html: params.html,
        ...(params.replyTo ? { reply_to: params.replyTo } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, detail: `resend_${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, detail: error instanceof Error ? error.message.slice(0, 300) : "network_error" };
  }
}

/**
 * Sends the internal notification and (best effort) the requester confirmation.
 * Never throws: the API must still persist the lead when email is unavailable.
 */
export async function sendQuoteEmails(input: QuoteEmailInput): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const team = teamAddress();
  if (!apiKey || !team) {
    return { sent: false, reason: "not_configured" };
  }

  const notification = await sendOne({
    apiKey,
    to: team,
    subject: `[Offcut] ${input.reference} · ${input.payload.material} · ${input.payload.quantityKg.toLocaleString("it-IT")} kg`,
    html: teamHtml(input),
    replyTo: input.payload.email,
  });

  if (!notification.ok) {
    return { sent: false, reason: "provider_error", detail: notification.detail };
  }

  const lang = input.payload.locale === "en" ? "en" : "it";
  const confirmation = await sendOne({
    apiKey,
    to: input.payload.email,
    subject:
      lang === "en"
        ? `Offcut · request ${input.reference} received`
        : `Offcut · richiesta ${input.reference} ricevuta`,
    html: confirmationHtml(input, lang),
    replyTo: team,
  });

  return {
    sent: true,
    confirmationSent: confirmation.ok,
    ...(confirmation.ok ? {} : { confirmationDetail: confirmation.detail }),
  };
}
