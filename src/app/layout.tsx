import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import "./offcut.css";
import "./apple.css";
import { Providers } from "@/components/providers";
import { StructuredData } from "@/components/structured-data";
import { ChatWidget } from "@/components/chat-widget";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Offcut – Scrap becomes raw material",
    template: "%s · Offcut",
  },
  description:
    "Offcut helps businesses see industrial surplus as a resource. We connect companies with reusable or recoverable materials, then collect, process and deliver them.",
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: "Offcut – Scrap becomes raw material",
    description:
      "Who we are — Offcut turns industrial leftovers into raw material for other businesses.",
    type: "website",
    locale: "en_GB",
    url: siteUrl,
    siteName: "Offcut",
    images: [{ url: "/images/og-cover.png", width: 1200, height: 630, alt: "Offcut — materials in motion" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Offcut – Scrap becomes raw material",
    description: "Materials in motion. Industrial surplus matched, collected and delivered.",
    images: ["/images/og-cover.png"],
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f7",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('js');var t=localStorage.getItem('circularlink-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d){document.documentElement.classList.add('dark');document.documentElement.style.colorScheme='dark';}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <StructuredData siteUrl={siteUrl} />
        <Providers>{children}</Providers>
        <ChatWidget />
      </body>
    </html>
  );
}
