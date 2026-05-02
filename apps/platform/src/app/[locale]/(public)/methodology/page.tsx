import type { Metadata } from "next";
import { Suspense } from "react";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = {
  title: "Scoring Methodology",
  description:
    "How the Green Passport Score (GPS), Destination Pressure Index (DPI), and Traveler Impact Profile are calculated — full computation methodology.",
  alternates: { canonical: "/methodology" },
  openGraph: {
    title: "Green Passport Scoring Methodology",
    description:
      "How the Green Passport Score (GPS), Destination Pressure Index (DPI), and Traveler Impact Profile are calculated.",
    url: "/methodology",
  },
  twitter: {
    card: "summary_large_image",
    title: "Green Passport Scoring Methodology",
    description:
      "How the GPS, DPI, and Traveler Impact Profile are calculated — full computation methodology.",
  },
};

function MethodologyFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <Suspense fallback={<MethodologyFallback />}>
      <MethodologyClient />
    </Suspense>
  );
}
