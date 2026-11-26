"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/components/theme-provider";
import { OffcutLogo } from "@/components/offcut/logo";
import { LanguageButtons } from "@/components/offcut/language-buttons";

export function OffcutHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  const links = [
    { href: "/chi-siamo", label: t("header.about") },
    { href: "/login", label: t("header.auth") },
    { href: "/impatto", label: t("header.footprint") },
    { href: "/app/settings", label: t("header.profile") },
    { href: "/app/matches", label: t("header.matches") },
    { href: "/app/inbox", label: t("header.inbox") },
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
        <button type="button" id="theme-toggle" className="pill-btn" onClick={toggleTheme} aria-label={t("header.themeToggle")}>
          {theme === "dark" ? t("header.light") : t("header.dark")}
        </button>
      </div>
    </header>
  );
}
