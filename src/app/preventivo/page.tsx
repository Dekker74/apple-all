"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, Check, CheckCircle2, Info, Loader2 } from "lucide-react";
import { OffcutShell } from "@/components/offcut/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { CitySelector } from "@/components/city-selector";

type Intent = "have" | "search";
type FieldKey = "intent" | "material" | "quantityKg" | "zone" | "email" | "notes" | "consent";
type FieldErrors = Partial<Record<FieldKey, string>>;
type Status = "idle" | "sending" | "success" | "error";

type ApiSuccess = {
  ok: true;
  id: string | null;
  reference: string | null;
  emailSent: boolean;
  confirmationSent?: boolean;
  mailto?: string;
  persisted: boolean;
  warning?: string;
};

const COPY = {
  it: {
    eyebrow: "Preventivo",
    title: "Richiedi un preventivo",
    desc: "Pochi campi, nessuna password. Ti rispondiamo entro 48 ore lavorative con un prezzo consegnato: questa pagina non emette un prezzo.",
    intentLabel: "Cosa ti serve?",
    intentHave: "Ho materiale",
    intentSearch: "Cerco materiale",
    notes: "Note (facoltative)",
    quantityPlaceholder: "es. 5.000",
    submit: "Invia richiesta",
    success: "Richiesta ricevuta",
    successDesc: "Grazie. Un nostro referente ti risponderà all'indirizzo indicato entro 48 ore lavorative.",
    back: "Torna alla home",
    company: "Azienda (facoltativa)",
    companyPlaceholder: "Ragione sociale",
    consent: "Accetto l'informativa privacy e l'uso dei dati per essere ricontattato su questa richiesta.",
    consentError: "Per inviare la richiesta devi accettare l'informativa privacy.",
    sending: "Invio in corso…",
    errorTitle: "Non siamo riusciti a inviare la richiesta",
    errorValidationTitle: "Controlla i campi",
    errorGeneric: "Riprova tra qualche istante. Se il problema continua, riprova dal modulo preventivo.",
    errorValidation: "Controlla i campi evidenziati qui sotto.",
    errorRate: "Hai inviato troppe richieste da questo indirizzo. Riprova tra qualche minuto.",
    errorNetwork: "Connessione assente o risposta non valida. Controlla la rete e riprova.",
    reference: "Riferimento",
    successNext: "Cosa succede ora",
    next1: "Verifichiamo specifiche, volumi e zona di ritiro a Bologna.",
    next2: "Ti inviamo un preventivo con un solo prezzo consegnato.",
    next3: "Se ti convince, organizziamo ritiro, lavorazione e trasporto; tu scegli la data di consegna.",
    successEmail: "Ti abbiamo inviato una copia della richiesta via email.",
    manual: "Scrivi al team Offcut",
    panelTitle: "Cosa ottieni",
    panel1: "Risposta entro 48 ore lavorative.",
    panel2: "Un prezzo consegnato: materiale, lavorazione e trasporto.",
    panel3: "Specifiche e controllo qualità documentati.",
    panel4: "Nessun costo per chiedere il preventivo.",
    panelNote: "Se i volumi non sono ancora definiti, indica una stima: la sistemiamo insieme.",
    fieldsRequired: "I campi contrassegnati con * sono obbligatori.",
    errEmail: "Inserisci un indirizzo email valido.",
    errQuantity: "Indica una quantità tra 1 e 1.000.000 kg.",
    errZone: "Indica una città tra quelle disponibili per il ritiro.",
    errMaterial: "Seleziona un materiale.",
    material: "Materiale",
    materialPlaceholder: "Seleziona un materiale",
    quantity: "Quantità indicativa (kg)",
    zone: "Zona di ritiro",
    email: "Email di lavoro",
    paper: "Carta e cartone",
    wood: "Legno",
    plastic: "Plastica",
    privacy: "Privacy",
    zoneHint: "Per il lancio operiamo solo a Bologna e nei comuni limitrofi.",
    notQuote: "Questa è una richiesta: il prezzo sarà confermato dopo la verifica del materiale, non è un preventivo emesso.",
    warningNotConfigured: "La conferma automatica via email non è disponibile in questo momento. La richiesta è comunque salvata: conserva il riferimento qui sopra e, se non ricevi risposta entro 48 ore lavorative, riprova dal modulo preventivo.",
    warningDeliveryFailed: "La conferma automatica non è stata consegnata. La richiesta è salvata: conserva il riferimento qui sopra e riprova dal modulo preventivo.",
    warningNoStorage: "L'archiviazione automatica non è disponibile: conserva il riferimento qui sopra e riprova dal modulo preventivo.",
    mailtoTitle: "Vuoi inviarla tu?",
    mailtoIntro: "Se preferisci, apri la tua app email con il riepilogo già compilato e invialo al team Offcut.",
    mailtoButton: "Apri l'email con il riepilogo",
  },
  en: {
    eyebrow: "Quote",
    title: "Request a quote",
    desc: "A few fields, no password. We reply within 48 working hours with one delivered price: this page does not issue a price.",
    intentLabel: "What do you need?",
    intentHave: "I have material",
    intentSearch: "I'm looking for material",
    notes: "Notes (optional)",
    quantityPlaceholder: "e.g. 5,000",
    submit: "Send request",
    success: "Request received",
    successDesc: "Thank you. A member of our team will reply to the address you provided within 48 working hours.",
    back: "Back to home",
    company: "Company (optional)",
    companyPlaceholder: "Company name",
    consent: "I accept the privacy policy and the use of my data to be contacted about this request.",
    consentError: "You must accept the privacy policy to send the request.",
    sending: "Sending…",
    errorTitle: "We couldn't send your request",
    errorValidationTitle: "Check the fields",
    errorGeneric: "Try again in a moment. If the problem persists, try the quote form again.",
    errorValidation: "Check the highlighted fields below.",
    errorRate: "Too many requests from this address. Try again in a few minutes.",
    errorNetwork: "No connection or invalid response. Check your network and try again.",
    reference: "Reference",
    successNext: "What happens next",
    next1: "We check specifications, volumes and the pick-up area in Bologna.",
    next2: "We send you a quote with one delivered price.",
    next3: "If it works for you, we arrange pick-up, processing and transport; you choose the delivery date.",
    successEmail: "We emailed you a copy of the request.",
    manual: "Contact the Offcut team",
    panelTitle: "What you get",
    panel1: "A reply within 48 working hours.",
    panel2: "One delivered price: material, processing and transport.",
    panel3: "Documented specifications and quality control.",
    panel4: "No cost to request a quote.",
    panelNote: "If volumes are not final yet, give an estimate: we'll adjust it together.",
    fieldsRequired: "Fields marked * are required.",
    errEmail: "Enter a valid email address.",
    errQuantity: "Enter a quantity between 1 and 1,000,000 kg.",
    errZone: "Choose one of the available pick-up towns.",
    errMaterial: "Select a material.",
    material: "Material",
    materialPlaceholder: "Select a material",
    quantity: "Approx. quantity (kg)",
    zone: "Pick-up area",
    email: "Work email",
    paper: "Paper & cardboard",
    wood: "Wood",
    plastic: "Plastic",
    privacy: "Privacy",
    zoneHint: "At launch we operate only in Bologna and nearby towns.",
    notQuote: "This is a request, not an issued price: the final cost is confirmed after the material has been checked.",
    warningNotConfigured: "Automatic email confirmation is currently unavailable. Your request has still been saved: keep the reference above and, if you don't hear back within 48 working hours, try the quote form again.",
    warningDeliveryFailed: "The automatic confirmation could not be delivered. Your request is saved: keep the reference above and try the quote form again.",
    warningNoStorage: "Automatic storage is unavailable: keep the reference above and try the quote form again.",
    mailtoTitle: "Want to send it yourself?",
    mailtoIntro: "If you prefer, open your email app with the summary already filled in and send it to the Offcut team.",
    mailtoButton: "Open email with summary",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function QuoteForm() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const params = useSearchParams();
  const initial: Intent = params.get("role") === "buyer" ? "search" : "have";

  const [intent, setIntent] = useState<Intent>(initial);
  const [form, setForm] = useState({ material: "", quantity: "", zone: "", email: "", company: "", notes: "" });
  const [website, setWebsite] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ApiSuccess | null>(null);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const errorRef = useRef<HTMLDivElement>(null);

  const sending = status === "sending";

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function failWith(title: string, message: string, fields: FieldErrors = {}) {
    setFieldErrors(fields);
    setErrorTitle(title);
    setErrorMessage(message);
    setStatus("error");
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }

  function errorsFromApi(fields?: Record<string, string>): FieldErrors {
    if (!fields) return {};
    const map: Record<string, FieldKey> = {
      material: "material",
      quantityKg: "quantityKg",
      zone: "zone",
      email: "email",
      notes: "notes",
      consent: "consent",
    };
    const out: FieldErrors = {};
    for (const [key, mapped] of Object.entries(map)) {
      if (!fields[key]) continue;
      if (mapped === "material") out.material = c.errMaterial;
      if (mapped === "quantityKg") out.quantityKg = c.errQuantity;
      if (mapped === "zone") out.zone = c.errZone;
      if (mapped === "email") out.email = c.errEmail;
      if (mapped === "consent") out.consent = c.consentError;
    }
    return out;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    const fields: FieldErrors = {};
    if (!form.material) fields.material = c.errMaterial;
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1_000_000) fields.quantityKg = c.errQuantity;
    if (form.zone.trim().length < 2) fields.zone = c.errZone;
    if (!EMAIL_RE.test(form.email.trim())) fields.email = c.errEmail;
    if (!consent) fields.consent = c.consentError;

    if (Object.keys(fields).length > 0) {
      failWith(c.errorValidationTitle, c.errorValidation, fields);
      return;
    }

    setStatus("sending");
    setErrorMessage("");

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intent,
          material: form.material,
          quantityKg: Math.round(quantity),
          zone: form.zone.trim(),
          email: form.email.trim(),
          company: form.company.trim() || undefined,
          notes: form.notes.trim() || undefined,
          locale: lang,
          consent: true,
          website,
          clientRequestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | (ApiSuccess & { error?: string; fields?: Record<string, string> })
        | null;

      if (!response.ok || !data || data.ok !== true) {
        if (response.status === 429) {
          failWith(c.errorTitle, c.errorRate);
        } else if (response.status === 400) {
          failWith(c.errorValidationTitle, c.errorValidation, errorsFromApi(data?.fields));
        } else {
          failWith(c.errorTitle, c.errorGeneric);
        }
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      failWith(c.errorTitle, c.errorNetwork);
    }
  }

  if (status === "success" && result) {
    const warning = result.warning ?? "";
    const emailWarning = warning.includes("email_not_configured")
      ? c.warningNotConfigured
      : warning.includes("email_delivery_failed")
        ? c.warningDeliveryFailed
        : null;
    const storageWarning = warning.includes("storage_unavailable") ? c.warningNoStorage : null;

    return (
      <OffcutShell>
        <div className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <CheckCircle2 className="size-12 text-moss" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-5 text-[32px] leading-tight sm:text-[38px]">{c.success}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">{c.successDesc}</p>

            {result.reference ? (
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line bg-paper px-4 py-3">
                <span className="text-[13px] uppercase tracking-[0.08em] text-muted">{c.reference}</span>
                <span className="font-mono text-[18px] font-medium text-ink">{result.reference}</span>
              </div>
            ) : null}

            <p className="mt-4 flex items-start gap-2 text-[14px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-4 shrink-0 text-moss" aria-hidden /> {c.notQuote}
            </p>

            <h2 className="mt-8 text-[20px] leading-tight">{c.successNext}</h2>
            <ol className="mt-3 space-y-2 text-[16px] leading-relaxed text-muted">
              {[c.next1, c.next2, c.next3].map((step, index) => (
                <li key={step} className="flex gap-3">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-forest text-[12px] font-medium text-paper">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>

            {result.confirmationSent ? (
              <p className="mt-6 flex items-start gap-2 text-[15px] leading-relaxed text-muted">
                <Check className="mt-0.5 size-4 shrink-0 text-moss" aria-hidden />
                <span>{c.successEmail}</span>
              </p>
            ) : null}

            {emailWarning || storageWarning ? (
              <div className="mt-6 space-y-2 rounded-xl border border-moss/30 bg-mint/40 px-4 py-3" role="status">
                {emailWarning ? <p className="text-[14px] leading-relaxed text-ink">{emailWarning}</p> : null}
                {storageWarning ? <p className="text-[14px] leading-relaxed text-ink">{storageWarning}</p> : null}
              </div>
            ) : null}

            {result.mailto ? (
              <div className="mt-6 rounded-xl border border-line bg-paper px-4 py-3">
                <p className="text-[15px] font-medium text-ink">{c.mailtoTitle}</p>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{c.mailtoIntro}</p>
                <Button asChild size="sm" className="mt-3">
                  <a href={result.mailto}>{c.mailtoButton}</a>
                </Button>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild>
                <Link href="/">{c.back}</Link>
              </Button>
            </div>
          </div>
        </div>
      </OffcutShell>
    );
  }

  const intents: { value: Intent; label: string }[] = [
    { value: "have", label: c.intentHave },
    { value: "search", label: c.intentSearch },
  ];

  const inputClass = "mt-1.5";
  const invalidClass = "border-danger";

  return (
    <OffcutShell>
      <div className="offcut-grid2">
        <div>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="mt-3 text-[40px] leading-[1.1] sm:text-[42px]">{c.title}</h1>
          <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-muted">{c.desc}</p>

          <form onSubmit={handleSubmit} noValidate className="card space-y-5">
            <div
              ref={errorRef}
              tabIndex={-1}
              role={status === "error" ? "alert" : undefined}
              aria-live="polite"
              className={status === "error" ? "rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-[15px] leading-relaxed text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger" : "sr-only"}
            >
              {status === "error" ? (
                <span className="flex items-start gap-2">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>
                    <strong className="block font-medium">{errorTitle}</strong>
                    {errorMessage}
                  </span>
                </span>
              ) : null}
            </div>

            <fieldset>
              <legend className="field-label">{c.intentLabel}</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-paper p-1" role="radiogroup" aria-label={c.intentLabel}>
                {intents.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    role="radio"
                    aria-checked={intent === item.value}
                    onClick={() => setIntent(item.value)}
                    disabled={sending}
                    className={`min-h-[48px] rounded-lg px-3 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-moss ${
                      intent === item.value ? "bg-forest text-paper" : "text-muted hover:text-ink"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="material" className="field-label">{c.material} *</label>
              <Select
                id="material"
                required
                value={form.material}
                placeholder={c.materialPlaceholder}
                onChange={(e) => update("material", e.target.value)}
                disabled={sending}
                aria-invalid={Boolean(fieldErrors.material)}
                aria-describedby={fieldErrors.material ? "material-error" : undefined}
                className={`${inputClass} ${fieldErrors.material ? invalidClass : ""}`}
              >
                <option value="Carta e cartone">{c.paper}</option>
                <option value="Legno">{c.wood}</option>
                <option value="Plastica">{c.plastic}</option>
              </Select>
              {fieldErrors.material ? <p id="material-error" className="mt-1.5 text-[13px] text-danger">{fieldErrors.material}</p> : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="quantity" className="field-label">{c.quantity} *</label>
                <Input
                  id="quantity"
                  type="number"
                  inputMode="numeric"
                  min="1"
                  max="1000000"
                  step="1"
                  required
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                  placeholder={c.quantityPlaceholder}
                  disabled={sending}
                  aria-invalid={Boolean(fieldErrors.quantityKg)}
                  aria-describedby={fieldErrors.quantityKg ? "quantity-error" : "quantity-hint"}
                  className={`${inputClass} ${fieldErrors.quantityKg ? invalidClass : ""}`}
                />
                <p id="quantity-hint" className="mt-1.5 text-[13px] text-muted">kg</p>
                {fieldErrors.quantityKg ? <p id="quantity-error" className="mt-1 text-[13px] text-danger">{fieldErrors.quantityKg}</p> : null}
              </div>
              <div className="sm:col-span-2">
                <CitySelector
                  label={`${c.zone} *`}
                  value={form.zone}
                  onChange={(city) => update("zone", city)}
                  required
                />
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{c.zoneHint}</p>
                {fieldErrors.zone ? <p id="zone-error" className="mt-1.5 text-[13px] text-danger">{fieldErrors.zone}</p> : null}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="field-label">{c.company}</label>
              <Input
                id="company"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder={c.companyPlaceholder}
                maxLength={120}
                disabled={sending}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">{c.email} *</label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="nome@azienda.it"
                disabled={sending}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
                className={`${inputClass} ${fieldErrors.email ? invalidClass : ""}`}
              />
              {fieldErrors.email ? <p id="email-error" className="mt-1.5 text-[13px] text-danger">{fieldErrors.email}</p> : null}
            </div>

            <div>
              <label htmlFor="notes" className="field-label">{c.notes}</label>
              <Textarea
                id="notes"
                rows={4}
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                maxLength={2000}
                disabled={sending}
                className={inputClass}
              />
            </div>

            {/* Honeypot: hidden from people, filled by bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-start gap-3">
                <input
                  id="consent"
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(e) => {
                    setConsent(e.target.checked);
                    setFieldErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  disabled={sending}
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "consent-error" : undefined}
                  className="mt-1 size-4 shrink-0 rounded border-line accent-forest focus-visible:ring-2 focus-visible:ring-moss"
                />
                <label htmlFor="consent" className="text-[14px] leading-relaxed text-ink">
                  {c.consent}{" "}
                  <Link href="/privacy" className="font-medium text-forest underline underline-offset-4 hover:text-ink">
                    {c.privacy}
                  </Link>
                </label>
              </div>
              {fieldErrors.consent ? <p id="consent-error" className="mt-1.5 text-[13px] text-danger">{fieldErrors.consent}</p> : null}
            </div>

            <p className="flex items-start gap-2 rounded-xl border border-line bg-paper px-3 py-2.5 text-[13px] leading-relaxed text-muted">
              <Info className="mt-0.5 size-3.5 shrink-0 text-moss" aria-hidden /> {c.notQuote}
            </p>

            <Button type="submit" size="lg" className="w-full" disabled={sending} aria-busy={sending}>
              {sending ? (
                <><Loader2 className="size-4 animate-spin" aria-hidden /> {c.sending}</>
              ) : (
                <>{c.submit} <ArrowRight className="size-4" aria-hidden /></>
              )}
            </Button>

            <p className="text-center text-[13px] leading-relaxed text-muted">{c.fieldsRequired}</p>
          </form>
        </div>

        <aside className="card">
          <h2 className="text-[18px] leading-tight">{c.panelTitle}</h2>
          <ul className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
            {[c.panel1, c.panel2, c.panel3, c.panel4].map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-1 size-4 shrink-0 text-moss" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">{c.panelNote}</p>
        </aside>
      </div>
    </OffcutShell>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<OffcutShell><p className="eyebrow">Offcut</p></OffcutShell>}>
      <QuoteForm />
    </Suspense>
  );
}
