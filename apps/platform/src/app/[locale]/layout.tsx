import type { Metadata } from "next";
import "../globals.css";
import { Providers } from "../providers";
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/seo/json-ld";
import { TrackingScripts } from "@/components/TrackingScripts";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";

/*
  Font: "TWK Lausanne" must be self-hosted via next/font/local.
  Add font files to /public/fonts/ and uncomment below when ready.

  import localFont from "next/font/google";
  const twkLausanne = localFont({
    src: [
      { path: "../../../public/fonts/TWKLausanne-400.woff2", weight: "400" },
      { path: "../../../public/fonts/TWKLausanne-500.woff2", weight: "500" },
      { path: "../../../public/fonts/TWKLausanne-600.woff2", weight: "600" },
      { path: "../../../public/fonts/TWKLausanne-700.woff2", weight: "700" },
    ],
    variable: "--font-sans",
    display: "swap",
  });

  Then add twkLausanne.variable to body className.
  Until then, system-ui is the effective fallback.
*/

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "The Regenerative Tourism · Verified Impact for Conscious Travel",
    template: "%s · The Regenerative Tourism",
  },
  description:
    "The verified signal for regenerative tourism operators. GPS scores, DPI context, and Traveler Impact Profiles — all computation-auditable.",
  keywords: [
    "regenerative tourism",
    "sustainable travel",
    "green passport score",
    "GPS certification",
    "destination pressure index",
    "DPI",
    "eco-tourism",
    "verified operators",
    "responsible travel",
    "tourism certification",
  ],
  authors: [{ name: "The Regenerative Tourism" }],
  creator: "The Regenerative Tourism",
  publisher: "The Regenerative Tourism",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: "The Regenerative Tourism",
    url: BASE_URL,
    title: "The Regenerative Tourism · Verified Impact for Conscious Travel",
    description:
      "The verified signal for regenerative tourism operators. GPS scores, DPI context, and Traveler Impact Profiles — all computation-auditable.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "The Regenerative Tourism — Verified Impact for Conscious Travel",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Regenerative Tourism · Verified Impact for Conscious Travel",
    description:
      "The verified signal for regenerative tourism operators. GPS scores, DPI context, and Traveler Impact Profiles.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: BASE_URL },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="antialiased">
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <TrackingScripts />
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
