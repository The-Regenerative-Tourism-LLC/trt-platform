"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { acceptTermsAction } from "./actions";

export function AcceptTermsForm() {
  const { update } = useSession();
  const [termsOptIn, setTermsOptIn] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!termsOptIn) {
      setError("You must accept the Terms & Conditions and Privacy Policy to continue.");
      return;
    }
    setError("");
    startTransition(async () => {
      try {
        await acceptTermsAction({ termsOptIn: true, marketingOptIn });
        await update({});
        window.location.href = "/";
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">
          {error}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface/30 p-5 space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
          />
          <span className="text-sm text-muted-foreground">
            I want to receive news, tips, and updates about regenerative tourism. (Optional)
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={termsOptIn}
            onChange={(e) => setTermsOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
            required
          />
          <span className="text-sm text-foreground">
            I have read and agree to the{" "}
            <Link href="/terms" target="_blank" className="underline hover:text-primary">
              Terms &amp; Conditions
            </Link>{" "}
            and{" "}
            <Link href="/privacy" target="_blank" className="underline hover:text-primary">
              Privacy Policy
            </Link>
            . <span className="text-destructive">*</span>
          </span>
        </label>
      </div>

      <button
        type="submit"
        disabled={!termsOptIn || isPending}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
      >
        {isPending ? (
          <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
        ) : null}
        {isPending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
