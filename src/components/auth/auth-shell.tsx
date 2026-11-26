"use client";

import Link from "next/link";
import { ArrowLeft, Check, Recycle, ShieldCheck, Sparkles } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch, useI18n } from "@/lib/i18n";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthShell({
  children,
}: {
  children: React.ReactNode;
  mode: "signin" | "signup";
}) {
  const { t } = useI18n();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.02fr_0.98fr]">
      <aside className="relative hidden overflow-hidden bg-forest p-10 text-paper lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute inset-0 dot-grid-light opacity-30" />
        <div className="pointer-events-none absolute -right-40 top-1/4 size-[520px] rounded-full border border-paper/10" />
        <div className="pointer-events-none absolute -right-24 top-[30%] size-[380px] rounded-full border border-lime/20" />

        <div className="relative">
          <Logo variant="light" />
        </div>

        <div className="relative max-w-[460px]">
          <p className="font-mono text-[11.5px] uppercase tracking-[0.2em] text-lime/70">
            {t("auth.asideEyebrow")}
          </p>
          <h1 className="mt-5 text-balance text-[46px] leading-[1.05] text-paper xl:text-[54px]">
            {t("auth.asideTitle1")} <span className="italic text-lime">{t("auth.asideTitle2")}</span>
          </h1>
          <ul className="mt-8 space-y-3">
            {["auth.aside1", "auth.aside2", "auth.aside3"].map((key) => (
              <li key={key} className="flex gap-2.5 text-[16px] leading-[1.6] text-paper/80">
                <Check className="mt-1 size-4 shrink-0 text-lime" strokeWidth={2.5} />
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative space-y-5">
          <div className="flex gap-6 border-y border-paper/10 py-4">
            {[
              ["6%", "auth.statCommission"],
              ["3", "auth.statCategories"],
              ["48h", "auth.statQuote"],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="font-display text-[26px] leading-none text-paper">{value}</p>
                <p className="mt-1 font-mono text-[12px] uppercase tracking-[0.14em] text-paper/50">
                  {t(label)}
                </p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-[12px] text-paper/55">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3.5" /> {t("auth.chipVetted")}</span>
            <span className="flex items-center gap-1"><Recycle className="size-3.5" /> {t("auth.chipCircular")}</span>
            <span className="flex items-center gap-1"><Sparkles className="size-3.5" /> {t("auth.chipExplain")}</span>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col bg-paper">
        <header className="flex h-[72px] items-center justify-between gap-2 px-5 sm:px-8">
          <div className="lg:hidden">
            <Logo />
          </div>
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitch />
            <ThemeToggle />
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[13px] text-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="size-3.5" /> <span className="hidden sm:inline">{t("auth.back")}</span>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8">
          <div className="w-full max-w-[440px]">{children}</div>
        </main>

        <footer className="px-5 pb-6 text-center text-[12px] leading-relaxed text-muted sm:px-8">
          © 2026 Offcut · {t("footer.disclaimer")}
          <br />
          <Link href="/terms" className="hover:text-ink hover:underline">{t("footer.terms")}</Link>
          {" · "}
          <Link href="/privacy" className="hover:text-ink hover:underline">{t("footer.privacy")}</Link>
          {" · "}
          <Link href="/preventivo" className="hover:text-ink hover:underline">{t("nav.cta")}</Link>
        </footer>
      </div>
    </div>
  );
}
