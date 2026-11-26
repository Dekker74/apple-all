import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://apple-all.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app", "/api", "/auth", "/login", "/signup", "/onboarding", "/forgot-password"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
