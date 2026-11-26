"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Building2,
  Check,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { OffcutShell } from "@/components/offcut/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useCurrentUser, useHydrated } from "@/lib/hooks";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Local copy: onboarding deliberately has no buyer/seller choice. Both sides
 *  of the marketplace are active for every workspace. */
const COPY = {
  it: {
    eyebrow: "Configurazione",
    title: "Configura il tuo spazio",
    sub: "Due passaggi. La registrazione è gratuita e non prevede abbonamenti.",
    step1: "Azienda",
    step1Sub: "Dati fiscali essenziali",
    step2: "Sede a Bologna",
    step2Sub: "Area operativa iniziale",
    helpTitle: "Acquisti e vendite attivi",
    help: "Dal tuo spazio puoi pubblicare materiali in eccesso e richieste di acquisto. Non devi scegliere un ruolo: usi entrambi i flussi.",
    areaTitle: "Area di lancio",
    area: "Per questa versione operiamo solo a Bologna e nella sua area. Aggiungeremo altre zone solo quando il servizio sarà disponibile.",
    stepCounter: "Passo {n} di 2",
    companyTitle: "I dati della tua azienda",
    companyDesc: "Ci servono solo per identificare lo spazio di lavoro e il preventivo.",
    company: "Ragione sociale",
    companyPlaceholder: "Es. Rossi Packaging S.r.l.",
    vat: "Partita IVA",
    vatPlaceholder: "12345678901",
    vatHint: "Solo numeri, senza spazi. Prefisso IT già incluso.",
    addressTitle: "La sede principale",
    addressDesc: "Usiamo l'indirizzo per organizzare ritiri e consegne a Bologna.",
    address: "Indirizzo",
    addressPlaceholder: "Via Emilia Est 1240",
    city: "Città",
    cityNote: "Bologna è l'unica sede disponibile al lancio.",
    postal: "CAP",
    back: "Indietro",
    next: "Continua",
    finish: "Attiva lo spazio",
    saving: "Attivazione…",
    helpLink: "Hai bisogno di aiuto? Parla con il team Offcut",
    privacy: "I dati restano nel tuo spazio di lavoro.",
    errCompany: "Inserisci la ragione sociale (almeno 2 caratteri).",
    errVat: "Inserisci una partita IVA valida: almeno 6 cifre dopo il prefisso IT.",
    errAddress: "Inserisci l'indirizzo della sede (almeno 3 caratteri).",
    errPostal: "Inserisci un CAP italiano di 5 cifre.",
    errSummaryTitle: "Controlla i campi evidenziati",
    errSummary: "Correggi i dati segnalati qui sotto per continuare.",
    errGeneric: "Non è stato possibile creare lo spazio di lavoro.",
    errRetry: "Riprova tra poco; se il problema continua, torna al login.",
    toastTitle: "Spazio di lavoro attivo",
    toastDesc: "Puoi già pubblicare materiali e richieste.",
    loading: "Caricamento…",
  },
  en: {
    eyebrow: "Setup",
    title: "Set up your workspace",
    sub: "Two steps. Registration is free and there are no subscriptions.",
    step1: "Company",
    step1Sub: "Essential tax details",
    step2: "Bologna site",
    step2Sub: "Initial service area",
    helpTitle: "Buying and selling enabled",
    help: "From your workspace you can list surplus material and post purchase requests. You don't choose a role: both flows are available.",
    areaTitle: "Launch area",
    area: "In this version we operate only in Bologna and its surroundings. Other areas will be added when the service is available there.",
    stepCounter: "Step {n} of 2",
    companyTitle: "Your company details",
    companyDesc: "We only need these to identify the workspace and the quote.",
    company: "Company name",
    companyPlaceholder: "e.g. Rossi Packaging Ltd.",
    vat: "VAT number",
    vatPlaceholder: "12345678901",
    vatHint: "Digits only, no spaces. The IT prefix is already included.",
    addressTitle: "Main site",
    addressDesc: "We use the address to organise pick-ups and deliveries in Bologna.",
    address: "Address",
    addressPlaceholder: "Via Emilia Est 1240",
    city: "City",
    cityNote: "Bologna is the only available site at launch.",
    postal: "Postcode",
    back: "Back",
    next: "Continue",
    finish: "Activate workspace",
    saving: "Activating…",
    helpLink: "Need help? Talk to the Offcut team",
    privacy: "Your data stays in your workspace.",
    errCompany: "Enter your company name (at least 2 characters).",
    errVat: "Enter a valid VAT number: at least 6 digits after the IT prefix.",
    errAddress: "Enter the site address (at least 3 characters).",
    errPostal: "Enter a valid 5-digit Italian postcode.",
    errSummaryTitle: "Check the highlighted fields",
    errSummary: "Correct the fields below to continue.",
    errGeneric: "We couldn't create your workspace.",
    errRetry: "Try again shortly; if the problem persists, go back to the login page.",
    toastTitle: "Workspace active",
    toastDesc: "You can already list materials and requests.",
    loading: "Loading…",
  },
} as const;

