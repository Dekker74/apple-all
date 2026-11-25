const description =
  "Marketplace per il recupero e il riuso di materiali industriali in eccedenza.";

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
