"use client";

/**
 * ARCHITECTURE: Presentation-only component.
 *
 * This file displays ScoreSnapshot data fetched from GET /api/v1/operator/dashboard.
 * It must NOT compute, approximate, or infer GPS/DPS/DPI scores.
 * All score values originate from a persisted ScoreSnapshot — never from local calculation.
 * ScoreSnapshots are immutable and append-only; this component only reads and renders them.
 *
 * BUSINESS RULES (enforced here at UI layer):
 * - Each operator has exactly one assessment (Cycle 1). No "New Assessment Cycle" until further notice.
 * - Submitted assessments are view-only; the Edit button navigates back to the onboarding form.
 * - Scores use Proxy multipliers (×0.25) until evidence items are individually approved.
 * - "Complete Public Profile" is disabled in this release.
 */

import { useQuery } from "@tanstack/react-query";
import { fetchJson } from "@/lib/api/client";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  QrCode,
  FileText,
  Globe,
  Leaf,
  Zap,
  TrendingUp,
  Copy,
  ClipboardList,
  ArrowRight,
  MapPin,
} from "lucide-react";
import {
  GPSCircle,
  GPSBandBadge,
  DPSBandBadge,
  PressureBadge,
} from "@/components/scoring/ScoreDisplays";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
    onboardingCompleted: boolean;
    onboardingStep: number;
    onboardingData: Record<string, unknown>;
    coverPhotoUrl: string | null;
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
    previousScore: {
      gpsScore: number;
      pillar1Score: number;
      pillar2Score: number;
      pillar3Score: number;
      createdAt: string;
    } | null;
  } | null;
}

function fetchDashboard(): Promise<OperatorDashboardData> {
  return fetchJson<OperatorDashboardData>("/api/v1/operator/dashboard");
}

