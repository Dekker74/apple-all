"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { OffcutShell } from "@/components/offcut/shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { friendlyAuthError } from "@/components/auth/errors";
import { useI18n } from "@/lib/i18n";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const COPY = {
  it: {
    eyebrow: "Account",
    title: "Recupera la password",
    desc: "Inserisci l'email del tuo account: ti inviamo un link per impostare una nuova password. Il link scade dopo poco tempo.",
    email: "Email di lavoro",
    emailPlaceholder: "nome@azienda.it",
    submit: "Invia link",
    sending: "Invio in corso…",
    successTitle: "Controlla la tua casella di posta",
    successDesc: "Se esiste un account con questa email, troverai un link per reimpostare la password. Controlla anche la cartella spam.",
    successNote: "Non hai ricevuto nulla? Attendi qualche minuto, poi riprova o scrivi al team Offcut.",
    back: "Torna al login",
    errEmail: "Inserisci un indirizzo email valido.",
    errSummary: "Controlla l'email inserita",
    unknown: "Non è stato possibile inviare il link. Riprova tra poco.",
  },
  en: {
    eyebrow: "Account",
    title: "Reset your password",
    desc: "Enter your account email: we'll send a link to set a new password. The link expires after a short time.",
    email: "Work email",
    emailPlaceholder: "name@company.com",
    submit: "Send link",
    sending: "Sending…",
    successTitle: "Check your inbox",
    successDesc: "If an account exists for this email, you'll find a link to reset your password. Check your spam folder too.",
    successNote: "Nothing arrived? Wait a few minutes, then try again or contact the Offcut team.",
    back: "Back to sign in",
    errEmail: "Enter a valid email address.",
    errSummary: "Check the email you entered",
    unknown: "We couldn't send the link. Please try again shortly.",
  },
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export default function ForgotPasswordPage() {
  const { lang } = useI18n();
  const c = COPY[lang];
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    if (!EMAIL_RE.test(email.trim())) {
      setError(c.errEmail);
      window.requestAnimationFrame(() => errorRef.current?.focus());
      return;
    }

    setError(null);
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError(c.unknown);
      setLoading(false);
      return;
    }
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (err) {
        setError(friendlyAuthError(err, lang, "resetUnavailable"));
        window.requestAnimationFrame(() => errorRef.current?.focus());
        return;
      }
      setDone(true);
    } catch (err) {
      setError(friendlyAuthError(err, lang, "resetUnavailable"));
      window.requestAnimationFrame(() => errorRef.current?.focus());
    } finally {
      setLoading(false);
    }
  }

  return (
    <OffcutShell>
      <div className="card mx-auto w-full max-w-[520px]">
        {done ? (
          <>
            <CheckCircle2 className="size-11 text-moss" strokeWidth={1.5} aria-hidden />
            <h1 className="mt-5 text-[30px] leading-tight sm:text-[34px]">{c.successTitle}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.successDesc}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-muted">{c.successNote}</p>
          </>
        ) : (
          <>
            <p className="eyebrow">{c.eyebrow}</p>
            <h1 className="mt-3 text-[32px] leading-tight sm:text-[36px]">{c.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{c.desc}</p>
          </>
        )}
        {done ? null : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="field-label">{c.email}</label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={c.emailPlaceholder}
                disabled={loading}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "email-error" : undefined}
                className="mt-1.5"
              />
              {error ? <p id="email-error" className="sr-only">{c.errSummary}</p> : null}
            </div>
            <div
              ref={errorRef}
              tabIndex={-1}
              role={error ? "alert" : undefined}
              aria-live="polite"
              className={error
                ? "flex items-start gap-2 rounded-lg border border-danger/20 bg-danger/5 px-3 py-2 text-[13px] leading-relaxed text-danger focus:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                : "sr-only"}
            >
              {error ? <><AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />{error}</> : null}
            </div>
            <Button type="submit" size="lg" className="w-full" disabled={loading} aria-busy={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {loading ? c.sending : c.submit}
              {loading ? null : <ArrowRight className="size-4" aria-hidden />}
            </Button>
          </form>
        )}
        <Button variant="link" asChild className="mt-5 px-0">
          <Link href="/login"><ArrowLeft className="size-3.5" aria-hidden /> {c.back}</Link>
        </Button>
      </div>
    </OffcutShell>
  );
}
