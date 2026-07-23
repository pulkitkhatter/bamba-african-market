import { Helmet } from "react-helmet-async";
import { BUSINESS } from "../lib/content";

interface SeoProps {
  title: string;
  description: string;
  path: string;
}

const SITE_URL = "https://bambaafricanmarket.com"; // placeholder — update once the real domain is live

export function Seo({ title, description, path }: SeoProps) {
  const url = `${SITE_URL}${path}`;

  const groceryStoreSchema = {
    "@context": "https://schema.org",
    "@type": "GroceryStore",
    name: BUSINESS.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: "1193 Fulton Street",
      addressLocality: "Brooklyn",
      addressRegion: "NY",
      postalCode: "11238",
      addressCountry: "US",
    },
    telephone: BUSINESS.phoneDisplay,
    priceRange: "$$",
    openingHours: "Mo-Su 08:00-01:00",
    url: SITE_URL,
  };

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <script type="application/ld+json">
        {JSON.stringify(groceryStoreSchema)}
      </script>
    </Helmet>
  );
}
