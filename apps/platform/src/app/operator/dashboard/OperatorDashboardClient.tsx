"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  QrCode,
  FileText,
  ArrowRight,
  ExternalLink,
  TrendingUp,
  Leaf,
  Globe,
  Zap,
} from "lucide-react";
import {
  GPSCircle,
  GPSBandBadge,
  DPSBandBadge,
  PressureBadge,
  PillarBar,
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
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["operator-dashboard"],
    queryFn: fetchDashboard,
    enabled: !!user,
  });

  // Redirect operators who have never completed an assessment to onboarding.
  // assessmentCycleCount === 0 means no ScoreSnapshot has ever been produced
  // for this operator. The dashboard has no meaningful content to show.
  // This runs on the client after the API response — it cannot run in middleware
  // because that would require a DB query on every matched request.
  const operator = data?.operator;
  useEffect(() => {
    if (!isLoading && !authLoading && operator !== undefined) {
      if (operator === null || operator.assessmentCycleCount === 0) {
        router.replace("/operator/onboarding");
      }
    }
  }, [operator, isLoading, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!operator || operator.assessmentCycleCount === 0) {
    // Show spinner while redirect is in progress
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const score = operator.latestScore;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {operator.tradingName || operator.legalName}
          </h1>
          <p className="text-muted-foreground mt-1">
            {operator.destinationRegion}
            {operator.country ? `, ${operator.country}` : ""}
            {operator.operatorType && (
              <Badge variant="outline" className="ml-2 text-xs">
                Type {operator.operatorType}
              </Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" asChild>
            <Link href="/operator/evidence">
              <FileText className="h-4 w-4 mr-1" />
              Evidence
            </Link>
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild>
            <Link href="/operator/onboarding">
              {(operator.assessmentCycleCount ?? 0) > 0
                ? "New Assessment"
                : "Continue Assessment"}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>
      </div>

      {/* QR Code card */}
      {operator.operatorCode && (
        <Card>
          <CardContent className="flex items-center gap-4 py-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <QrCode className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">Operator Code</p>
              <p className="text-2xl font-mono font-bold tracking-widest mt-0.5">
                {operator.operatorCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Display at reception — travelers scan to check in and earn impact credits
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {score ? (
        <>
          {/* GPS Score + Pillars */}
          <div className="grid md:grid-cols-5 gap-5">
            {/* Score card */}
            <Card className="md:col-span-2">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-8">
                <GPSCircle score={score.gpsTotal} band={score.gpsBand} size={152} />
                <GPSBandBadge band={score.gpsBand} />
                {score.dpsBand && <DPSBandBadge band={score.dpsBand} />}
                <Badge
                  variant={score.isPublished ? "default" : "secondary"}
                  className={
                    score.isPublished
                      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                      : "bg-amber-100 text-amber-700 border-amber-200"
                  }
                >
                  {score.isPublished ? "Published" : "Pending verification"}
                </Badge>
                {score.publicationBlockedReason && (
                  <p className="text-xs text-muted-foreground text-center px-4">
                    {score.publicationBlockedReason}
                  </p>
                )}
                {score.isPublished && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/operators/${operator.id}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View Public Passport
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Pillar breakdown */}
            <Card className="md:col-span-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
                  Impact Pillars
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <PillarBar
                  label="P1 Operational Footprint"
                  score={score.p1Score}
                  weight={0.4}
                  colorClass="bg-emerald-500"
                />
                <PillarBar
                  label="P2 Local Integration"
                  score={score.p2Score}
                  weight={0.3}
                  colorClass="bg-amber-500"
                />
                <PillarBar
                  label="P3 Regenerative Contribution"
                  score={score.p3Score}
                  weight={0.3}
                  colorClass="bg-teal-500"
                />
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Weighted Total</span>
                  <span className="tabular-nums font-bold">
                    {Math.round(
                      score.p1Score * 0.4 +
                        score.p2Score * 0.3 +
                        score.p3Score * 0.3
                    )}
                    /100
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* DPS — Directional Progress */}
          {score.dpsTotal != null && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Directional Progress Score
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
                      { label: "DPS-1 Rate of Improvement", value: score.dps1, range: "[-10, +10]" },
                      { label: "DPS-2 Consistency", value: score.dps2, range: "[0, +10]" },
                      { label: "DPS-3 P3 Acceleration", value: score.dps3, range: "[0, +5]" },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="rounded-xl bg-muted p-3 text-center"
                      >
                        <span className="text-xl font-bold tabular-nums">
                          {d.value != null
                            ? d.value > 0
                              ? `+${d.value}`
                              : d.value
                            : "—"}
                        </span>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {d.label}
                        </p>
                        <p className="text-[9px] text-muted-foreground/60">
                          {d.range}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Rewards direction of travel — not just current position. Range: -10 to +25.
                </p>
              </CardContent>
            </Card>
          )}

          {/* DPI — Destination Context */}
          {operator.territory?.compositeDpi != null && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Destination Pressure Index — {operator.territory.name}
                  </CardTitle>
                  {operator.territory.pressureLevel && (
                    <PressureBadge level={operator.territory.pressureLevel} />
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-4xl font-black tabular-nums">
                    {operator.territory.compositeDpi}
                  </span>
                  <p className="text-sm text-muted-foreground flex-1">
                    Choosing a high-GPS operator in a high-pressure destination
                    is the highest-impact booking choice a traveler can make.
                  </p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                      <span className="text-lg font-bold tabular-nums">
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
                    Last computed{" "}
                    {new Date(operator.territory.dpiComputedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid sm:grid-cols-3 gap-4">
            <QuickActionCard
              icon={<FileText className="h-5 w-5" />}
              title="Evidence"
              description="Submit and track supporting evidence for your indicators"
              href="/operator/evidence"
            />
            <QuickActionCard
              icon={<Leaf className="h-5 w-5" />}
              title="Assessment"
              description="Start or continue your operator assessment"
              href="/operator/onboarding"
            />
            <QuickActionCard
              icon={<Zap className="h-5 w-5" />}
              title="Public Profile"
              description="View your Green Passport as travelers see it"
              href={score.isPublished ? `/operators/${operator.id}` : "#"}
              disabled={!score.isPublished}
            />
          </div>
        </>
      ) : (
        <NoAssessmentState />
      )}
    </div>
  );
}

function NoAssessmentState() {
  return (
    <Card>
      <CardContent className="py-12 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-emerald-50 mx-auto flex items-center justify-center">
          <Zap className="w-8 h-8 text-emerald-600" />
        </div>
        <p className="font-semibold text-lg">No assessment completed yet</p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Complete your onboarding assessment to receive your Green Passport Score,
          pillar breakdown, and directional progress.
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/operator/onboarding">
            Start Assessment
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  href,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  disabled?: boolean;
}) {
  const content = (
    <Card className={`transition-shadow ${disabled ? "opacity-50" : "hover:shadow-md cursor-pointer"}`}>
      <CardContent className="py-5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
          {icon}
        </div>
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (disabled) return content;

  return <Link href={href}>{content}</Link>;
}
