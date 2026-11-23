"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

const COPY = {
  it: {
    eyebrow: "REGISTRAZIONE",
    title: "Crea il tuo spazio Offcut",
    desc: "Serve solo il tuo spazio di lavoro: aggiungerai materiali e richieste dopo l'accesso.",
    company: "Nome azienda",
    companyPlaceholder: "Es. Rossi S.r.l.",
    email: "Email aziendale",
    password: "Password",
    passwordHint: "Almeno 8 caratteri.",
    showPassword: "Mostra password",
    termsError: "Devi accettare i termini per continuare.",
    haveAccount: "Hai già un account?",
    signin: "Accedi",
    submit: "Crea account",
    error: "Non è stato possibile creare l'account. Riprova.",
    profileLater: "Completa il profilo dopo l'accesso.",
  },
  en: {
    eyebrow: "SIGN UP",
    title: "Create your Offcut workspace",
    desc: "Only your workspace is needed here: you can add materials and requests after signing in.",
    company: "Company name",
    companyPlaceholder: "e.g. Rossi Ltd.",
    email: "Work email",
    password: "Password",
    passwordHint: "At least 8 characters.",
    showPassword: "Show password",
    termsError: "Please accept the terms to continue.",
    haveAccount: "Already have an account?",
    signin: "Log in",
    submit: "Create account",
    error: "We couldn't create your account. Please try again.",
    profileLater: "You can complete your profile after signing in.",
  },
} as const;

export function SignupForm() {
  const { t, lang } = useI18n();
  const c = COPY[lang];
  const signUp = useAppStore((s) => s.signUp);
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError(c.termsError);
      return;
    }
    setLoading(true);
    try {
      const result = await signUp(company, email, password);
      if (result.needsConfirmation) {
        toast.success(t("signup.successTitle"), { description: t("signup.successDesc") });
        router.replace(`/login?checkEmail=1&email=${encodeURIComponent(email)}`);
        return;
      }
      toast.success(t("signup.successTitle"));
      router.replace("/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : c.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">{c.eyebrow}</p>
      <h1 className="offcut-form-title">{c.title}</h1>
      <p className="offcut-form-desc">{c.desc}</p>

      <form onSubmit={handleSubmit} className="offcut-form-stack" noValidate>
        <div>
          <label htmlFor="company" className="field-label">{c.company}</label>
          <Input
            id="company"
            autoComplete="organization"
            required
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={c.companyPlaceholder}
            className="mt-1.5"
          />
        </div>

        <div>
          <label htmlFor="work-email" className="field-label">{c.email}</label>
          <Input
            id="work-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nome@azienda.it"
            className="mt-1.5"
          />
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
              aria-label={c.showPassword}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          <p className="offcut-hint">{c.passwordHint}</p>
        </div>

        <label className="offcut-terms">
          <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} aria-label={t("signup.terms")} />
          <span>
            {t("signup.terms")} {" "}
            <Link href="/terms" className="underline hover:text-ink">{t("footer.terms")}</Link>
            {" · "}
            <Link href="/privacy" className="underline hover:text-ink">{t("footer.privacy")}</Link>
          </span>
        </label>

        {error ? (
          <div role="alert" className="offcut-alert">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </div>
        ) : null}

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {c.submit} <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="offcut-form-foot">
        {c.haveAccount}{" "}
        <Link href="/login" className="font-medium text-moss hover:underline">{c.signin}</Link>
      </p>
      <p className="offcut-form-foot offcut-form-note">{c.profileLater}</p>
    </div>
  );
}
