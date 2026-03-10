"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  GPSCircle,
  GPSBandBadge,
  DPSBandBadge,
  PressureBadge,
} from "@/components/scoring/ScoreDisplays";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

interface OperatorDashboardData {
  operator: {
    id: string;
    legalName: string;
    tradingName: string | null;
    country: string | null;
    destinationRegion: string | null;
    operatorType: string | null;
    operatorCode: string | null;
    assessmentCycleCount: number;
    onboardingStep: number;
    onboardingData: Record<string, unknown>;
    territory: {
      id: string;
      name: string;
      compositeDpi: number | null;
      pressureLevel: string | null;
      touristIntensity: number | null;
      ecologicalSensitivity: number | null;
      economicLeakageRate: number | null;
      regenerativePerformance: number | null;
      dpiComputedAt: string | null;
    } | null;
    latestScore: {
      id: string;
      gpsTotal: number;
      gpsBand: GreenPassportBand;
      p1Score: number;
      p2Score: number;
      p3Score: number;
      dpsTotal: number | null;
      dps1: number | null;
      dps2: number | null;
      dps3: number | null;
      dpsBand: DpsBand | null;
      isPublished: boolean;
      publicationBlockedReason: string | null;
      computedAt: string;
    } | null;
  } | null;
}

function fetchDashboard(): Promise<OperatorDashboardData> {
  return fetch("/api/v1/operator/dashboard").then((r) => r.json());
}

