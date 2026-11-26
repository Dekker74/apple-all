import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export const metadata: Metadata = {
  title: "Calcolatore impatto",
  description:
    "Stima il risparmio annuo e la CO₂e evitata riusando carta, legno e plastica in eccedenza: scegli materiale e tonnellate mensili.",
  alternates: { canonical: "/impatto" },
  openGraph: {
    title: "Calcolatore impatto · Offcut",
    description: "Quanto risparmi e quanta CO₂e eviti ogni anno con il riuso dei materiali in eccedenza.",
    url: `${siteUrl}/impatto`,
    type: "website",
  },
};

export default function ImpactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
