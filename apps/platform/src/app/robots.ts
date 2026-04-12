import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/discover",
          "/operators",
          "/destinations",
          "/methodology",
          "/leaderboard",
          "/pricing",
        ],
        disallow: [
          "/admin/",
          "/operator/",
          "/traveler/",
          "/account/",
          "/api/",
          "/uploads/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
          "/accept-invite",
          "/select-role",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
