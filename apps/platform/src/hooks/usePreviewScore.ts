"use client";

import { useState, useCallback, useRef } from "react";
import type { OnboardingData } from "@/lib/onboarding/onboarding-steps";

export interface PreviewScores {
  pillar1Score: number;
  pillar2Score: number;
  pillar3Score: number;
  gpsScore: number;
  gpsBand: string;
  methodologyVersion: string;
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
      totalFbSpend: data.totalFbSpend,
      localFbSpend: data.localFbSpend,
      totalNonFbSpend: data.totalNonFbSpend,
      localNonFbSpend: data.localNonFbSpend,
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
    recirculationScore: data.p1RecirculationScore ?? null,
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
        setPreview((await res.json()) as PreviewScores);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [data]);

  return { preview, loading, refreshPreview } as const;
}