type FieldKey = "company" | "vat" | "address" | "postal";
type FieldErrors = Partial<Record<FieldKey, string>>;

export default function OnboardingPage() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const authChecked = useAppStore((s) => s.authChecked);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [companyName, setCompanyName] = useState("");
  const [vatDigits, setVatDigits] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("40121");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<{ title: string; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hydrated || !authChecked) return;
    if (!user) router.replace("/login");
    else if (user.onboarded) router.replace("/app/dashboard");
  }, [hydrated, authChecked, user, router]);

  function showBanner(title: string, message: string, fields: FieldErrors = {}) {
    setErrors(fields);
    setBanner({ title, message });
    window.requestAnimationFrame(() => bannerRef.current?.focus());
  }

  function validateStep(): FieldErrors {
    const found: FieldErrors = {};
    if (step === 0) {
      if (companyName.trim().length < 2) found.company = c.errCompany;
      if (!/^\d{6,}$/.test(vatDigits.replace(/\s/g, ""))) found.vat = c.errVat;
    } else {
      if (addressLine.trim().length < 3) found.address = c.errAddress;
      if (!/^\d{5}$/.test(postalCode.trim())) found.postal = c.errPostal;
    }
    return found;
  }

  function next() {
    setBanner(null);
    const found = validateStep();
    if (Object.keys(found).length > 0) {
      showBanner(c.errSummaryTitle, c.errSummary, found);
      return;
    }
    setErrors({});
    setStep(1);
  }

  function submit() {
    if (saving) return;
    setBanner(null);
    const found = validateStep();
    if (Object.keys(found).length > 0) {
      showBanner(c.errSummaryTitle, c.errSummary, found);
      return;
    }
    setSaving(true);
    try {
      completeOnboarding({
        accountRole: "business",
        orgType: "both",
        companyName: companyName.trim(),
        vatNumber: `IT${vatDigits.trim()}`,
        country: "IT",
        website: undefined,
        addressLine: addressLine.trim(),
        city: "Bologna",
        postalCode: postalCode.trim(),
        invites: [],
      });
      toast.success(c.toastTitle, { description: c.toastDesc });
      router.replace("/app/dashboard");
    } catch {
      showBanner(c.errGeneric, c.errRetry);
      setSaving(false);
    }
  }

  if (!hydrated || !authChecked || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper" role="status" aria-label={c.loading}>
        <Loader2 className="size-5 animate-spin text-muted" aria-hidden />
        <span className="sr-only">{c.loading}</span>
      </div>
    );
  }

  const steps = [
    { title: c.step1, sub: c.step1Sub },
    { title: c.step2, sub: c.step2Sub },
  ];

  return (
    <OffcutShell>
      <main className="offcut-grid2">
        <aside>
          <p className="eyebrow">{c.eyebrow}</p>
          <h1 className="mt-2 text-[30px] leading-tight">{c.title}</h1>
          <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.sub}</p>

          <ol className="mt-8 space-y-1" aria-label={c.title}>
            {steps.map((s, index) => {
              const done = index < step;
              const active = index === step;
              return (
                <li key={s.title}>
                  <button
                    type="button"
                    onClick={() => index < step && setStep(index)}
                    disabled={index > step || saving}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors",
                      active ? "bg-white shadow-sm" : "hover:bg-white/50",
                      index > step && "opacity-45",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border font-mono text-[12px]",
                        done
                          ? "border-forest bg-forest text-lime"
                          : active
                            ? "border-forest text-forest"
                            : "border-line text-muted",
                      )}
                    >
                      {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                    </span>
                    <span>
                      <span className={cn("block text-[12px]", active ? "font-medium text-ink" : "text-muted")}>
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[11.5px] text-muted/80">{s.sub}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-8 rounded-xl border border-line bg-white/50 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
              <ArrowLeftRight className="size-3.5 shrink-0 text-moss" aria-hidden /> {c.helpTitle}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{c.help}</p>
          </div>
          <div className="mt-3 rounded-xl border border-line bg-white/50 p-3.5">
            <p className="flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-muted">
              <MapPin className="size-3.5 shrink-0 text-moss" aria-hidden /> {c.areaTitle}
            </p>
            <p className="mt-2 text-[12px] leading-relaxed text-muted">{c.area}</p>
          </div>
        </aside>

        <section className="min-w-0">
          <div className="rounded-2xl border border-line bg-white p-5 shadow-soft sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <span className="font-mono text-[12px] uppercase tracking-[0.16em] text-muted">
                {c.stepCounter.replace("{n}", String(step + 1))}
              </span>
              <div className="flex gap-1" aria-hidden>
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={cn("h-1 w-8 rounded-full", i <= step ? "bg-forest" : "bg-line")}
                  />
                ))}
              </div>
            </div>

            {step === 0 ? (
              <div className="mt-6">
                <h2 className="flex items-center gap-2 text-[26px] leading-tight sm:text-[30px]">
                  <Building2 className="size-5 shrink-0 text-moss" aria-hidden /> {c.companyTitle}
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.companyDesc}</p>

                <div className="mt-6 grid min-w-0 gap-4">
                  <div className="min-w-0">
                    <label htmlFor="company-name" className="field-label">{c.company} *</label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => {
                        setCompanyName(e.target.value);
                        setErrors((prev) => ({ ...prev, company: undefined }));
                      }}
                      placeholder={c.companyPlaceholder}
                      autoComplete="organization"
                      maxLength={120}
                      disabled={saving}
                      aria-invalid={Boolean(errors.company)}
                      aria-describedby={errors.company ? "company-error" : undefined}
                      className="mt-1.5"
                    />
                    {errors.company ? <p id="company-error" className="mt-1.5 text-[12px] text-danger">{errors.company}</p> : null}
                  </div>
                  <div className="min-w-0 max-w-[320px]">
                    <label htmlFor="vat-number" className="field-label">{c.vat} *</label>
                    <div className="mt-1.5 flex min-w-0">
                      <span className="flex h-10 shrink-0 items-center rounded-l-xl border border-r-0 border-line bg-sand/60 px-2.5 font-mono text-[12px] text-muted">
                        IT
                      </span>
                      <Input
                        id="vat-number"
                        inputMode="numeric"
                        value={vatDigits}
                        onChange={(e) => {
                          setVatDigits(e.target.value.replace(/\D/g, "").slice(0, 11));
                          setErrors((prev) => ({ ...prev, vat: undefined }));
                        }}
                        placeholder={c.vatPlaceholder}
                        disabled={saving}
                        aria-invalid={Boolean(errors.vat)}
                        aria-describedby={errors.vat ? "vat-error" : "vat-hint"}
                        className="min-w-0 rounded-l-none"
                      />
                    </div>
                    {errors.vat ? (
                      <p id="vat-error" className="mt-1.5 text-[12px] text-danger">{errors.vat}</p>
                    ) : (
                      <p id="vat-hint" className="mt-1.5 text-[12px] text-muted">{c.vatHint}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="mt-6">
                <h2 className="flex items-center gap-2 text-[26px] leading-tight sm:text-[30px]">
                  <MapPin className="size-5 shrink-0 text-moss" aria-hidden /> {c.addressTitle}
                </h2>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{c.addressDesc}</p>

                <div className="mt-6 grid min-w-0 gap-4">
                  <div className="min-w-0">
                    <label htmlFor="address-line" className="field-label">{c.address} *</label>
                    <Input
                      id="address-line"
                      value={addressLine}
                      onChange={(e) => {
                        setAddressLine(e.target.value);
                        setErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      placeholder={c.addressPlaceholder}
                      autoComplete="street-address"
                      maxLength={180}
                      disabled={saving}
                      aria-invalid={Boolean(errors.address)}
                      aria-describedby={errors.address ? "address-error" : undefined}
                      className="mt-1.5"
                    />
                    {errors.address ? <p id="address-error" className="mt-1.5 text-[12px] text-danger">{errors.address}</p> : null}
                  </div>
                  <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <label htmlFor="city" className="field-label">{c.city}</label>
                      <Input
                        id="city"
                        value="Bologna"
                        readOnly
                        disabled={saving}
                        aria-describedby="city-hint"
                        className="mt-1.5 bg-sand/50"
                      />
                      <p id="city-hint" className="mt-1.5 text-[12px] text-muted">{c.cityNote}</p>
                    </div>
                    <div className="min-w-0">
                      <label htmlFor="postal-code" className="field-label">{c.postal} *</label>
                      <Input
                        id="postal-code"
                        inputMode="numeric"
                        value={postalCode}
                        onChange={(e) => {
                          setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 5));
                          setErrors((prev) => ({ ...prev, postal: undefined }));
                        }}
                        autoComplete="postal-code"
                        disabled={saving}
                        aria-invalid={Boolean(errors.postal)}
                        aria-describedby={errors.postal ? "postal-error" : undefined}
                        className="mt-1.5"
                      />
                      {errors.postal ? <p id="postal-error" className="mt-1.5 text-[12px] text-danger">{errors.postal}</p> : null}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div
              ref={bannerRef}
              tabIndex={-1}
              role={banner ? "alert" : undefined}
              aria-live="polite"
              className={cn(
                "mt-6 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger",
                banner ? "flex items-start gap-2" : "sr-only",
              )}
            >
              {banner ? (
                <>
                  <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span><strong className="block font-medium">{banner.title}</strong>{banner.message}</span>
                </>
              ) : null}
            </div>

            <div className="mt-7 flex items-center justify-between gap-3 border-t border-line pt-5">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setBanner(null);
                  setErrors({});
                  setStep((s) => Math.max(0, s - 1));
                }}
                disabled={step === 0 || saving}
                className="-ml-2"
              >
                <ArrowLeft className="size-3.5" aria-hidden /> {c.back}
              </Button>
              {step === 0 ? (
                <Button type="button" onClick={next}>
                  {c.next} <ArrowRight className="size-3.5" aria-hidden />
                </Button>
              ) : (
                <Button type="button" onClick={submit} disabled={saving} aria-busy={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  {saving ? c.saving : c.finish}
                  {saving ? null : <ArrowRight className="size-3.5" aria-hidden />}
                </Button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted">
            <Link href="/" className="underline">{c.helpLink}</Link> · {c.privacy}
          </p>
        </section>
      </main>
    </OffcutShell>
  );
}
