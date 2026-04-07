"use client";

/**
 * Operator Onboarding — Client Component (Orchestrator)
 *
 * Multi-step assessment form collecting RAW onboarding data only.
 * All scoring is delegated to POST /api/v1/score/preview (during onboarding)
 * and POST /api/v1/score (final submission in review-submit step).
 *
 * Navigation: stepId-based via onboarding-steps.ts helpers.
 * Persistence: autosave via POST /api/v1/onboarding/draft after each step.
 *
 * UI components extracted into _components/:
 *   primitives.tsx  — shared form inputs and display atoms
 *   shell.tsx       — StepShell, SectionProgress, GpsFloatingCard
 *   roadmap.tsx     — welcome / introduction screen
 *   steps/          — individual step render components
 */

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useOnboardingStore, type OnboardingData } from "@/store/onboarding-store";
import {
  getVisibleSteps,
  getVisibleStepNumber,
  getStepById,
  validateStep,
  waterPracticesToRecirculationScore,
} from "@/lib/onboarding/onboarding-steps";
import { usePreviewScore } from "@/hooks/usePreviewScore";
import { toast } from "sonner";

import { GpsFloatingCard } from "./_components/shell";
import { RoadmapScreen } from "./_components/roadmap";
import {
  OperatorTypeStep,
  IdentityStep,
  OperationActivityStep,
  PhotosStep,
} from "./_components/steps/profile-steps";
import {
  P1EnergyStep,
  P1WaterStep,
  P1WasteStep,
  P1CarbonStep,
  P1SiteStep,
} from "./_components/steps/p1-steps";
import {
  P2EmploymentStep,
  P2ProcurementStep,
  P2RevenueStep,
  P2CommunityStep,
} from "./_components/steps/p2-steps";
import {
  P3StatusStep,
  P3ProgrammeStep,
  P3ForwardCommitmentStep,
} from "./_components/steps/p3-steps";
import {
  EvidenceChecklistStep,
  DeltaStep,
} from "./_components/steps/evidence-steps";
import {
  GpsPreviewStep,
  ReviewSubmitStep,
  SubmissionSuccessScreen,
} from "./_components/steps/review-steps";
import { StepShell } from "./_components/shell";

// ── Payload builder (score submission) ───────────────────────────────────────

