"use client";

/**
 * ARCHITECTURE: Presentation-only component.
 *
 * This file displays traveler-facing data fetched from API routes.
 * It must NOT compute or approximate any scores.
 * All score data originates from immutable, persisted ScoreSnapshots.
 */

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

export function TravelerDashboardClient() {
  const { user, loading, signOut } = useAuth();
  const t = useTranslations("traveler.dashboard");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {t("welcome", { name: user?.name ?? "Traveler" })}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("tagline")}
          </p>
        </div>
        <button
          onClick={signOut}
          className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted transition-colors"
        >
          {t("signOut")}
        </button>
      </div>

      {/* Impact Passport Card */}
      <div className="rounded-lg border border-border bg-card p-8 flex flex-col items-center text-center gap-4 shadow-sm">
        <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
          <svg
            className="w-10 h-10 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold">{t("passport.title")}</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            {t("passport.description")}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/traveler/discover"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-semibold px-6 py-2.5 rounded-full hover:bg-primary/90 transition-colors text-sm"
          >
            {t("passport.discoverOperators")}
          </Link>
          <Link
            href="/traveler/passport"
            className="inline-flex items-center gap-2 border border-border px-6 py-2.5 rounded-full text-sm hover:bg-muted transition-colors"
          >
            {t("passport.viewPassport")}
          </Link>
        </div>
      </div>

      {/* Stats placeholder */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: t("stats.tripsBooked"), value: "0" },
          { label: t("stats.cumulativeScore"), value: "—" },
          { label: t("stats.contributions"), value: "0" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-5 text-center shadow-sm"
          >
            <p className="text-3xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
