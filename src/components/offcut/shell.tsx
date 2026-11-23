import Link from "next/link";
import { OffcutHeader } from "@/components/offcut/header";

export function OffcutShell({
  children,
  footer = true,
  wide = false,
}: {
  children: React.ReactNode;
  footer?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="offcut-site">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-moss focus:px-4 focus:py-2 focus:text-[14px] focus:text-white">
        Vai al contenuto / Skip to content
      </a>
      <OffcutHeader />
      <main id="main" className={`offcut-main${wide ? " offcut-main-wide" : ""}`}>
        {children}
      </main>
      {footer ? (
        <footer className="offcut-footer">
          <div className="offcut-footer-inner">
            <p>© 2026 Offcut — Materials in motion.</p>
            <p>
              <Link href="/privacy">Privacy</Link> · <Link href="/terms">Termini</Link> ·{" "}
              <Link href="/preventivo">Preventivo</Link>
            </p>
          </div>
        </footer>
      ) : null}
    </div>
  );
}
