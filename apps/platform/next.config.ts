import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";

function storagePublicHostname(): string | null {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (!base) return null;
  try {
    return new URL(base).hostname;
  } catch {
    return null;
  }
}

const publicStorageHost = storagePublicHostname();

const nextConfig: NextConfig = {
  output: "standalone",

  // Ensure all API routes always return CORS headers — including error
  // responses (401, 500). Without this, a non-JSON error from the server
  // can appear as a "CORS error" in the browser console, masking the real cause.
  async headers() {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: origin },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET,POST,PUT,PATCH,DELETE,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
      ...(publicStorageHost
        ? [{ protocol: "https" as const, hostname: publicStorageHost }]
        : []),
    ],
  },
};

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "the-regenerative-tourism",
  project: "javascript-nextjs",
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/sentry-tunnel",
  silent: !process.env.CI,
});
