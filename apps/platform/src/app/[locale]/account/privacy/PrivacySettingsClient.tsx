"use client";

import { useState } from "react";
import { useCookieConsent } from "@/hooks/useCookieConsent";

type Props = {
  initialMarketing: boolean;
  marketingConsentedAt: string | null;
  initialCookieAnalytics: boolean | null;
  initialCookieMarketing: boolean | null;
  cookieConsentUpdatedAt: string | null;
};

export function PrivacySettingsClient({
  initialMarketing,
  marketingConsentedAt,
  initialCookieAnalytics,
  initialCookieMarketing,
  cookieConsentUpdatedAt,
}: Props) {
  const [marketingChecked, setMarketingChecked] = useState(initialMarketing);
  const [savingMarketing, setSavingMarketing] = useState(false);
  const [marketingMessage, setMarketingMessage] = useState("");

  const { consent, mounted, savePreferences } = useCookieConsent();

  const [analyticsChecked, setAnalyticsChecked] = useState(
    initialCookieAnalytics ?? (mounted ? consent.analytics : false)
  );
  const [cookieMarketingChecked, setCookieMarketingChecked] = useState(
    initialCookieMarketing ?? (mounted ? consent.marketing : false)
  );
  const [savingCookies, setSavingCookies] = useState(false);
  const [cookieMessage, setCookieMessage] = useState("");

  const saveMarketing = async () => {
    setSavingMarketing(true);
    setMarketingMessage("");
    try {
      const res = await fetch("/api/account/marketing-consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingOptIn: marketingChecked }),
      });
      if (!res.ok) throw new Error();
      setMarketingMessage("Saved.");
    } catch {
      setMarketingMessage("Failed to save. Please try again.");
    } finally {
      setSavingMarketing(false);
    }
  };

  const saveCookies = async () => {
    setSavingCookies(true);
    setCookieMessage("");
    try {
      savePreferences({ analytics: analyticsChecked, marketing: cookieMarketingChecked });
      setCookieMessage("Saved.");
    } catch {
      setCookieMessage("Failed to save. Please try again.");
    } finally {
      setSavingCookies(false);
    }
  };

  return (
    <>
      {/* Marketing email consent */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">Marketing emails</h2>
        <p className="text-sm text-black mb-4">
          Receive news, tips, and updates about regenerative tourism via Klaviyo. You can withdraw this consent at any time.
        </p>
        <label className="flex items-center gap-3 cursor-pointer mb-4">
          <input
            type="checkbox"
            checked={marketingChecked}
            onChange={(e) => setMarketingChecked(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-foreground">
            I want to receive marketing emails
          </span>
        </label>
        {marketingConsentedAt && initialMarketing && (
          <p className="text-xs text-black mb-3">
            Opted in: {new Date(marketingConsentedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveMarketing}
            disabled={savingMarketing}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {savingMarketing ? "Saving…" : "Save"}
          </button>
          {marketingMessage && (
            <span className="text-sm text-black">{marketingMessage}</span>
          )}
        </div>
      </div>

      {/* Cookie consent */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-1">Cookie preferences</h2>
        <p className="text-sm text-black mb-4">
          Manage which optional cookies we may use. Essential cookies cannot be disabled.
        </p>
        {cookieConsentUpdatedAt && (
          <p className="text-xs text-black mb-3">
            Last updated: {new Date(cookieConsentUpdatedAt).toLocaleDateString("en-GB", { dateStyle: "medium" })}
          </p>
        )}
        <div className="space-y-3 mb-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsChecked}
              onChange={(e) => setAnalyticsChecked(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <span className="text-sm text-foreground block">Analytics</span>
              <span className="text-xs text-black">Google Analytics, Microsoft Clarity</span>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={cookieMarketingChecked}
              onChange={(e) => setCookieMarketingChecked(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
            <div>
              <span className="text-sm text-foreground block">Marketing</span>
              <span className="text-xs text-black">Klaviyo, Meta Pixel, Google Ads</span>
            </div>
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={saveCookies}
            disabled={savingCookies}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {savingCookies ? "Saving…" : "Save"}
          </button>
          {cookieMessage && (
            <span className="text-sm text-black">{cookieMessage}</span>
          )}
        </div>
      </div>
    </>
  );
}
