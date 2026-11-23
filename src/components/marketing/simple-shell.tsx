"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { LanguageSwitch, useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AssistantBot } from "@/components/marketing/assistant-bot";

export function SimpleShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen flex-col bg-paper text-[16px] leading-[1.6]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-forest focus:px-4 focus:py-2 focus:text-[14px] focus:text-paper"
      >
        Vai al contenuto / Skip to content
      </a>
      <header className="marketing-header sticky top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-[1000px] items-center justify-between gap-2 px-5 sm:gap-3 sm:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <LanguageSwitch className="hidden sm:inline-flex" />
            <ThemeToggle />
            <Link href="/" className="hidden items-center gap-1.5 text-[13px] text-muted hover:text-ink sm:flex">
              <ArrowLeft className="size-3.5" /> {t("auth.back")}
            </Link>
            <Button size="sm" asChild>
              <Link href="/preventivo">
                <span className="hidden sm:inline">{t("nav.cta")}</span>
                <span className="sm:hidden">{t("nav.ctaShort")}</span>
                <ArrowRight className="hidden size-3.5 sm:block" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-12 sm:px-8 sm:py-16">{children}</main>
      <footer className="border-t border-line px-5 py-8 text-[13px] text-muted sm:px-8">
        <div className="mx-auto flex max-w-[1000px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Offcut · {t("footer.disclaimer")}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/chi-siamo" className="hover:text-ink">{t("footer.about")}</Link>
            <Link href="/privacy" className="hover:text-ink">{t("footer.privacy")}</Link>
            <Link href="/terms" className="hover:text-ink">{t("footer.terms")}</Link>
            <a href="mailto:hello@circularlink.app" className="hover:text-ink">hello@circularlink.app</a>
          </div>
        </div>
      </footer>
      <AssistantBot />
    </div>
  );
}
