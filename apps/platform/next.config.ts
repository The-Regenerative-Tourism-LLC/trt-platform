import type { NextConfig } from "next";

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

export default nextConfig;