export function buildScorePayload(
  data: OnboardingData,
  operatorId: string,
  territoryId: string
) {
  return {
    operatorId,
    territoryId,
    assessmentPeriodEnd:
      data.assessmentPeriodEnd ?? new Date().toISOString().slice(0, 10),
    operatorType: data.operatorType ?? "A",
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
    photoRefs: data.photoRefs ?? [],
    p1Raw: {
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
      waterGreywater: data.waterGreywater,
      waterRainwater: data.waterRainwater,
      waterWastewaterTreatment: data.waterWastewaterTreatment,
      recirculationScore: waterPracticesToRecirculationScore(data),
      siteScore: data.p1SiteScore ?? null,
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
    p3Status: data.p3Status ?? "E",
    pillar3:
      data.p3Status === "A" || data.p3Status === "B" || data.p3Status === "C"
        ? {
            contributionCategories: data.p3ContributionCategories ?? [],
            traceability: data.p3Traceability ?? null,
            additionality: data.p3Additionality ?? null,
            continuity: data.p3Continuity ?? null,
          }
        : null,
    delta: data.deltaExplanation
      ? { explanation: data.deltaExplanation }
      : null,
    evidence: data.evidenceRefs ?? [],
    forwardCommitment:
      data.p3Status === "D"
        ? {
            preferredCategory: data.forwardCommitmentPreferredCategory,
            territoryContext: data.forwardCommitmentTerritoryContext,
            preferredInstitutionType: data.forwardCommitmentPreferredInstitutionType,
            targetActivationCycle: data.forwardCommitmentTargetCycle,
            authorisedSignatory: data.forwardCommitmentSignatory,
            signedAt: data.forwardCommitmentSignedAt,
          }
        : undefined,
  };
}

// ── Main component ────────────────────────────────────────────────────────────

export function OperatorOnboardingClient() {
  const router = useRouter();
  const {
    stepId,
    data,
    updateField,
    nextStep,
    previousStep,
    setStepId,
    saveDraft,
    loadDraft,
    resetOnboarding,
  } = useOnboardingStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [draftInitialized, setDraftInitialized] = useState(false);
  const [showRoadmap, setShowRoadmap] = useState(true);
  const [declarationChecked, setDeclarationChecked] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const { preview, loading: previewLoading, refreshPreview } = usePreviewScore(data);
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  // Tracks whether the draft has been loaded from the server so we never
  // autosave before the initial draft load completes (which could overwrite
  // real server data with an empty/stale local state).
  const draftInitializedRef = useRef(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const visibleSteps = getVisibleSteps(data);
  const stepNumber = getVisibleStepNumber(stepId, data);
  const totalSteps = visibleSteps.length;
  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;
  const currentStep = getStepById(stepId);
  const isFirstStep = stepNumber <= 1;
  const canNext = validateStep(stepId, data);

  // ── React Query data fetching ────────────────────────────────────────────

  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => fetch("/api/v1/onboarding").then((r) => r.json()),
  });

  const { data: draftData, isLoading: draftLoading } = useQuery({
    queryKey: ["onboarding-draft"],
    queryFn: () =>
      fetch("/api/v1/onboarding/draft").then((r) => r.json()),
  });

  const { data: priorScoreData, isLoading: priorLoading } = useQuery({
    queryKey: ["operator-prior-scores"],
    queryFn: () =>
      fetch("/api/v1/operator/prior-scores").then((r) => r.json()),
    enabled: stepId === "delta",
  });

  // ── Side-effects ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (onboardingData?.operator?.onboardingCompleted === true) {
      router.replace("/operator/dashboard");
    }
  }, [onboardingData, router]);

  useEffect(() => {
    if (draftData === undefined) return;
    const d = draftData?.draft;
    if (d?.updatedAt && Object.keys(d.dataJson ?? {}).length > 0) {
      // Server draft is the source of truth — always prefer it.
      loadDraft(d);
      setShowRoadmap(false);
    } else {
      // No server draft. Check if Zustand (localStorage) already has data from
      // a previous session that hadn't synced to the server yet. If so, keep it
      // and don't wipe it — the next autosave will push it to the server.
      // Only call resetOnboarding() when there is truly nothing anywhere.
      const hasLocalData =
        Object.keys(useOnboardingStore.getState().data ?? {}).length > 0;
      if (hasLocalData) {
        setShowRoadmap(false);
      } else {
        resetOnboarding();
      }
    }
    draftInitializedRef.current = true;
    setDraftInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftData]);

  useEffect(() => {
    if (stepId === "gps-preview" || stepId === "evidence-checklist") refreshPreview();
  }, [stepId, refreshPreview]);

  // Refresh preview when communityScore changes on the community step so the
  // 2D Community bar updates live without requiring Next navigation.
  useEffect(() => {
    if (stepId === "p2-community" && data.communityScore != null) refreshPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.communityScore]);

  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      // Guard: never autosave before the server draft has been loaded.
      // Without this, the initial loadDraft/resetOnboarding call would
      // schedule a save of whatever happened to be in state at that moment.
      if (!draftInitializedRef.current) return;
      saveDraft().catch(() => {/* best effort */});
    }, 1500);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // Save immediately when the page becomes hidden (tab switch, window minimize,
  // browser close). This catches the case where the user leaves before the
  // 1500 ms autosave debounce has fired.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && draftInitializedRef.current) {
        saveDraft().catch(() => {/* best effort */});
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [saveDraft]);

  // ── Navigation handlers ─────────────────────────────────────────────────

  const handleNext = async () => {
    if (
      stepId === "operator-type" &&
      data.operatorType === "B" &&
      !data._accomGateShown &&
      !data._confirmsNoAccommodation
    ) {
      updateField({ _accomGateShown: true });
      return;
    }

    const advanced = nextStep();
    if (!advanced) return;
    setSaving(true);
    try {
      await saveDraft();
      flashSaved();
      refreshPreview();
    } catch {
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = async () => {
    if (isFirstStep) {
      setShowRoadmap(true);
      return;
    }
    previousStep();
    setSaving(true);
    try {
      await saveDraft();
      flashSaved();
    } catch {
      /* best effort */
    } finally {
      setSaving(false);
    }
  };

  const handleSaveClose = async () => {
    try {
      await saveDraft();
    } finally {
      router.push("/operator/dashboard");
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const operator = onboardingData?.operator;
      // Resolve territoryId: onboarding state → operator record → Madeira fallback
      const madeira = territories.find((t) => t.name.toLowerCase() === "madeira");
      const territoryId = data.territoryId ?? operator?.territoryId ?? madeira?.id;
      if (!operator?.id || !territoryId) {
        toast.error("Operator profile incomplete — territory not assigned");
        return;
      }

      const res = await fetch("/api/v1/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          buildScorePayload(data, operator.id, territoryId)
        ),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Submission failed");
        return;
      }

      resetOnboarding();
      setSubmissionSuccess(true);
    } catch (err) {
      toast.error("Failed to submit assessment");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Shared props ────────────────────────────────────────────────────────

  const GPS_FLOAT_STEPS = new Set([
    "p1-waste",
    "p1-carbon",
    "p1-site",
    "p2-employment",
    "p2-procurement",
    "p2-revenue",
    "p2-community",
    "p3-status",
    "p3-programme",
    "p3-forward-commitment",
    "delta",
    "gps-preview",
    "evidence-checklist",
    "review-submit",
  ]);
  const showGpsFloat = GPS_FLOAT_STEPS.has(stepId) && preview != null;

  const shell = {
    stepId,
    progress,
    // +1 offset: roadmap is screen 01, question steps start at 02
    stepNumber: stepNumber + 1,
    totalSteps: totalSteps + 1,
    onBack: handleBack,
    onNext: handleNext,
    saving,
    saved,
    canNext,
    onSaveClose: handleSaveClose,
  };

  const floatingGps = (
    <GpsFloatingCard
      p1={preview?.pillar1Score ?? 0}
      p2={preview?.pillar2Score ?? 0}
      p3={preview?.pillar3Score ?? 0}
      gps={preview?.gpsScore ?? 0}
      visible={showGpsFloat}
    />
  );

  const stepProps = { data, updateField, shell, floatingGps };

  // ── Render ──────────────────────────────────────────────────────────────

  if (draftLoading && !draftInitialized) {
    return (
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
    );
  }

  if (submissionSuccess) {
    return <SubmissionSuccessScreen onGoToDashboard={() => router.push("/operator/dashboard")} />;
  }

  if (showRoadmap) {
    return (
      <RoadmapScreen
        onStart={() => setShowRoadmap(false)}
        data={data}
        totalSteps={totalSteps}
        onSaveClose={handleSaveClose}
      />
    );
  }

  // ── Step dispatch ─────────────────────────────────────────────────────────

  const territories: Array<{ id: string; name: string; country: string | null; compositeDpi?: number | null }> =
    onboardingData?.territories ?? [];

  switch (stepId) {
    case "operator-type":
      return <OperatorTypeStep {...stepProps} />;
    case "identity":
      return <IdentityStep {...stepProps} territories={territories} />;
    case "operation-activity":
      return <OperationActivityStep {...stepProps} />;
    case "photos":
      return <PhotosStep {...stepProps} />;
    case "p1-energy":
      return <P1EnergyStep {...stepProps} />;
    case "p1-water":
      return <P1WaterStep {...stepProps} />;
    case "p1-waste":
      return <P1WasteStep {...stepProps} />;
    case "p1-carbon":
      return <P1CarbonStep {...stepProps} />;
    case "p1-site":
      return <P1SiteStep {...stepProps} preview={preview} />;
    case "p2-employment":
      return <P2EmploymentStep {...stepProps} />;
    case "p2-procurement":
      return <P2ProcurementStep {...stepProps} />;
    case "p2-revenue":
      return <P2RevenueStep {...stepProps} />;
    case "p2-community":
      return <P2CommunityStep {...stepProps} preview={preview} />;
    case "p3-status":
      return <P3StatusStep {...stepProps} />;
    case "p3-programme":
      return <P3ProgrammeStep {...stepProps} />;
    case "p3-forward-commitment":
      return <P3ForwardCommitmentStep {...stepProps} />;
    case "evidence-checklist":
      return <EvidenceChecklistStep {...stepProps} preview={preview} previewLoading={previewLoading} />;
    case "delta":
      return (
        <DeltaStep
          {...stepProps}
          priorScore={priorScoreData?.priorScore ?? null}
          priorLoading={priorLoading}
        />
      );
    case "gps-preview":
      return (
        <GpsPreviewStep
          data={data}
          shell={shell}
          preview={preview}
          previewLoading={previewLoading}
          floatingGps={floatingGps}
          referenceDpi={preview?.referenceDpi ?? data.referenceDpi}
        />
      );
    case "review-submit":
      return (
        <ReviewSubmitStep
          data={data}
          updateField={updateField}
          shell={shell}
          preview={preview}
          declarationChecked={declarationChecked}
          onDeclarationChange={setDeclarationChecked}
          onSubmit={handleSubmit}
          onEditSection={setStepId}
          floatingGps={floatingGps}
          referenceDpi={preview?.referenceDpi ?? data.referenceDpi}
        />
      );
    default:
      return (
        <StepShell
          {...shell}
          title={currentStep?.label ?? "Unknown step"}
          subtitle="This step has not been implemented yet."
        >
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Step &quot;{stepId}&quot; is not yet available.</p>
          </div>
        </StepShell>
      );
  }
}
