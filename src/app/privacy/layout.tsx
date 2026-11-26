import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Offcut handles data submitted with quote requests and when you create an account.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy · Offcut",
    description: "How Offcut handles quote-request and account data.",
    url: `${siteUrl}/privacy`,
    type: "website",
    locale: "en_GB",
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