export function OperatorDashboardClient() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("operator.dashboard");

  function pillarDescription(label: "p1" | "p2" | "p3", score: number): string {
    if (label === "p1") {
      if (score >= 70) return t("pillarDesc.p1.high");
      if (score >= 40) return t("pillarDesc.p1.mid");
      return t("pillarDesc.p1.low");
    }
    if (label === "p2") {
      if (score >= 70) return t("pillarDesc.p2.high");
      if (score >= 30) return t("pillarDesc.p2.mid");
      return t("pillarDesc.p2.low");
    }
    if (score >= 50) return t("pillarDesc.p3.high");
    if (score >= 20) return t("pillarDesc.p3.mid");
    return t("pillarDesc.p3.low");
  }
  const withLocale = (path: string) => (locale === "en" ? path : `/${locale}${path}`);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["operator-dashboard"],
    queryFn: fetchDashboard,
    enabled: !!user,
    retry: false,
  });

  const operator = data?.operator;

  useEffect(() => {
    if (!isLoading && !authLoading && operator === null) {
      router.replace(withLocale("/operator/onboarding"));
    }
  }, [operator, isLoading, authLoading, router, locale]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Leaf className="w-7 h-7 text-foreground/60" />
        </div>
        <div className="space-y-2 max-w-md">
          <h1 className="text-2xl font-bold tracking-tight">{t("error.title")}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("error.description")}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {error instanceof Error ? error.message : "Unknown API error"}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href={withLocale("/operator/onboarding")}>{t("error.openOnboarding")}</Link>
        </Button>
      </div>
    );
  }

  if (authLoading || isLoading || !operator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Onboarding saved but not yet submitted
  if (!operator.onboardingCompleted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
          <Leaf className="w-7 h-7 text-foreground/60" />
        </div>
        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-bold tracking-tight">{t("inProgress.title")}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("inProgress.description")}
          </p>
        </div>
        <Button asChild size="lg" className="gap-2">
          <Link href={withLocale("/operator/onboarding")}>
            {t("inProgress.continue")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    );
  }

  const score = operator.latestScore;
  const prev = operator.previousScore;
  const territory = operator.territory;

  const displayName = operator.tradingName || operator.legalName;
  const location = [operator.destinationRegion, operator.country].filter(Boolean).join(", ");

  // Cover photo is stored in object storage; URL is fetched from OperatorPhoto DB record
  const coverUrl = operator.coverPhotoUrl;

  return (
    <div>
      {/* Cover hero — full viewport width, no container constraints */}
      <div className="relative w-full h-52 sm:h-64 overflow-hidden">
        {/* Cover image from step 3 upload, fallback to gradient */}
        {coverUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${coverUrl})` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-stone-300 via-amber-100 to-stone-200" />
        )}
        {/* Bottom fade */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/80 to-transparent" />
        {/* Name + location overlay — aligned to the content max-width */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="max-w-6xl mx-auto px-5 sm:px-6 pb-4 space-y-0.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground drop-shadow-sm">
              {displayName}
            </h1>
            {location && (
              <div className="flex items-center gap-1 text-sm text-foreground/70">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span>{location}</span>
                {operator.operatorType && (
                  <Badge variant="outline" className="ml-1.5 text-xs bg-background/60">
                    Type {operator.operatorType}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Constrained content */}
      <div className="max-w-6xl mx-auto px-5 sm:px-6 py-6 sm:py-8 space-y-5">

      {/* QR / Operator Code card */}
      {operator.operatorCode && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {t("operatorCode.label")}
              </p>
              <p className="text-2xl font-mono font-bold tracking-widest mt-0.5">
                {operator.operatorCode}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {t("operatorCode.hint")}
              </p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(operator.operatorCode ?? "")}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 border border-border rounded-lg px-3 py-2"
            >
              <Copy className="w-3.5 h-3.5" />
              {t("operatorCode.copy")}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Action buttons row */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" asChild>
          <Link href={withLocale("/operator/evidence")}>
            <FileText className="h-4 w-4 mr-1.5" />
            {t("actions.evidence")}
          </Link>
        </Button>
        {/* Action Plan — coming soon */}
        <Button variant="outline" disabled className="gap-1.5 opacity-50 cursor-not-allowed">
          <ClipboardList className="h-4 w-4" />
          {t("actions.actionPlan")}
        </Button>
      </div>

      {/* Complete public profile — disabled in this release */}
      <Card className="border-border/60">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t("publicProfile.title")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t("publicProfile.description")}
            </p>
          </div>
          <Button disabled className="shrink-0 opacity-40 cursor-not-allowed gap-1.5" size="sm">
            {t("publicProfile.button")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardContent>
      </Card>

      {score ? (
        <>
          {/* GPS Score + Pillars */}
          <div className="grid md:grid-cols-5 gap-5">
            {/* Score card */}
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-7">
                <GPSCircle score={score.gpsTotal} band={score.gpsBand} size={152} />
                <div className="flex flex-wrap justify-center gap-2">
                  <GPSBandBadge band={score.gpsBand} />
                  {score.dpsBand && <DPSBandBadge band={score.dpsBand} />}
                </div>
                <Badge
                  variant="secondary"
                  className={
                    score.isPublished
                      ? "bg-secondary text-primary border-primary/20"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  {score.isPublished ? t("score.published") : t("score.pendingVerification")}
                </Badge>
                {!score.isPublished && (
                  <p className="text-[11px] text-muted-foreground text-center px-3 leading-relaxed">
                    {t("score.proxyNote")}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Pillar breakdown */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-2 pt-5">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  {t("pillars.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-5">
                {(
                  [
                    {
                      key: "p1" as const,
                      label: t("pillars.p1"),
                      score: score.p1Score,
                      color: "bg-green-500",
                    },
                    {
                      key: "p2" as const,
                      label: t("pillars.p2"),
                      score: score.p2Score,
                      color: "bg-amber-500",
                    },
                    {
                      key: "p3" as const,
                      label: t("pillars.p3"),
                      score: score.p3Score,
                      color: "bg-blue-500",
                    },
                  ] as const
                ).map(({ key, label, score: s, color }) => (
                  <div key={key} className="rounded-xl border border-border/50 bg-card px-4 py-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${color} shrink-0`} />
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums shrink-0">{Math.round(s * 10) / 10}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all duration-700`}
                        style={{ width: `${Math.min(s, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{pillarDescription(key, s)}</p>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between text-sm px-1">
                  <span className="font-medium">{t("pillars.gpsScore")}</span>
                  <span className="tabular-nums font-bold">{score.gpsTotal}/100</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Territory Index (DPI) */}
          {territory?.compositeDpi != null && (
            <Card>
              <CardContent className="pt-5 pb-5 space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                    <Globe className="h-3.5 w-3.5" />
                    {t("territory.label", { name: territory.name })}
                  </div>
                  {territory.pressureLevel && (
                    <PressureBadge level={territory.pressureLevel} />
                  )}
                </div>

                {/* Composite score row */}
                <div className="flex items-baseline gap-3 border-b border-border/40 pb-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black tabular-nums leading-none">
                      {territory.compositeDpi}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug flex-1">
                    {t("territory.dpiNote")}
                  </p>
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: t("territory.metrics.touristIntensity"), value: territory.touristIntensity, weight: "35%" },
                    { label: t("territory.metrics.ecologicalSensitivity"), value: territory.ecologicalSensitivity, weight: "30%" },
                    { label: t("territory.metrics.economicLeakage"), value: territory.economicLeakageRate, weight: "20%" },
                    { label: t("territory.metrics.regenPerformance"), value: territory.regenerativePerformance, weight: "15%" },
                  ].map((m) => (
                    <div key={m.label} className="space-y-0.5">
                      <span className="text-xl font-bold tabular-nums">{m.value ?? "—"}</span>
                      <p className="text-[11px] text-muted-foreground">
                        {m.label}
                        <span className="text-muted-foreground/50 ml-1">({m.weight})</span>
                      </p>
                    </div>
                  ))}
                </div>

                {territory.dpiComputedAt && (
                  <p className="text-[11px] text-muted-foreground/60">
                    {t("territory.lastComputed", {
                      date: new Date(territory.dpiComputedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }),
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* DPS — Directional Progress (Cycle 2+) */}
          {score.dpsTotal != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t("dps.title")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-black tabular-nums">
                    {score.dpsTotal > 0 ? "+" : ""}
                    {score.dpsTotal}
                  </span>
                  {score.dpsBand && <DPSBandBadge band={score.dpsBand} />}
                </div>
                {score.dps1 != null && (
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: t("dps.metrics.rate"), value: score.dps1, range: "[-10, +10]" },
                      { label: t("dps.metrics.consistency"), value: score.dps2, range: "[0, +10]" },
                      { label: t("dps.metrics.acceleration"), value: score.dps3, range: "[0, +5]" },
                    ].map((d) => (
                      <div key={d.label} className="rounded-lg bg-muted p-3 text-center">
                        <span className="text-xl font-bold tabular-nums">
                          {d.value != null ? (d.value > 0 ? `+${d.value}` : d.value) : "—"}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">{d.label}</p>
                        <p className="text-[9px] text-muted-foreground/60">{d.range}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t("dps.range")}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Delta — Change Since Last Assessment */}
          {prev && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t("delta.title")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    [
                      { label: t("delta.metrics.gps"), current: score.gpsTotal, previous: prev.gpsScore },
                      { label: t("delta.metrics.p1"), current: score.p1Score, previous: prev.pillar1Score },
                      { label: t("delta.metrics.p2"), current: score.p2Score, previous: prev.pillar2Score },
                      { label: t("delta.metrics.p3"), current: score.p3Score, previous: prev.pillar3Score },
                    ] as const
                  ).map(({ label, current, previous }) => {
                    const diff = Math.round((current - previous) * 10) / 10;
                    const positive = diff > 0;
                    const neutral = diff === 0;
                    return (
                      <div key={label} className="rounded-lg bg-muted p-3 text-center space-y-1">
                        <span
                          className={`text-xl font-bold tabular-nums ${
                            neutral ? "text-muted-foreground" : positive ? "text-primary" : "text-destructive"
                          }`}
                        >
                          {neutral ? "±0" : positive ? `+${diff}` : `${diff}`}
                        </span>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                        <p className="text-[9px] text-muted-foreground/60">
                          {previous} → {current}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  {t("delta.comparedTo", {
                    date: new Date(prev.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }),
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <NoAssessmentState />
      )}
      </div> {/* end constrained content */}
    </div>
  );
}

function NoAssessmentState() {
  const t = useTranslations("operator.dashboard");
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-secondary mx-auto flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <p className="font-semibold text-lg">{t("noAssessment.title")}</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {t("noAssessment.description")}
        </p>
      </CardContent>
    </Card>
  );
}
