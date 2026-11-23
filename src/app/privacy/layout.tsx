import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://all-1-2026.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Come Offcut tratta i dati inviati con la richiesta di preventivo e con la creazione di un account.",
  alternates: { canonical: "/privacy" },
  openGraph: { title: "Privacy Policy · Offcut", url: `${siteUrl}/privacy`, type: "website" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
