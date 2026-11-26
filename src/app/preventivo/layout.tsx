import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export const metadata: Metadata = {
  title: "Richiedi un preventivo",
  description:
    "Richiedi un preventivo per carta, legno o plastica di recupero: risposta entro 48 ore lavorative, un solo prezzo consegnato.",
  alternates: { canonical: "/preventivo" },
  openGraph: {
    title: "Richiedi un preventivo · Offcut",
    description:
      "Carta, legno e plastica di recupero: un solo prezzo consegnato. Risposta entro 48 ore lavorative.",
    url: `${siteUrl}/preventivo`,
    type: "website",
  },
};

export default function QuoteLayout({ children }: { children: React.ReactNode }) {
  return children;
}
