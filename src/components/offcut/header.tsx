"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/components/theme-provider";
import { OffcutLogo } from "@/components/offcut/logo";
import { LanguageButtons } from "@/components/offcut/language-buttons";

const LABELS = {
  it: {
    about: "Chi siamo",
    auth: "Accedi / Registrati",
    footprint: "Calcola la tua impronta",
    profile: "Il mio profilo",
    matches: "Abbinamenti",
    inbox: "Posta in arrivo",
    logout: "Esci",
    dark: "Scuro",
    light: "Chiaro",
  },
  en: {
    about: "Who we are",
    auth: "Log in / Sign up",
    footprint: "Know your footprint",
    profile: "My profile",
    matches: "Matches",
    inbox: "Inbox",
    logout: "Log out",
    dark: "Dark",
    light: "Light",
  },
} as const;

export function OffcutHeader() {
  const pathname = usePathname();
  const { lang } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const l = LABELS[lang];

  const links = [
    { href: "/chi-siamo", label: l.about },
    { href: "/login", label: l.auth },
    { href: "/impatto", label: l.footprint },
    { href: "/app/settings", label: l.profile },
    { href: "/app/matches", label: l.matches },
    { href: "/app/inbox", label: l.inbox },
  ].filter((link) => !(pathname.startsWith("/app") && link.href === "/login"));

  return (
    <header id="top">
      <OffcutLogo />
      <nav id="nav-links" aria-label="Offcut">
        {links.map((link) => {
          const active = pathname === link.href || (link.href === "/chi-siamo" && pathname === "/");
          return (
            <Link key={link.href} href={link.href} className={active ? "on" : undefined}>
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="ctrl-group">
        <LanguageButtons />
        <button type="button" id="theme-toggle" className="pill-btn" onClick={toggleTheme} aria-label="Toggle color theme">
          {theme === "dark" ? l.light : l.dark}
        </button>
      </div>
    </header>
  );
}
