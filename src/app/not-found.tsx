"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

const links = [
  { href: "/", labelKey: "notFound.home" },
  { href: "/preventivo", labelKey: "nav.cta" },
  { href: "/chi-siamo", labelKey: "notFound.about" },
  { href: "/privacy", labelKey: "footer.privacy" },
] as const;

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-line px-6 py-5">
        <Link href="/" className="font-serif text-2xl text-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4">
          Offcut
        </Link>
      </header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-20">
        <p className="eyebrow">{t("notFound.eyebrow")}</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight sm:text-6xl">{t("notFound.title")}</h1>
        <p className="mt-5 max-w-xl text-muted">{t("notFound.desc")}</p>
        <nav aria-label={t("notFound.nav")} className="mt-8 grid gap-3 sm:grid-cols-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xl border border-line bg-white p-4 text-forest shadow-soft transition-colors hover:bg-paper focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest">
              {t(link.labelKey)}
            </Link>
          ))}
        </nav>
      </main>
      <footer className="border-t border-line px-6 py-5 text-center text-sm text-muted">Offcut</footer>
    </div>
  );
}
