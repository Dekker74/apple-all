"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { OffcutHeader } from "@/components/offcut/header";

export function OffcutShell({
  children,
  footer = true,
  wide = false,
  bare = false,
  header = true,
}: {
  children: React.ReactNode;
  footer?: boolean;
  wide?: boolean;
  bare?: boolean;
  header?: boolean;
}) {
  const { t } = useI18n();
  return (
    <div className="offcut-site">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-moss focus:px-4 focus:py-2 focus:text-[14px] focus:text-white">
        {t("shell.skip")}
      </a>
      {header ? <OffcutHeader /> : null}
      <main id="main" className={`offcut-main${wide ? " offcut-main-wide" : ""}${bare ? " offcut-main-bare" : ""}${header ? "" : " offcut-main-no-header"}`}>
        {children}
      </main>
      {footer ? (
        <footer className="offcut-footer">
          <div className="offcut-footer-inner">
            <p>© 2026 Offcut — {t("Materiali in movimento.")}</p>
            <p>
              <Link href="/privacy">{t("footer.privacy")}</Link> · <Link href="/terms">{t("Termini")}</Link> ·{" "}
              <Link href="/preventivo">{t("Preventivo")}</Link>
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
