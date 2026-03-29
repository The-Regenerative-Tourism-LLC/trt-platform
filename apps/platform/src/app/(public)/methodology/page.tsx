import type { Metadata } from "next";
import { Suspense } from "react";
import { MethodologyClient } from "./MethodologyClient";

export const metadata: Metadata = {
  title: "Methodology",
  description:
    "How the Green Passport Score, Destination Pressure Index, and Traveler Impact Profile are calculated.",
};

function MethodologyFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <span className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
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
