export { JsonLd } from "@/components/seo/JsonLd";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";

/** Organization schema for the root layout */
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "The Regenerative Tourism",
  url: BASE_URL,
  logo: `${BASE_URL}/assets/logo-regenerative-tourism.png`,
  sameAs: [],
  description:
    "The verified signal for regenerative tourism operators. GPS scores, DPI context, and Traveler Impact Profiles — all computation-auditable.",
};

/** WebSite schema with sitelinks searchbox */
export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "The Regenerative Tourism",
  url: BASE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${BASE_URL}/discover?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

/** Blog listing (CollectionPage) schema */
export const blogListingSchema = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "@id": `${BASE_URL}/journal`,
  name: "The Regenerative Tourism Journal",
  description:
    "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality.",
  url: `${BASE_URL}/journal`,
  isPartOf: { "@id": BASE_URL },
};

/** Build an Article schema for a blog post */
export function buildArticleSchema({
  title,
  description,
  publishedAt,
  updatedAt,
  slug,
  tags,
}: {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  slug: string;
  tags?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${BASE_URL}/blog/${slug}`,
    headline: title,
    description,
    url: `${BASE_URL}/blog/${slug}`,
    datePublished: publishedAt,
    dateModified: updatedAt ?? publishedAt,
    image: `${BASE_URL}/blog/${slug}/opengraph-image`,
    author: {
      "@type": "Organization",
      name: "The Regenerative Tourism",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "The Regenerative Tourism",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${BASE_URL}/assets/logo-regenerative-tourism.png`,
      },
    },
    isPartOf: { "@id": `${BASE_URL}/journal` },
    ...(tags && tags.length > 0 ? { keywords: tags.join(", ") } : {}),
  };
}

/** Build a TouristAttraction schema for a certified operator */
export function operatorSchema({
  id,
  name,
  region,
  gps,
  band,
  url,
}: {
  id: string;
  name: string;
  region?: string | null;
  gps?: number | null;
  band?: string | null;
  url?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    "@id": `${BASE_URL}/operators/${id}`,
    name,
    url: url ?? `${BASE_URL}/operators/${id}`,
    ...(region ? { address: { "@type": "PostalAddress", addressRegion: region } } : {}),
    ...(gps !== null && gps !== undefined
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Math.round(gps),
            bestRating: 100,
            worstRating: 0,
            ratingCount: 1,
          },
        }
      : {}),
    ...(band
      ? { additionalProperty: { "@type": "PropertyValue", name: "Green Passport Band", value: band } }
      : {}),
  };
}
