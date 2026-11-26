"use client";

import Link from "next/link";
import { OffcutLogo } from "@/components/offcut/logo";
import { OffcutShell } from "@/components/offcut/shell";
import { useI18n } from "@/lib/i18n";

const COPY = {
  it: {
    title: "Lo scarto di un'azienda è la materia prima di un'altra.",
    sub: "Offcut abbina aziende che hanno materiale in eccesso con aziende che ne hanno bisogno, poi ritira, lavora e consegna. Il ritiro è gratuito.",
    step1: "Indica cosa hai o cosa cerchi",
    step2: "Ricevi gli abbinamenti",
    step3: "Concludi lo scambio",
    both: "Un solo account per acquistare e vendere",
    signup: "Registrati",
    login: "Accedi",
  },
  en: {
    title: "One company’s scrap is another’s raw material.",
    sub: "Offcut matches businesses that have leftover material with businesses that need it, then collects, processes and delivers it. Collecting scrap is free.",
    step1: "List what you have or need",
    step2: "Get matched",
    step3: "Make the exchange",
    both: "One account to buy and sell",
    signup: "Sign up",
    login: "Log in",
  },
} as const;

export function OffcutAuthShell({
  children,
  mode,
}: {
  children: React.ReactNode;
  mode: "signin" | "signup";
}) {
  const { lang } = useI18n();
  const c = COPY[lang];

  return (
    <OffcutShell footer={false}>
      <section data-v="auth">
        <div className="offcut-hero">
          <div>
            <div className="hero-brand">
              <OffcutLogo href={null} large />
            </div>
            <h1>{c.title}</h1>
            <p className="lead mut">{c.sub}</p>
            <div className="offcut-flow">
              <span>{c.step1}</span><i aria-hidden>→</i>
              <span>{c.step2}</span><i aria-hidden>→</i>
              <span>{c.step3}</span>
            </div>
            <p className="mt-3 text-[13px] leading-relaxed mut">{c.both}</p>
          </div>
          <div className="card">
            <nav className="seg" id="am" aria-label={mode === "signup" ? c.signup : c.login}>
              <Link href="/signup" className={mode === "signup" ? "on" : undefined} aria-current={mode === "signup" ? "page" : undefined}>
                {c.signup}
              </Link>
              <Link href="/login" className={mode === "signin" ? "on" : undefined} aria-current={mode === "signin" ? "page" : undefined}>
                {c.login}
              </Link>
            </nav>
            <div className="offcut-auth-form">{children}</div>
          </div>
        </div>
      </section>
    </OffcutShell>
  );
}