export function OperatorDashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["operator-dashboard"],
    queryFn: fetchDashboard,
    enabled: !!user,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const operator = data?.operator;

  if (!operator) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-6 px-4">
        <div className="w-20 h-20 rounded-full bg-emerald-50 mx-auto flex items-center justify-center">
          <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold">Welcome to Green Passport</h1>
        <p className="text-muted-foreground">
          Complete your operator assessment to receive your Green Passport Score and
          showcase your regenerative impact to travelers.
        </p>
        <Link
          href="/operator/onboarding"
          className="inline-flex items-center gap-2 bg-emerald-600 text-white font-semibold px-8 py-3 rounded-full hover:bg-emerald-700 transition-colors"
        >
          Start Assessment →
        </Link>
      </div>
    );
  }

  const score = operator.latestScore;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            {operator.tradingName || operator.legalName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {operator.destinationRegion}
            {operator.country ? `, ${operator.country}` : ""}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/operator/onboarding"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-4 py-2 rounded-full text-sm hover:bg-emerald-700 transition-colors"
          >
            {(operator.assessmentCycleCount ?? 0) > 0
              ? "New Assessment"
              : "Continue Assessment"}
          </Link>
          <Link
            href="/operator/evidence"
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted transition-colors"
          >
            Evidence
          </Link>
          {score?.isPublished && (
            <Link
              href={`/operators/${operator.id}`}
              className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted transition-colors"
            >
              Public Passport
            </Link>
          )}
        </div>
      </div>

      {/* Operator code */}
      {operator.operatorCode && (
        <div className="rounded-2xl border bg-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">Your Operator Code</p>
            <p className="text-2xl font-mono font-bold tracking-widest mt-0.5">
              {operator.operatorCode}
            </p>
            <p className="text-xs text-muted-foreground">
              Display at reception — travelers scan to check in
            </p>
          </div>
        </div>
      )}

      {score ? (
        <>
          {/* GPS + Pillars */}
          <div className="grid md:grid-cols-5 gap-5">
            {/* Score card */}
            <div className="md:col-span-2 rounded-2xl border bg-card p-6 flex flex-col items-center justify-center gap-4">
              <GPSCircle score={score.gpsTotal} band={score.gpsBand} size={144} />
              <GPSBandBadge band={score.gpsBand} />
              {score.dpsBand && <DPSBandBadge band={score.dpsBand} />}
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  score.isPublished
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {score.isPublished ? "✓ Published" : "Pending verification"}
              </span>
              {score.publicationBlockedReason && (
                <p className="text-xs text-muted-foreground text-center">
                  {score.publicationBlockedReason}
                </p>
              )}
            </div>

            {/* Pillar breakdown */}
            <div className="md:col-span-3 rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Impact Pillars
              </p>
              <div className="space-y-4">
                {[
                  {
                    label: "P1 Operational Footprint",
                    score: score.p1Score,
                    weight: 0.4,
                    colorClass: "bg-emerald-500",
                  },
                  {
                    label: "P2 Local Integration",
                    score: score.p2Score,
                    weight: 0.3,
                    colorClass: "bg-amber-500",
                  },
                  {
                    label: "P3 Regenerative Contribution",
                    score: score.p3Score,
                    weight: 0.3,
                    colorClass: "bg-teal-500",
                  },
                ].map((p) => (
                  <div key={p.label} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{p.label}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {p.score}/100 · {Math.round(p.weight * 100)}% ={" "}
                        {Math.round(p.score * p.weight)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${p.colorClass}`}
                        style={{ width: `${p.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Weighted total:{" "}
                {Math.round(
                  score.p1Score * 0.4 +
                    score.p2Score * 0.3 +
                    score.p3Score * 0.3
                )}
                /100
              </p>
            </div>
          </div>

          {/* DPS */}
          {score.dpsTotal != null && (
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Direction of Performance Score
                </p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black tabular-nums">
                  {score.dpsTotal > 0 ? "+" : ""}
                  {score.dpsTotal}
                </span>
                {score.dpsBand && <DPSBandBadge band={score.dpsBand} />}
              </div>
              {score.dps1 != null && (
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: "DPS-1 Δ Indicators", value: score.dps1 },
                    { label: "DPS-2 Improving %", value: score.dps2 },
                    { label: "DPS-3 P3 Bonus", value: score.dps3 },
                  ].map((d) => (
                    <div
                      key={d.label}
                      className="rounded-xl bg-muted p-3"
                    >
                      <span className="text-lg font-bold tabular-nums">
                        {d.value != null
                          ? d.value > 0
                            ? `+${d.value}`
                            : d.value
                          : "—"}
                      </span>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {d.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Tracks trajectory — rewarding progress, not perfection. Range:
                -10 to +25.
              </p>
            </div>
          )}

          {/* DPI */}
          {operator.territory?.compositeDpi != null && (
            <div className="rounded-2xl border bg-card p-6 space-y-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                Destination Pressure Index — {operator.territory.name}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-4xl font-black tabular-nums">
                  {operator.territory.compositeDpi}
                </span>
                {operator.territory.pressureLevel && (
                  <PressureBadge level={operator.territory.pressureLevel} />
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Tourist Intensity",
                    value: operator.territory.touristIntensity,
                    weight: "35%",
                  },
                  {
                    label: "Ecological Sensitivity",
                    value: operator.territory.ecologicalSensitivity,
                    weight: "30%",
                  },
                  {
                    label: "Economic Leakage",
                    value: operator.territory.economicLeakageRate,
                    weight: "20%",
                  },
                  {
                    label: "Regen. Performance",
                    value: operator.territory.regenerativePerformance,
                    weight: "15%",
                  },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl bg-muted p-3 text-center"
                  >
                    <span className="text-lg font-bold">
                      {m.value ?? "—"}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {m.label} ({m.weight})
                    </p>
                  </div>
                ))}
              </div>
              {operator.territory.dpiComputedAt && (
                <p className="text-xs text-muted-foreground">
                  Updated{" "}
                  {new Date(
                    operator.territory.dpiComputedAt
                  ).toLocaleDateString()}
                </p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-2xl border bg-card p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto flex items-center justify-center">
            <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="font-semibold text-lg">No assessment completed yet</p>
          <p className="text-sm text-muted-foreground">
            Complete your onboarding to receive your Green Passport Score.
          </p>
          <Link
            href="/operator/onboarding"
            className="inline-flex items-center gap-2 bg-emerald-600 text-white font-medium px-6 py-2.5 rounded-full text-sm hover:bg-emerald-700 transition-colors"
          >
            Start Assessment →
          </Link>
        </div>
      )}
    </div>
  );
}
