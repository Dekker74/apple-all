"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { friendlyAuthError } from "@/components/auth/errors";
import { useI18n } from "@/lib/i18n";
import { DEMO_EMAILS, DEMO_PASSWORD } from "@/lib/constants";
import { useAppStore } from "@/lib/store";

const COPY = {
  it: {
    eyebrow: "Bentornato",
    title: "Accedi a Offcut",
    desc: "Ritrova i tuoi materiali, gli abbinamenti e i preventivi.",
    email: "Email di lavoro",
    password: "Password",
    forgot: "Password dimenticata?",
    signin: "Accedi",
    signing: "Accesso in corso…",
    showPassword: "Mostra password",
    hidePassword: "Nascondi password",
    bothFlows: "Con un solo account puoi acquistare e vendere: non devi scegliere un ruolo.",
    errEmail: "Inserisci un indirizzo email valido.",
    errPassword: "Inserisci la password per continuare.",
    errSummary: "Controlla i campi evidenziati",
    demoTitle: "Prova la demo",
    demoBuyer: "Prova come acquirente",
    demoSupplier: "Prova come fornitore",
    demoBuyerCompany: "Northwind Packaging · Bologna",
    demoSupplierCompany: "GreenLoop Fibres · Bologna",
    demoNote: "Gli account demo usano dati di esempio separati da quelli reali.",
    demoSignIn: "Accesso demo effettuato",
    confirmTitle: "Conferma la tua email",
    confirmBody: "Abbiamo inviato un link di conferma a {email}. Aprilo per attivare l'account, poi torna qui per accedere.",
    confirmMissing: "Inserisci la tua email qui sopra, poi usa il pulsante qui sotto.",
    resend: "Invia di nuovo l'email",
    resending: "Invio in corso…",
    resent: "Email di conferma reinviata.",
    resendError: "Non è stato possibile reinviare l'email. Riprova tra poco.",
    unknown: "Non è stato possibile accedere. Riprova tra poco.",
  },
  en: {
    eyebrow: "Welcome back",
    title: "Sign in to Offcut",
    desc: "Find your materials, matches and quotes in one place.",
    email: "Work email",
    password: "Password",
    forgot: "Forgot password?",
    signin: "Sign in",
    signing: "Signing in…",
    showPassword: "Show password",
    hidePassword: "Hide password",
    bothFlows: "One account lets you both buy and sell: you don't need to pick a role.",
    errEmail: "Enter a valid email address.",
    errPassword: "Enter your password to continue.",
    errSummary: "Check the highlighted fields",
    demoTitle: "Try the demo",
    demoBuyer: "Try as a buyer",
    demoSupplier: "Try as a supplier",
    demoBuyerCompany: "Northwind Packaging · Bologna",
    demoSupplierCompany: "GreenLoop Fibres · Bologna",
    demoNote: "Demo accounts use sample data kept separate from real data.",
    demoSignIn: "Demo workspace opened",
    confirmTitle: "Confirm your email",
    confirmBody: "We sent a confirmation link to {email}. Open it to activate your account, then come back here to sign in.",
    confirmMissing: "Enter your email above, then use the button below.",
    resend: "Resend confirmation email",
    resending: "Sending…",
    resent: "Confirmation email resent.",
    resendError: "We couldn't resend the email. Please try again shortly.",
    unknown: "We couldn't sign you in. Please try again shortly.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

type FieldKey = "email" | "password";

export function LoginForm() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const signIn = useAppStore((s) => s.signIn);
  const resendConfirmation = useAppStore((s) => s.resendConfirmation);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"buyer" | "supplier" | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkEmail") !== "1") return;
    setNeedsConfirmation(true);
    const confirmEmail = params.get("email");
    if (confirmEmail) setEmail(confirmEmail);
  }, []);

  function showError(message: string) {
    setError(message);
    window.requestAnimationFrame(() => errorRef.current?.focus());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || demoLoading) return;

    const fields: Partial<Record<FieldKey, string>> = {};
    if (!EMAIL_RE.test(email.trim())) fields.email = c.errEmail;
    if (!password) fields.password = c.errPassword;
    setFieldErrors(fields);
    if (Object.keys(fields).length > 0) {
      showError(c.errSummary);
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace("/app/dashboard");
    } catch (err) {
      showError(friendlyAuthError(err, lang, "unknown"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(role: "buyer" | "supplier") {
    if (loading || demoLoading) return;
    setError(null);
    setFieldErrors({});
    setDemoLoading(role);
    try {
      await signIn(DEMO_EMAILS[role], DEMO_PASSWORD);
      toast.success(c.demoSignIn);
      router.replace("/app/dashboard");
    } catch (err) {
      showError(friendlyAuthError(err, lang, "unknown"));
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleResend() {
    if (resending) return;
    if (!EMAIL_RE.test(email.trim())) {
      showError(c.confirmMissing);
      return;
    }
    setError(null);
    setResending(true);
    try {
      await resendConfirmation(email.trim());
      toast.success(c.resent);
    } catch (err) {
      toast.error(friendlyAuthError(err, lang, "resendError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">{c.eyebrow}</p>
      <h1 className="mt-2 text-[34px] leading-none sm:text-[38px]">{c.title}</h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">{c.desc}</p>

      {needsConfirmation ? (
        <div className="mt-5 rounded-xl border border-moss/30 bg-mint/50 p-4" role="status">
          <p className="text-[13px] font-semibold text-ink">{c.confirmTitle}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            {c.confirmBody.replace("{email}", email || "—")}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            aria-busy={resending}
            className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-moss px-3 py-2 text-[12px] font-medium text-moss transition-colors hover:bg-mint disabled:opacity-60"
          >
            {resending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            {resending ? c.resending : c.resend}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
        <div>
          <label htmlFor="email" className="field-label">{c.email}</label>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              id="email"
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
              className="pl-9"
            />
          </div>
          {fieldErrors.email ? <p id="email-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.email}</p> : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="field-label">{c.password}</label>
            <Link href="/forgot-password" className="text-[12px] text-muted underline underline-offset-2 hover:text-ink">
              {c.forgot}
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" aria-hidden />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••••"
              disabled={loading}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className="pl-9 pr-10"
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
          {fieldErrors.password ? <p id="password-error" className="mt-1.5 text-[12px] text-danger">{fieldErrors.password}</p> : null}
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

        <Button type="submit" className="w-full" size="lg" disabled={loading || demoLoading !== null} aria-busy={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {loading ? c.signing : c.signin}
          {loading ? null : <ArrowRight className="size-4" aria-hidden />}
        </Button>
        <p className="text-center text-[12px] leading-relaxed text-muted">{c.bothFlows}</p>
      </form>

      <div className="mt-6 rounded-xl border border-line bg-sand/40 p-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{c.demoTitle}</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => handleDemo("buyer")}
            disabled={loading || demoLoading !== null}
            aria-label={`${c.demoBuyer} — ${c.demoBuyerCompany}`}
            className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{c.demoBuyer}</span>
              <span className="block text-[12px] text-muted">{c.demoBuyerCompany}</span>
            </span>
            {demoLoading === "buyer" ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted" aria-hidden /> : <ArrowRight className="size-3.5 shrink-0 text-muted" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => handleDemo("supplier")}
            disabled={loading || demoLoading !== null}
            aria-label={`${c.demoSupplier} — ${c.demoSupplierCompany}`}
            className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-sage focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block text-[13px] font-medium">{c.demoSupplier}</span>
              <span className="block text-[12px] text-muted">{c.demoSupplierCompany}</span>
            </span>
            {demoLoading === "supplier" ? <Loader2 className="size-3.5 shrink-0 animate-spin text-muted" aria-hidden /> : <ArrowRight className="size-3.5 shrink-0 text-muted" aria-hidden />}
          </button>
        </div>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{c.demoNote}</p>
      </div>
    </div>
  );
}
