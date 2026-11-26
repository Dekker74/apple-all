import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export const metadata: Metadata = {
  title: "Terms of service",
  description:
    "Terms governing the validation version of Offcut: quotes, commissions, quality control and liability.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of service · Offcut",
    description:
      "Terms governing the Offcut validation version, including quotes, commissions and quality control.",
    url: `${siteUrl}/terms`,
    type: "website",
    locale: "en_GB",
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
