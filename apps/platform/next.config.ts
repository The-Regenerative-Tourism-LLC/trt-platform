import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Enable server actions
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.railway.app",
      },
    ],
  },
};

export default nextConfig;
