import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all-andrea-grecos-projects.vercel.app";

export const metadata: Metadata = {
  title: "Chi siamo",
  description:
    "Offcut è un marketplace gestito per materiali in eccedenza: carta, legno e plastica con specifiche chiare, lavorazione e trasporto inclusi.",
  alternates: { canonical: "/chi-siamo" },
  openGraph: { title: "Chi siamo · Offcut", url: `${siteUrl}/chi-siamo`, type: "website" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
