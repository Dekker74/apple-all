"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { DEMO_EMAILS, DEMO_PASSWORD } from "@/lib/constants";
import { useAppStore } from "@/lib/store";

const CONFIRM_COPY = {
  it: {
    title: "Conferma la tua email",
    body: "Abbiamo inviato un link di conferma a {email}. Aprilo per attivare l'account, poi torna qui per accedere.",
    resend: "Invia di nuovo l'email",
    resending: "Invio in corso…",
    resent: "Email di conferma reinviata.",
    resendError: "Non è stato possibile reinviare l'email. Riprova tra poco.",
  },
  en: {
    title: "Confirm your email",
    body: "We sent a confirmation link to {email}. Open it to activate your account, then come back here to log in.",
    resend: "Resend confirmation email",
    resending: "Sending…",
    resent: "Confirmation email resent.",
    resendError: "We couldn't resend the email. Please try again shortly.",
  },
} as const;

export function LoginForm() {
  const { t, lang } = useI18n();
  const c = CONFIRM_COPY[lang];
  const signIn = useAppStore((s) => s.signIn);
  const resendConfirmation = useAppStore((s) => s.resendConfirmation);
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<"buyer" | "supplier" | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkEmail") !== "1") return;
    setNeedsConfirmation(true);
    const confirmEmail = params.get("email");
    if (confirmEmail) setEmail(confirmEmail);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.error"));
    } finally {
      setLoading(false);
    }
  }

  async function handleDemo(role: "buyer" | "supplier") {
    setError(null);
    setDemoLoading(role);
    try {
      await signIn(DEMO_EMAILS[role], DEMO_PASSWORD);
      toast.success(t("login.demoTitle"));
      router.replace("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.demoError"));
    } finally {
      setDemoLoading(null);
    }
  }

  async function handleResend() {
    if (!email) {
      setError(lang === "it" ? "Inserisci la tua email." : "Please enter your email.");
      return;
    }
    setResending(true);
    try {
      await resendConfirmation(email);
      toast.success(c.resent);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : c.resendError);
    } finally {
      setResending(false);
    }
  }

  return (
    <div>
      <p className="eyebrow">{t("login.eyebrow")}</p>
      <h1 className="mt-2 text-[38px] leading-none">{t("login.title")}</h1>
      <p className="mt-3 text-[15px] leading-[1.6] text-muted">{t("login.desc")}</p>

      {needsConfirmation ? (
        <div className="mt-5 rounded-xl border border-moss/30 bg-mint/50 p-4">
          <p className="text-[13px] font-semibold text-ink">{c.title}</p>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">
            {c.body.replace("{email}", email || "—")}
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-moss px-3 py-2 text-[12px] font-medium text-moss transition-colors hover:bg-mint disabled:opacity-60"
          >
            {resending ? <Loader2 className="size-3.5 animate-spin" /> : null}
            {resending ? c.resending : c.resend}
          </button>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-6 space-y-3.5" noValidate>
        <div>
          <label htmlFor="email" className="field-label">{t("login.email")}</label>
          <div className="relative mt-1.5">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nome@azienda.it"
              className="pl-9"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="password" className="field-label">{t("login.password")}</label>
            <Link href="/forgot-password" className="text-[12px] text-muted underline underline-offset-2 hover:text-ink">
              {t("login.forgot")}
            </Link>
          </div>
          <div className="relative mt-1.5">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="pl-9 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:text-ink"
              aria-label={showPassword ? "Nascondi password" : "Mostra password"}
            >
              {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
        </div>

        {error ? (
          <div role="alert" className="flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/[0.06] px-3 py-2.5 text-[12px] leading-relaxed text-danger">
            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" size="lg" disabled={loading || demoLoading !== null}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("login.signin")} <ArrowRight className="size-4" />
        </Button>
      </form>

      <div className="mt-6 rounded-xl border border-line bg-sand/40 p-4">
        <p className="font-mono text-[12px] uppercase tracking-[0.14em] text-muted">{t("login.demoTitle")}</p>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={() => handleDemo("buyer")}
            disabled={loading || demoLoading !== null}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-sage disabled:opacity-60"
          >
            <span>
              <span className="block text-[13px] font-medium">Northwind Packaging</span>
              <span className="block text-[12px] text-muted">{t("login.demoBuyer")}</span>
            </span>
            {demoLoading === "buyer" ? <Loader2 className="size-3.5 animate-spin text-muted" /> : <ArrowRight className="size-3.5 text-muted" />}
          </button>
          <button
            type="button"
            onClick={() => handleDemo("supplier")}
            disabled={loading || demoLoading !== null}
            className="flex w-full items-center justify-between rounded-lg border border-line bg-white px-3 py-2.5 text-left transition-colors hover:border-sage disabled:opacity-60"
          >
            <span>
              <span className="block text-[13px] font-medium">GreenLoop Fibres</span>
              <span className="block text-[12px] text-muted">{t("login.demoSupplier")}</span>
            </span>
            {demoLoading === "supplier" ? <Loader2 className="size-3.5 animate-spin text-muted" /> : <ArrowRight className="size-3.5 text-muted" />}
          </button>
        </div>
      </div>

      <p className="mt-5 text-center text-[13px] text-muted">
        {t("login.newHere")}{" "}
        <Link href="/signup" className="font-medium text-forest hover:underline">
          {t("login.createAccount")}
        </Link>
      </p>
    </div>
  );
}
