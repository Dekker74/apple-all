"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun } from "lucide-react";
import { GlobalSearch } from "@/components/app/global-search";
import { NotificationMenu } from "@/components/app/notification-menu";
import { OrgSwitcher } from "@/components/app/org-switcher";
import { UserMenu } from "@/components/app/user-menu";
import { LanguageButtons } from "@/components/offcut/language-buttons";
import { OffcutLogo } from "@/components/offcut/logo";
import { useTheme } from "@/components/theme-provider";

const ITEMS = [
  { href: "/app/dashboard", label: "Home" },
  { href: "/app/marketplace", label: "Cerca materiali" },
  { href: "/app/matches", label: "I tuoi abbinamenti" },
  { href: "/app/listings", label: "Vendi materiale" },
  { href: "/app/requests", label: "Le mie richieste" },
  { href: "/app/orders", label: "I tuoi ordini" },
  { href: "/app/inbox", label: "Messaggi" },
  { href: "/app/settings", label: "Profilo" },
] as const;

export function AppNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="offcut-app-bar">
      <OffcutLogo />

      <nav className="offcut-app-links" aria-label="Spazio di lavoro">
        {ITEMS.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/app/dashboard" && pathname.startsWith(`${item.href}/`));
          return (
            <Link key={item.href} href={item.href} className={active ? "on" : undefined}>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="offcut-app-tools">
        <OrgSwitcher className="offcut-org-switcher" />
        <GlobalSearch />
        <NotificationMenu />
        <UserMenu compact />
        <div className="app-bar-utility">
          <LanguageButtons className="app-bar-languages" />
          <button
            type="button"
            className="app-theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
            title={theme === "dark" ? "Tema chiaro" : "Tema scuro"}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
