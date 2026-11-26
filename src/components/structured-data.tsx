const description =
  "Offcut helps businesses see industrial surplus as a resource. We connect companies with reusable or recoverable materials, then collect, process and deliver them.";

export function StructuredData({ siteUrl }: { siteUrl: string }) {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Offcut",
        url: siteUrl,
        logo: `${siteUrl}/images/offcut-logo.svg`,
        areaServed: "IT",
        description,
      },
      {
        "@type": "WebSite",
        name: "Offcut",
        url: siteUrl,
        description,
        inLanguage: ["en", "it"],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  );
}
