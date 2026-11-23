"use client";

import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, Check, Loader2 } from "lucide-react";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

function QuoteForm() {
  const { t, lang } = useI18n();
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;

    const fields: FieldErrors = {};
    if (!form.material) fields.material = t("quote.errMaterial");
    const quantity = Number(form.quantity);
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 1_000_000) fields.quantityKg = t("quote.errQuantity");
    if (form.zone.trim().length < 2) fields.zone = t("quote.errZone");
    if (!EMAIL_RE.test(form.email.trim())) fields.email = t("quote.errEmail");
    if (!consent) fields.consent = t("quote.consentError");

    if (Object.keys(fields).length > 0) {
      failWith(t("quote.errorValidationTitle"), t("quote.errorValidation"), fields);
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
          website,
          clientRequestId: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
        }),
      });

      const data = (await response.json().catch(() => null)) as (ApiSuccess & { error?: string; fields?: Record<string, string> }) | null;

      if (!response.ok || !data || data.ok !== true) {
        if (response.status === 429) {
          failWith(t("quote.errorTitle"), t("quote.errorRate"));
        } else if (response.status === 400) {
          failWith(t("quote.errorValidationTitle"), t("quote.errorValidation"));
        } else {
          failWith(t("quote.errorTitle"), t("quote.errorGeneric"));
        }
        return;
      }

      setResult(data);
      setStatus("success");
    } catch {
      failWith(t("quote.errorTitle"), t("quote.errorNetwork"));
    }
  }

  if (status === "success" && result) {
    const hasReference = Boolean(result.reference);
    return (
      <OffcutShell>
        <div className="card" style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="rounded-2xl border border-line bg-white p-6 shadow-soft sm:p-8">
            <CheckCircle2 className="size-12 text-moss" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-5 text-[32px] leading-tight sm:text-[38px]">{t("quote.success")}</h1>
            <p className="mt-3 text-[16px] leading-relaxed text-muted">{t("quote.successDesc")}</p>

            {hasReference ? (
              <div className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-xl border border-line bg-paper px-4 py-3">
                <span className="text-[13px] uppercase tracking-[0.08em] text-muted">{t("quote.reference")}</span>
                <span className="font-mono text-[18px] font-medium text-ink">{result.reference}</span>
              </div>
            ) : null}

            <h2 className="mt-8 text-[20px] leading-tight">{t("quote.successNext")}</h2>
            <ol className="mt-3 space-y-2 text-[16px] leading-relaxed text-muted">
              {[t("quote.next1"), t("quote.next2"), t("quote.next3")].map((step, index) => (
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
                <span>{t("quote.successEmail")}</span>
              </p>
            ) : (
              <div className="mt-6 rounded-xl border border-line bg-paper px-4 py-3" role="status">
                <p className="text-[15px] leading-relaxed text-ink">
                  {lang === "en"
                    ? "Your request is saved. Automatic confirmation could not be delivered, so open your email app to send it yourself to any recipient."
                    : "La richiesta è salvata. La conferma automatica non è stata consegnata: apri la tua email per inviarla tu a qualsiasi destinatario."}
                </p>
                {result.mailto ? (
                  <Button asChild size="sm" className="mt-3">
                    <a href={result.mailto}>
                      {lang === "en" ? "Open email app" : "Apri la tua email"} · {form.email}
                    </a>
                  </Button>
                ) : null}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild>
                <Link href="/">{t("quote.back")}</Link>
              </Button>
              <Button asChild variant="outline">
                <a href={`mailto:hello@circularlink.app?subject=${encodeURIComponent(
                  `${lang === "en" ? "Quote request" : "Richiesta preventivo"}${result.reference ? ` ${result.reference}` : ""}`,
                )}`}>
                  {t("quote.manual")}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </OffcutShell>
    );
  }

  const intents: { value: Intent; label: string }[] = [
    { value: "have", label: t("quote.intentHave") },
    { value: "search", label: t("quote.intentSearch") },
  ];

  const inputClass = "mt-1.5";
  const invalidClass = "border-danger";

  return (
    <OffcutShell>
      <div className="offcut-grid2">
        <div>
          <p className="eyebrow">{t("quote.eyebrow")}</p>
          <h1 className="mt-3 text-[40px] leading-[1.1] sm:text-[42px]">{t("quote.title")}</h1>
          <p className="mt-3 max-w-[560px] text-[16px] leading-relaxed text-muted">{t("quote.desc")}</p>

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
              <legend className="field-label">{t("quote.intentLabel")}</legend>
              <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-xl border border-line bg-paper p-1" role="radiogroup" aria-label={t("quote.intentLabel")}>
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
              <label htmlFor="material" className="field-label">
                {t("signup.material")} *
              </label>
              <Select
                id="material"
                required
                value={form.material}
                placeholder={t("signup.materialPlaceholder")}
                onChange={(e) => update("material", e.target.value)}
                disabled={sending}
                aria-invalid={Boolean(fieldErrors.material)}
                aria-describedby={fieldErrors.material ? "material-error" : undefined}
                className={`${inputClass} ${fieldErrors.material ? invalidClass : ""}`}
              >
                <option value="Carta e cartone">{t("materials.paper")}</option>
                <option value="Legno">{t("materials.wood")}</option>
                <option value="Plastica">{t("materials.plastic")}</option>
              </Select>
              {fieldErrors.material ? (
                <p id="material-error" className="mt-1.5 text-[13px] text-danger">
                  {fieldErrors.material}
                </p>
              ) : null}
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="quantity" className="field-label">
                  {t("signup.quantity")} *
                </label>
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
                  placeholder={t("quote.quantityPlaceholder")}
                  disabled={sending}
                  aria-invalid={Boolean(fieldErrors.quantityKg)}
                  aria-describedby={fieldErrors.quantityKg ? "quantity-error" : "quantity-hint"}
                  className={`${inputClass} ${fieldErrors.quantityKg ? invalidClass : ""}`}
                />
                <p id="quantity-hint" className="mt-1.5 text-[13px] text-muted">
                  kg
                </p>
                {fieldErrors.quantityKg ? (
                  <p id="quantity-error" className="mt-1 text-[13px] text-danger">
                    {fieldErrors.quantityKg}
                  </p>
                ) : null}
              </div>
              <div>
                <CitySelector
                  label={`${t("signup.zone")} *`}
                  value={form.zone}
                  onChange={(city) => update("zone", city)}
                  required
                />
                {fieldErrors.zone ? (
                  <p id="zone-error" className="mt-1.5 text-[13px] text-danger">
                    {fieldErrors.zone}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="company" className="field-label">
                {t("quote.company")}
              </label>
              <Input
                id="company"
                autoComplete="organization"
                value={form.company}
                onChange={(e) => update("company", e.target.value)}
                placeholder={t("quote.companyPlaceholder")}
                maxLength={120}
                disabled={sending}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="email" className="field-label">
                {t("signup.email")} *
              </label>
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
              {fieldErrors.email ? (
                <p id="email-error" className="mt-1.5 text-[13px] text-danger">
                  {fieldErrors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="notes" className="field-label">
                {t("quote.notes")}
              </label>
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
                  {t("quote.consent")}{" "}
                  <Link href="/privacy" className="font-medium text-forest underline underline-offset-4 hover:text-ink">
                    {t("footer.privacy")}
                  </Link>
                </label>
              </div>
              {fieldErrors.consent ? (
                <p id="consent-error" className="mt-1.5 text-[13px] text-danger">
                  {fieldErrors.consent}
                </p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={sending} aria-busy={sending}>
              {sending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden /> {t("quote.sending")}
                </>
              ) : (
                <>
                  {t("quote.submit")} <ArrowRight className="size-4" aria-hidden />
                </>
              )}
            </Button>

            <p className="text-center text-[13px] leading-relaxed text-muted">{t("quote.fieldsRequired")}</p>
          </form>
        </div>

        <aside className="card">
          <h2 className="text-[18px] leading-tight">{t("quote.panelTitle")}</h2>
          <ul className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted">
            {[t("quote.panel1"), t("quote.panel2"), t("quote.panel3"), t("quote.panel4")].map((item) => (
              <li key={item} className="flex gap-2.5">
                <Check className="mt-1 size-4 shrink-0 text-moss" aria-hidden />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-[13px] leading-relaxed text-muted">{t("quote.panelNote")}</p>
          <a
            href="mailto:hello@circularlink.app"
            className="mt-4 inline-flex min-h-[44px] items-center text-[14px] font-medium text-forest underline underline-offset-4 hover:text-ink"
          >
            hello@circularlink.app
          </a>
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
