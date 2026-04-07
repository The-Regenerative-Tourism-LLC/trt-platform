"use client";

/**
 * ARCHITECTURE: API delegation hook — no scoring logic.
 *
 * This hook calls POST /api/v1/score/preview to obtain preview scores.
 * It sends raw onboarding data to the API, which derives indicators server-side
 * and invokes the scoring engine. The hook only receives and exposes the result.
 *
 * This file must NOT import the scoring engine, snapshot builders, or MethodologyBundle.
 * It must NOT compute, approximate, or infer GPS/DPS/DPI scores locally.
 */

import { useState, useCallback, useRef } from "react";
import type { OnboardingData } from "@/lib/onboarding/onboarding-steps";
import { waterPracticesToRecirculationScore } from "@/lib/onboarding/onboarding-steps";

export interface PreviewScores {
  pillar1Score: number;
  pillar2Score: number;
  pillar3Score: number;
  gpsScore: number;
  gpsBand: string;
  methodologyVersion: string;
  referenceDpi?: boolean;
  /** Operator's geographic territory (from destination/region). */
  operatorTerritoryId?: string | null;
  /** Territory whose DPI was used for scoring (may differ from operator territory). */
  dpiTerritoryId?: string;
  p2SubScores?: { p2a: number; p2b: number; p2c: number; p2d: number };
}

export function buildPreviewPayload(data: OnboardingData) {
  return {
    operatorType: data.operatorType ?? "A",
    territoryId: data.territoryId,
    assessmentPeriodEnd: data.assessmentPeriodEnd,
    activityUnit: {
      guestNights: data.guestNights,
      visitorDays: data.visitorDays,
    },
    revenueSplit:
      data.operatorType === "C"
        ? {
            accommodationPct: data.revenueSplitAccommodationPct,
            experiencePct: data.revenueSplitExperiencePct,
          }
        : undefined,
    p1Raw: {
      operatorType: data.operatorType ?? "A",
      totalElectricityKwh: data.totalElectricityKwh,
      totalGasKwh: data.totalGasKwh,
      gridExportKwh: data.gridExportKwh,
      officeElectricityKwh: data.officeElectricityKwh,
      tourNoTransport: data.tourNoTransport,
      tourNoFixedBase: data.tourNoFixedBase,
      tourFuelType: data.tourFuelType,
      tourFuelLitresPerMonth: data.tourFuelLitresPerMonth,
      evKwhPerMonth: data.evKwhPerMonth,
      totalWaterLitres: data.totalWaterLitres,
      totalWasteKg: data.totalWasteKg,
      wasteRecycledKg: data.wasteRecycledKg,
      wasteCompostedKg: data.wasteCompostedKg,
      wasteOtherDivertedKg: data.wasteOtherDivertedKg,
      renewableOnsitePct: data.renewableOnsitePct,
      renewableTariffPct: data.renewableTariffPct,
      scope3TransportKgCo2e: data.scope3TransportKgCo2e,
      siteScore: data.p1SiteScore,
    },
    p2Raw: {
      totalFte: data.totalFte,
      localFte: data.localFte,
      permanentContractPct: data.permanentContractPct,
      averageMonthlyWage: data.averageMonthlyWage,
      minimumWage: data.minimumWage,
      seasonalOperator: data.seasonalOperator,
      totalFbSpend: data.totalFbSpend,
      localFbSpend: data.localFbSpend,
      totalNonFbSpend: data.totalNonFbSpend,
      localNonFbSpend: data.localNonFbSpend,
      totalBookingsCount: data.totalBookingsCount,
      allDirectBookings: data.allDirectBookings,
      directBookingPct: data.directBookingPct,
      localOwnershipPct: data.localEquityPct,
      communityScore: data.communityScore,
      foodServiceType: data.foodServiceType,
      tourNoFbSpend: data.tourNoFbSpend,
      tourNoNonFbSpend: data.tourNoNonFbSpend,
      soloOperator: data.soloOperator,
    },
    p3: {
      contributionCategories: data.p3ContributionCategories ?? [],
      traceability: data.p3Traceability ?? null,
      additionality: data.p3Additionality ?? null,
      continuity: data.p3Continuity ?? null,
    },
    p3Status: data.p3Status ?? "E",
    recirculationScore: waterPracticesToRecirculationScore(data),
  };
}

export function usePreviewScore(data: OnboardingData) {
  const [preview, setPreview] = useState<PreviewScores | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refreshPreview = useCallback(async () => {
    if (!data.operatorType) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch("/api/v1/score/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPreviewPayload(data)),
        signal: controller.signal,
      });
      if (res.ok) {
        const json = (await res.json()) as PreviewScores & { preview?: boolean };
        const p2Sub = (json as unknown as Record<string, unknown>).indicatorScores as { p2?: { p2a?: number; p2b?: number; p2c?: number; p2d?: number } } | undefined;
        setPreview({
          pillar1Score: json.pillar1Score,
          pillar2Score: json.pillar2Score,
          pillar3Score: json.pillar3Score,
          gpsScore: json.gpsScore,
          gpsBand: json.gpsBand,
          methodologyVersion: json.methodologyVersion,
          referenceDpi: json.referenceDpi,
          operatorTerritoryId: json.operatorTerritoryId,
          dpiTerritoryId: json.dpiTerritoryId,
          p2SubScores: p2Sub?.p2 && p2Sub.p2.p2a != null ? {
            p2a: p2Sub.p2.p2a ?? 0,
            p2b: p2Sub.p2.p2b ?? 0,
            p2c: p2Sub.p2.p2c ?? 0,
            p2d: p2Sub.p2.p2d ?? 0,
          } : undefined,
        });
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [data]);

  return { preview, loading, refreshPreview } as const;
}
