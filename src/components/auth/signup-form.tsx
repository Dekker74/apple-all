"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { friendlyAuthError } from "@/components/auth/errors";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

const COPY = {
  it: {
    eyebrow: "Registrazione",
    title: "Crea il tuo spazio Offcut",
    desc: "Bastano azienda, email e password. Aggiungerai materiali e richieste dopo l'accesso.",
    company: "Nome azienda",
    companyPlaceholder: "Es. Rossi S.r.l.",
    email: "Email aziendale",
    password: "Password",
    passwordHint: "Almeno 8 caratteri, con lettere e numeri.",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
    termsError: "Devi accettare i termini per continuare.",
    haveAccount: "Hai già un account?",
    signin: "Accedi",
    submit: "Crea account",
    sending: "Creazione in corso…",
    error: "Non è stato possibile creare l'account. Riprova.",
    profileLater: "Completa la sede nel passaggio successivo: operiamo a Bologna.",
    bothFlows: "Un solo account per acquistare e vendere: nessuna scelta di ruolo.",
    errCompany: "Inserisci il nome della tua azienda.",
    errEmail: "Inserisci un indirizzo email valido.",
    errPassword: "La password deve avere almeno 8 caratteri.",
    errSummary: "Controlla i campi evidenziati",
    successTitle: "Richiesta registrata",
    successDesc: "Controlla la tua email per confermare l'indirizzo.",
  },
  en: {
    eyebrow: "Sign up",
    title: "Create your Offcut workspace",
    desc: "Company, email and password are enough. You can add materials and requests after signing in.",
    company: "Company name",
    companyPlaceholder: "e.g. Rossi Ltd.",
    email: "Work email",
    password: "Password",
    passwordHint: "At least 8 characters, with letters and numbers.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    termsError: "Please accept the terms to continue.",
    haveAccount: "Already have an account?",
    signin: "Log in",
    submit: "Create account",
    sending: "Creating account…",
    error: "We couldn't create your account. Please try again.",
    profileLater: "You'll add your site in the next step: we currently operate in Bologna.",
    bothFlows: "One account to buy and sell: no role to choose.",
    errCompany: "Enter your company name.",
    errEmail: "Enter a valid email address.",
    errPassword: "The password must be at least 8 characters long.",
    errSummary: "Check the highlighted fields",
    successTitle: "Registration recorded",
    successDesc: "Check your inbox to confirm your email address.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
type FieldKey = "company" | "email" | "password" | "terms";

export function SignupForm() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const signUp = useAppStore((s) => s.signUp);
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  function showError(message: string) {
    setError(message);
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const fields: Partial<Record<FieldKey, string>> = {};
    if (company.trim().length < 2) fields.company = c.errCompany;
    if (!EMAIL_RE.test(email.trim())) fields.email = c.errEmail;
    if (password.length < 8 || !/[a-z]/i.test(password) || !/\d/.test(password)) fields.password = c.errPassword;
    if (!accepted) fields.terms = c.termsError;
    setFieldErrors(fields);
    if (Object.keys(fields).length > 0) {
      showError(c.errSummary);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const result = await signUp(company.trim(), email.trim(), password);
      if (result.needsConfirmation) {
        toast.success(c.successTitle, { description: c.successDesc });
        router.replace(`/login?checkEmail=1&email=${encodeURIComponent(email.trim())}`);
        return;
      }
      toast.success(c.successTitle);
      router.replace("/onboarding");
    } catch (err) {
      showError(friendlyAuthError(err, lang, "error"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">{c.eyebrow}</p>
      <h1 className="text-[30px] leading-tight sm:text-[36px]">{c.title}</h1>
      <p className="mt-3 text-[14px] leading-[1.6] text-muted">{c.desc}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="company" className="field-label">{c.company}</label>
          <Input
            id="company"
            autoComplete="organization"
            required
            maxLength={120}
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              setFieldErrors((prev) => ({ ...prev, company: undefined }));
            }}
            placeholder={c.companyPlaceholder}
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.company)}
            aria-describedby={fieldErrors.company ? "company-error" : undefined}
            className="mt-1.5"
          />
          {fieldErrors.company ? <p id="company-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.company}</p> : null}
        </div>

        <div>
          <label htmlFor="work-email" className="field-label">{c.email}</label>
          <Input
            id="work-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }}
            placeholder="nome@azienda.it"
            disabled={loading}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
            className="mt-1.5"
          />
          {fieldErrors.email ? <p id="email-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <label htmlFor="new-password" className="field-label">{c.password}</label>
          <div className="relative mt-1.5">
            <Input
              id="new-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : "password-hint"}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
              aria-label={showPassword ? c.hidePassword : c.showPassword}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
            </button>
          </div>
          {fieldErrors.password ? (
            <p id="password-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.password}</p>
          ) : (
            <p id="password-hint" className="mt-1.5 text-[12px] leading-relaxed text-muted">{c.passwordHint}</p>
          )}
        </div>

        <div>
          <label className="flex items-start gap-3 text-[12.5px] leading-relaxed text-ink">
            <Checkbox
              checked={accepted}
              onCheckedChange={(v) => {
                setAccepted(v === true);
                setFieldErrors((prev) => ({ ...prev, terms: undefined }));
              }}
              aria-label={lang === "it" ? "Accetto Termini e Privacy Policy" : "I accept the Terms and Privacy Policy"}
              aria-invalid={Boolean(fieldErrors.terms)}
              aria-describedby={fieldErrors.terms ? "terms-error" : undefined}
              className="mt-0.5"
            />
            <span>
              {lang === "it" ? "Accetto i" : "I accept the"}{" "}
              <Link href="/terms" className="underline hover:text-ink">{lang === "it" ? "Termini" : "Terms"}</Link>
              {" "}{lang === "it" ? "e la" : "and"}{" "}
              <Link href="/privacy" className="underline hover:text-ink">{lang === "it" ? "Privacy Policy" : "Privacy Policy"}</Link>.
            </span>
          </label>
          {fieldErrors.terms ? <p id="terms-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.terms}</p> : null}
        </div>

        <div
          ref={errorRef}
          tabIndex={-1}
          role={error ? "alert" : undefined}
          aria-live="polite"
          className={error
            ? "flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            : "sr-only"}
        >
          {error ? <><AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{error}</> : null}
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {loading ? c.sending : c.submit}
          {loading ? null : <ArrowRight className="size-4" aria-hidden />}
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-muted">{c.bothFlows}</p>
      </form>

      <p className="mt-5 text-center text-[12px] text-muted">
        {c.haveAccount}{" "}
        <Link href="/login" className="font-medium text-moss hover:underline">{c.signin}</Link>
      </p>
      <p className="mt-2 text-center text-[11.5px] leading-relaxed text-muted">{c.profileLater}</p>
    </div>
  );
}
