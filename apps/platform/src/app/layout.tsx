import type { Metadata } from "next";
import { Instrument_Sans, Caveat, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { JsonLd, organizationSchema, websiteSchema } from "@/lib/seo/json-ld";
import { TrackingScripts } from "@/components/TrackingScripts";

const instrumentSans = Instrument_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

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
  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${instrumentSans.variable} ${caveat.variable} ${jetbrainsMono.variable} antialiased`}
      >
        <JsonLd schema={organizationSchema} />
        <JsonLd schema={websiteSchema} />
        <Providers>
          <TrackingScripts />
          {children}
        </Providers>
      </body>
    </html>
  );
}
