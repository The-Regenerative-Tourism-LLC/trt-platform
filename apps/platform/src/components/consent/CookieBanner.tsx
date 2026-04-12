"use client";

import { useState } from "react";
import Link from "next/link";
import { useCookieConsent } from "@/hooks/useCookieConsent";

export function CookieBanner() {
  const { consent, mounted, acceptAll, rejectAll, savePreferences } = useCookieConsent();
  const [showPreferences, setShowPreferences] = useState(false);
  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const [marketingChecked, setMarketingChecked] = useState(false);

  // Don't render until mounted (avoids SSR mismatch) or if consent is already set
  if (!mounted || !consent.needsConsent) return null;

  if (showPreferences) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cookie preferences"
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/40"
      >
        <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-foreground">Cookie preferences</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Manage which cookies we may use.{" "}
              <Link href="/cookies" className="underline hover:text-foreground">
                Cookie Policy
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            {/* Essential — always on */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Essential</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Required for the platform to function. Cannot be disabled.
                </p>
              </div>
              <div className="flex items-center h-5 mt-0.5">
                <input type="checkbox" checked disabled className="h-4 w-4 rounded border-border opacity-50 cursor-not-allowed" />
              </div>
            </div>

            {/* Analytics */}
            <div className="flex items-start justify-between gap-4 py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Google Analytics and Microsoft Clarity to understand how the platform is used.
                </p>
              </div>
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={analyticsChecked}
                  onChange={(e) => setAnalyticsChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Marketing */}
            <div className="flex items-start justify-between gap-4 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Marketing</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Klaviyo, Meta Pixel, and Google Ads to deliver relevant content.
                </p>
              </div>
              <div className="flex items-center h-5 mt-0.5">
                <input
                  type="checkbox"
                  checked={marketingChecked}
                  onChange={(e) => setMarketingChecked(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => savePreferences({ analytics: analyticsChecked, marketing: marketingChecked })}
              className="flex-1 bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(false)}
              className="px-4 py-2.5 text-sm text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6"
    >
      <div className="max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-xl p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="flex-1 text-sm text-foreground">
            We use cookies to improve your experience. Read our{" "}
            <Link href="/cookies" className="underline hover:text-primary">
              Cookie Policy
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setAnalyticsChecked(false);
                setMarketingChecked(false);
                setShowPreferences(true);
              }}
              className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Customize
            </button>
            <button
              type="button"
              onClick={rejectAll}
              className="px-4 py-2 text-sm text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
            >
              Reject all
            </button>
            <button
              type="button"
              onClick={acceptAll}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
