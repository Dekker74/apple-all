import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://all-1-2026.vercel.app";

export const metadata: Metadata = {
  title: "Termini di servizio",
  description:
    "Condizioni d'uso della versione in validazione di Offcut: preventivi, commissioni, controllo qualità e responsabilità.",
  alternates: { canonical: "/terms" },
  openGraph: { title: "Termini di servizio · Offcut", url: `${siteUrl}/terms`, type: "website" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
