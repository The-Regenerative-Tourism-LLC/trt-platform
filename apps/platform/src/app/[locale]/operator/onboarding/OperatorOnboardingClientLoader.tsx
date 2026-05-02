"use client";

import dynamic from "next/dynamic";

// ssr: false must be used inside a Client Component — not a Server Component.
// This wrapper is the boundary.
const OperatorOnboardingClient = dynamic(
  () =>
    import("./OperatorOnboardingClient").then((m) => ({
      default: m.OperatorOnboardingClient,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50 h-14" />
        <div className="flex-1 pt-14 pb-24 px-6">
          <div className="max-w-[768px] mx-auto py-10 space-y-8">
            <div className="space-y-3">
              <div className="h-10 w-80 rounded-xl bg-muted animate-pulse" />
              <div className="h-4 w-96 rounded bg-muted animate-pulse" />
            </div>
            <div className="space-y-3">
              <div className="h-20 rounded-2xl bg-muted animate-pulse" />
              <div className="h-20 rounded-2xl bg-muted animate-pulse" />
              <div className="h-20 rounded-2xl bg-muted animate-pulse" />
              <div className="h-20 rounded-2xl bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export function OperatorOnboardingClientLoader() {
  return <OperatorOnboardingClient />;
}
