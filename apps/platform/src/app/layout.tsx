import type { Metadata } from "next";
import { Instrument_Sans, Caveat, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "./providers";

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

export const metadata: Metadata = {
  title: {
    default: "Green Passport · The Regenerative Tourism",
    template: "%s · Green Passport",
  },
  description:
    "The verified signal for regenerative tourism operators. GPS scores, DPI context, and Traveler Impact Profiles — all computation-auditable.",
  openGraph: {
    type: "website",
    siteName: "Green Passport",
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
        {/* Klaviyo onsite script — replace YOUR_KLAVIYO_PUBLIC_KEY with your account's public API key */}
        <Script
          src="https://static.klaviyo.com/onsite/js/klaviyo.js?company_id=YOUR_KLAVIYO_PUBLIC_KEY"
          strategy="afterInteractive"
        />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
