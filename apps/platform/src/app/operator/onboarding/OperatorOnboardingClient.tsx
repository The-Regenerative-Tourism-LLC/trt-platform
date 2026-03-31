"use client";

/**
 * Operator Onboarding — Client Component
 *
 * Multi-step assessment form collecting RAW onboarding data only.
 * All scoring is delegated to POST /api/v1/score/preview (during onboarding)
 * and POST /api/v1/score (final submission in review-submit step).
 *
 * Navigation: stepId-based via onboarding-steps.ts helpers.
 * Persistence: autosave via POST /api/v1/onboarding/draft after each step.
 */

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOnboardingStore, type OnboardingData } from "@/store/onboarding-store";
import {
  getVisibleSteps,
  getVisibleStepNumber,
  getStepById,
  isLastStep,
} from "@/lib/onboarding/onboarding-steps";
import {
  OPERATOR_TYPES,
  P3_CATEGORIES,
  computeCategoryScope,
  INDICATOR_LABELS,
} from "@/lib/constants";
import { usePreviewScore } from "@/hooks/usePreviewScore";
import { toast } from "sonner";
import Link from "next/link";

// ── Payload builder (score submission) ───────────────────────────────────────

function buildScorePayload(
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
    p1Raw: {
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
      recirculationScore: data.p1RecirculationScore ?? null,
      siteScore: data.p1SiteScore ?? null,
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
    pillar3: {
      categoryScope: computeCategoryScope(
        data.p3ContributionCategories ?? []
      ),
      traceability: data.p3Traceability ?? null,
      additionality: data.p3Additionality ?? null,
      continuity: data.p3Continuity ?? null,
    },
    p3Status: data.p3Status ?? "E",
    delta: data.deltaExplanation
      ? { explanation: data.deltaExplanation }
      : null,
    evidence: data.evidenceRefs ?? [],
  };
}

// ── Shared UI primitives ────────────────────────────────────────────────────

function StepShell({
  children,
  title,
  subtitle,
  progress,
  stepNumber,
  totalSteps,
  isFirst,
  onBack,
  onNext,
  onSave,
  saving,
  saved,
  isLast,
  canSubmit,
  onSubmit,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  progress: number;
  stepNumber: number;
  totalSteps: number;
  isFirst: boolean;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  saving: boolean;
  saved: boolean;
  isLast?: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="fixed top-1 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          <button
            onClick={onBack}
            disabled={isFirst}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Back
          </button>
          <span className="text-xs text-muted-foreground font-medium">
            Step {stepNumber} of {totalSteps}
          </span>
          <div className="flex items-center gap-3">
            {saved ? (
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            ) : (
              <button
                onClick={onSave}
                disabled={saving}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            )}
            <Link
              href="/operator/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </Link>
          </div>
        </div>
      </div>

      <div className="flex-1 pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t">
        <div className="flex items-center justify-end px-4 py-3 max-w-3xl mx-auto">
          {isLast ? (
            <button
              onClick={onSubmit}
              disabled={saving || !canSubmit}
              className="bg-emerald-600 text-white font-semibold px-8 py-3 rounded-xl disabled:opacity-50 hover:bg-emerald-700 transition-colors"
            >
              {saving ? "Submitting..." : "Submit Assessment"}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="bg-foreground text-background font-semibold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FieldGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) =>
        onChange(e.target.value === "" ? undefined : parseFloat(e.target.value))
      }
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className={inputCls}
    />
  );
}

function BandSelector({
  values,
  selected,
  onSelect,
}: {
  values: number[];
  selected: number | undefined;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
            selected === v
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-border hover:border-emerald-300"
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function OperatorOnboardingClient() {
  const router = useRouter();
  const {
    stepId,
    data,
    updateField,
    nextStep,
    previousStep,
    saveDraft,
    loadDraft,
    resetOnboarding,
  } = useOnboardingStore();

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { preview, loading: previewLoading, refreshPreview } = usePreviewScore(data);
  const queryClient = useQueryClient();
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);
  const [evidenceForm, setEvidenceForm] = useState({
    indicatorId: "",
    tier: "T1" as "T1" | "T2" | "T3" | "Proxy",
    fileName: "",
    storagePath: "",
    checksum: "",
  });
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const visibleSteps = getVisibleSteps(data);
  const stepNumber = getVisibleStepNumber(stepId, data);
  const totalSteps = visibleSteps.length;
  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;
  const currentStep = getStepById(stepId);
  const first = stepNumber <= 1;
  const last = isLastStep(stepId, data);

  // ── Server queries ──────────────────────────────────────────────────────

  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => fetch("/api/v1/onboarding").then((r) => r.json()),
  });

  const { data: draftData } = useQuery({
    queryKey: ["onboarding-draft"],
    queryFn: () =>
      fetch("/api/v1/onboarding/draft").then((r) => r.json()),
  });

  const { data: evidenceData } = useQuery({
    queryKey: ["operator-evidence"],
    queryFn: () =>
      fetch("/api/v1/operator/evidence").then((r) => r.json()),
    enabled: stepId === "evidence-upload",
  });

  const { data: priorScoreData, isLoading: priorLoading } = useQuery({
    queryKey: ["operator-prior-scores"],
    queryFn: () =>
      fetch("/api/v1/operator/prior-scores").then((r) => r.json()),
    enabled: stepId === "delta",
  });

  // Redirect if onboarding already completed
  useEffect(() => {
    if (onboardingData?.operator?.onboardingCompleted === true) {
      router.replace("/operator/dashboard");
    }
  }, [onboardingData, router]);

  // Hydrate from saved draft on mount; reset for new operators to clear stale localStorage
  useEffect(() => {
    if (draftData === undefined) return; // still loading
    const d = draftData?.draft;
    if (d?.updatedAt && Object.keys(d.dataJson ?? {}).length > 0) {
      loadDraft(d);
    } else {
      resetOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftData]);

  // Refresh preview on gps-preview step entry
  useEffect(() => {
    if (stepId === "gps-preview") refreshPreview();
  }, [stepId, refreshPreview]);

  // Debounced autosave on field changes (silent — no UI state update)
  useEffect(() => {
    if (!isMountedRef.current) {
      isMountedRef.current = true;
      return;
    }
    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    autosaveTimerRef.current = setTimeout(() => {
      saveDraft().catch(() => {/* best effort */});
    }, 1500);
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ── Navigation handlers ─────────────────────────────────────────────────

  const handleNext = async () => {
    const advanced = nextStep();
    if (!advanced) {
      toast.error("Please complete all required fields before continuing.");
      return;
    }
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

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveDraft();
      flashSaved();
    } catch {
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const operator = onboardingData?.operator;
      const territoryId = data.territoryId ?? operator?.territoryId;
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

      toast.success("Assessment submitted successfully!");
      resetOnboarding();
      router.push("/operator/dashboard");
    } catch (err) {
      toast.error("Failed to submit assessment");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ── Evidence inline upload ─────────────────────────────────────────────

  const latestSnapshotId = evidenceData?.latestAssessmentSnapshotId ?? null;

  const handleEvidenceFileSubmit = async () => {
    if (!latestSnapshotId || !evidenceForm.indicatorId || !evidenceForm.fileName || !evidenceForm.storagePath || !evidenceForm.checksum) {
      toast.error("Please complete all evidence fields");
      return;
    }
    setEvidenceSubmitting(true);
    try {
      const res = await fetch("/api/v1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentSnapshotId: latestSnapshotId, ...evidenceForm }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Evidence submission failed");
        return;
      }
      toast.success("Evidence file added");
      setEvidenceForm({ indicatorId: "", tier: "T1", fileName: "", storagePath: "", checksum: "" });
      queryClient.invalidateQueries({ queryKey: ["operator-evidence"] });
    } catch {
      toast.error("Failed to submit evidence");
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  // ── Shared shell props ──────────────────────────────────────────────────

  const shell = {
    progress,
    stepNumber,
    totalSteps,
    isFirst: first,
    onBack: handleBack,
    onNext: handleNext,
    onSave: handleSave,
    saving,
    saved,
  };

  // ── Step renders ────────────────────────────────────────────────────────

  if (stepId === "operator-type") {
    return (
      <StepShell {...shell} title="Operator Type" subtitle="This determines which assessment modules apply to your operation.">
        <FieldGroup label="Select your operator type">
          <div className="grid gap-3">
            {Object.entries(OPERATOR_TYPES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => updateField({ operatorType: key as "A" | "B" | "C" })}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  data.operatorType === key
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                <div className="font-semibold">{val.label}</div>
                <div className="text-sm text-muted-foreground">{val.description}</div>
              </button>
            ))}
          </div>
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "identity") {
    const territories: Array<{ id: string; name: string; country: string | null }> =
      onboardingData?.territories ?? [];
    return (
      <StepShell {...shell} title="Identity" subtitle="Legal identification and contact information.">
        <FieldGroup label="Legal Name">
          <input type="text" value={data.legalName ?? ""} onChange={(e) => updateField({ legalName: e.target.value })} className={inputCls} placeholder="Registered legal name" />
        </FieldGroup>
        <FieldGroup label="Trading Name (if different)">
          <input type="text" value={data.tradingName ?? ""} onChange={(e) => updateField({ tradingName: e.target.value })} className={inputCls} placeholder="Name known to guests" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Country">
            <input type="text" value={data.country ?? ""} onChange={(e) => updateField({ country: e.target.value })} className={inputCls} placeholder="e.g. Portugal" />
          </FieldGroup>
          <FieldGroup label="Destination / Region">
            <input type="text" value={data.destinationRegion ?? ""} onChange={(e) => updateField({ destinationRegion: e.target.value })} className={inputCls} placeholder="e.g. Madeira" />
          </FieldGroup>
        </div>
        <FieldGroup label="Territory" hint="Select the territory for DPI context.">
          <select value={data.territoryId ?? ""} onChange={(e) => updateField({ territoryId: e.target.value || undefined })} className={inputCls}>
            <option value="">— Select territory —</option>
            {territories.map((t) => (
              <option key={t.id} value={t.id}>{t.name}{t.country ? ` (${t.country})` : ""}</option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup label="Year Operations Started">
          <NumberInput value={data.yearOperationStart} onChange={(v) => updateField({ yearOperationStart: v })} placeholder="e.g. 2015" min={1900} max={new Date().getFullYear()} />
        </FieldGroup>
        <FieldGroup label="Website">
          <input type="url" value={data.website ?? ""} onChange={(e) => updateField({ website: e.target.value })} className={inputCls} placeholder="https://example.com" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Primary Contact Name">
            <input type="text" value={data.primaryContactName ?? ""} onChange={(e) => updateField({ primaryContactName: e.target.value })} className={inputCls} placeholder="Full name" />
          </FieldGroup>
          <FieldGroup label="Primary Contact Email">
            <input type="email" value={data.primaryContactEmail ?? ""} onChange={(e) => updateField({ primaryContactEmail: e.target.value })} className={inputCls} placeholder="contact@example.com" />
          </FieldGroup>
        </div>
      </StepShell>
    );
  }

  if (stepId === "accommodation") {
    return (
      <StepShell {...shell} title="Accommodation" subtitle="Property details for accommodation operators.">
        <FieldGroup label="Accommodation Category" hint="e.g. Eco-lodge, Boutique Hotel, Glamping">
          <input type="text" value={data.accommodationCategory ?? ""} onChange={(e) => updateField({ accommodationCategory: e.target.value })} className={inputCls} placeholder="e.g. Eco-lodge" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Number of Rooms">
            <NumberInput value={data.rooms} onChange={(v) => updateField({ rooms: v })} placeholder="e.g. 12" min={1} />
          </FieldGroup>
          <FieldGroup label="Bed Capacity">
            <NumberInput value={data.bedCapacity} onChange={(v) => updateField({ bedCapacity: v })} placeholder="e.g. 24" min={1} />
          </FieldGroup>
        </div>
      </StepShell>
    );
  }

  if (stepId === "experience-types") {
    return (
      <StepShell {...shell} title="Experiences" subtitle="Types of experiences or tours you offer.">
        <FieldGroup label="Experience Types" hint="Comma-separated list of activities offered.">
          <input
            type="text"
            value={data.experienceTypes?.join(", ") ?? ""}
            onChange={(e) =>
              updateField({
                experienceTypes: e.target.value
                  ? e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                  : undefined,
              })
            }
            className={inputCls}
            placeholder="e.g. Hiking, Kayaking, Wildlife"
          />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "ownership") {
    return (
      <StepShell {...shell} title="Ownership" subtitle="Ownership structure and local equity.">
        <FieldGroup label="Ownership Type" hint="e.g. Sole proprietor, Partnership, NGO, Community-owned">
          <input type="text" value={data.ownershipType ?? ""} onChange={(e) => updateField({ ownershipType: e.target.value })} className={inputCls} placeholder="e.g. Sole proprietor" />
        </FieldGroup>
        <FieldGroup label="Local Equity %" hint="Percentage of equity held by residents within 50 km.">
          <NumberInput value={data.localEquityPct} onChange={(v) => updateField({ localEquityPct: v })} placeholder="e.g. 100" min={0} max={100} />
        </FieldGroup>
        <FieldGroup label="Part of a chain or group?">
          <div className="flex items-center gap-4">
            {([
              { label: "Independent", value: false },
              { label: "Chain / Group member", value: true },
            ] as const).map(({ label, value }) => (
              <button
                key={String(value)}
                onClick={() => updateField({ isChainMember: value, chainName: value ? data.chainName : undefined })}
                className={`flex-1 rounded-xl border-2 p-3 text-sm text-left transition-all ${
                  data.isChainMember === value ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </FieldGroup>
        {data.isChainMember && (
          <FieldGroup label="Chain / Group Name">
            <input type="text" value={data.chainName ?? ""} onChange={(e) => updateField({ chainName: e.target.value })} className={inputCls} placeholder="Name of the chain or group" />
          </FieldGroup>
        )}
        <FieldGroup label="Solo / owner-operator?" hint="If yes, employment metrics default to 100%.">
          <div className="flex items-center gap-4">
            {([
              { label: "Yes — solo operator", value: true },
              { label: "No — I have staff", value: false },
            ] as const).map(({ label, value }) => (
              <button
                key={String(value)}
                onClick={() => updateField({ soloOperator: value })}
                className={`flex-1 rounded-xl border-2 p-3 text-sm text-left transition-all ${
                  data.soloOperator === value ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "activity-unit") {
    return (
      <StepShell {...shell} title="Activity Data" subtitle="Define your operational scale. This normalises intensity metrics.">
        <FieldGroup label="Assessment Period End Date" hint="The last day of the 12-month period your data covers.">
          <input type="date" value={data.assessmentPeriodEnd ?? ""} onChange={(e) => updateField({ assessmentPeriodEnd: e.target.value || undefined })} max={new Date().toISOString().slice(0, 10)} className={inputCls} />
        </FieldGroup>
        {data.operatorType !== "B" && (
          <FieldGroup label="Total Guest-Nights" hint="12-month assessment period.">
            <NumberInput value={data.guestNights} onChange={(v) => updateField({ guestNights: v })} placeholder="e.g. 5000" min={0} />
          </FieldGroup>
        )}
        {data.operatorType !== "A" && (
          <FieldGroup label="Total Visitor-Days" hint="12-month assessment period.">
            <NumberInput value={data.visitorDays} onChange={(v) => updateField({ visitorDays: v })} placeholder="e.g. 2000" min={0} />
          </FieldGroup>
        )}
        {data.operatorType === "C" && (
          <>
            <FieldGroup label="Revenue Split — Accommodation %" hint="Proportion of total revenue from accommodation.">
              <NumberInput value={data.revenueSplitAccommodationPct} onChange={(v) => updateField({ revenueSplitAccommodationPct: v })} placeholder="e.g. 60" min={0} max={100} />
            </FieldGroup>
            <FieldGroup label="Revenue Split — Experience %">
              <NumberInput value={data.revenueSplitExperiencePct} onChange={(v) => updateField({ revenueSplitExperiencePct: v })} placeholder="e.g. 40" min={0} max={100} />
            </FieldGroup>
            {data.revenueSplitAccommodationPct != null && data.revenueSplitExperiencePct != null &&
              Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct) !== 100 && (
                <p className="text-sm text-amber-600">
                  Revenue split must sum to 100% (currently {Math.round(data.revenueSplitAccommodationPct + data.revenueSplitExperiencePct)}%).
                </p>
              )}
          </>
        )}
      </StepShell>
    );
  }

  if (stepId === "p1-energy") {
    return (
      <StepShell {...shell} title="Energy" subtitle="Total energy consumption and renewable share over the 12-month assessment period.">
        <FieldGroup label="Total Electricity (kWh)" hint="Sum from all electricity bills for the 12-month period.">
          <NumberInput value={data.totalElectricityKwh} onChange={(v) => updateField({ totalElectricityKwh: v })} placeholder="e.g. 45000" min={0} />
        </FieldGroup>
        <FieldGroup label="Total Gas / LPG / Fuel Oil (kWh)" hint="Convert: 1 m³ gas ≈ 10.5 kWh · 1 L LPG ≈ 7.1 kWh · 1 L heating oil ≈ 10.7 kWh">
          <NumberInput value={data.totalGasKwh} onChange={(v) => updateField({ totalGasKwh: v })} placeholder="e.g. 12000" min={0} />
        </FieldGroup>
        <FieldGroup label="On-site Renewable (%)" hint="Solar PV, wind, hydro, biomass generated on property.">
          <NumberInput value={data.renewableOnsitePct} onChange={(v) => updateField({ renewableOnsitePct: v })} placeholder="e.g. 30" min={0} max={100} />
        </FieldGroup>
        <FieldGroup label="Certified Renewable Tariff (%)" hint="Green tariff with certificate of origin (GoO, REGO).">
          <NumberInput value={data.renewableTariffPct} onChange={(v) => updateField({ renewableTariffPct: v })} placeholder="e.g. 50" min={0} max={100} />
        </FieldGroup>
        <FieldGroup label="Tour Transport Fuel Type" hint="If your operation provides guest transport.">
          <div className="flex gap-2 flex-wrap">
            {(["diesel", "petrol", "electric"] as const).map((ft) => (
              <button
                key={ft}
                onClick={() => updateField({ tourFuelType: ft })}
                className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all capitalize ${
                  data.tourFuelType === ft ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-border hover:border-emerald-300"
                }`}
              >
                {ft}
              </button>
            ))}
          </div>
        </FieldGroup>
        {data.tourFuelType && data.tourFuelType !== "electric" && (
          <FieldGroup label="Tour Fuel (litres/month)">
            <NumberInput value={data.tourFuelLitresPerMonth} onChange={(v) => updateField({ tourFuelLitresPerMonth: v })} placeholder="e.g. 200" min={0} />
          </FieldGroup>
        )}
        {data.tourFuelType === "electric" && (
          <FieldGroup label="EV Charging (kWh/month)">
            <NumberInput value={data.evKwhPerMonth} onChange={(v) => updateField({ evKwhPerMonth: v })} placeholder="e.g. 500" min={0} />
          </FieldGroup>
        )}
      </StepShell>
    );
  }

  if (stepId === "p1-water-waste") {
    return (
      <StepShell {...shell} title="Water & Waste" subtitle="Water consumption, waste generation, and diversion data.">
        <FieldGroup label="Total Water Consumed (litres)" hint="12-month total from water meter or bills. 1 m³ = 1,000 litres.">
          <NumberInput value={data.totalWaterLitres} onChange={(v) => updateField({ totalWaterLitres: v })} placeholder="e.g. 750000" min={0} />
        </FieldGroup>
        <FieldGroup label="Water Recirculation Systems (0–3)" hint="Each active system: greywater recycling / rainwater harvesting / on-site wastewater treatment.">
          <BandSelector values={[0, 1, 2, 3]} selected={data.p1RecirculationScore} onSelect={(v) => updateField({ p1RecirculationScore: v })} />
        </FieldGroup>
        <FieldGroup label="Total Waste Generated (kg)" hint="12-month total from collection records.">
          <NumberInput value={data.totalWasteKg} onChange={(v) => updateField({ totalWasteKg: v })} placeholder="e.g. 5000" min={0} />
        </FieldGroup>
        <FieldGroup label="Waste Recycled (kg)">
          <NumberInput value={data.wasteRecycledKg} onChange={(v) => updateField({ wasteRecycledKg: v })} placeholder="e.g. 2000" min={0} />
        </FieldGroup>
        <FieldGroup label="Waste Composted (kg)">
          <NumberInput value={data.wasteCompostedKg} onChange={(v) => updateField({ wasteCompostedKg: v })} placeholder="e.g. 1000" min={0} />
        </FieldGroup>
        <FieldGroup label="Other Waste Diverted (kg)" hint="Anaerobic digestion, reuse schemes, etc.">
          <NumberInput value={data.wasteOtherDivertedKg} onChange={(v) => updateField({ wasteOtherDivertedKg: v })} placeholder="e.g. 500" min={0} />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p1-site-carbon") {
    return (
      <StepShell {...shell} title="Site & Carbon" subtitle="Site land use assessment and Scope 3 transport emissions.">
        <FieldGroup label="Site & Land Use Score (0–4)" hint="0 = degraded/high-footprint, 1 = below average, 2 = standard, 3 = low-impact, 4 = regenerative site.">
          <BandSelector values={[0, 1, 2, 3, 4]} selected={data.p1SiteScore} onSelect={(v) => updateField({ p1SiteScore: v })} />
        </FieldGroup>
        <FieldGroup label="Scope 3 Transport Emissions (kg CO₂e)" hint="Guest transport arranged by operator. Car km × 0.17 · Minibus km × 0.08 · EV km × 0.05">
          <NumberInput value={data.scope3TransportKgCo2e} onChange={(v) => updateField({ scope3TransportKgCo2e: v })} placeholder="e.g. 1200" min={0} />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p2-employment") {
    return (
      <StepShell {...shell} title="Employment" subtitle="Staff composition, local hiring, contracts, and wages.">
        {data.soloOperator ? (
          <div className="rounded-xl border bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">Solo operator — employment metrics default to 100%.</p>
          </div>
        ) : (
          <>
            <FieldGroup label="Total Staff (FTE)" hint="Full-time equivalents. Part-time: 20hr/week = 0.5 FTE.">
              <NumberInput value={data.totalFte} onChange={(v) => updateField({ totalFte: v })} placeholder="e.g. 8" min={0} step={0.5} />
            </FieldGroup>
            <FieldGroup label="Local Staff (FTE)" hint="Permanent residence within 30 km of property.">
              <NumberInput value={data.localFte} onChange={(v) => updateField({ localFte: v })} placeholder="e.g. 6" min={0} step={0.5} />
            </FieldGroup>
            <FieldGroup label="Permanent Contract %" hint="Percentage of total staff on permanent or open-ended contracts.">
              <NumberInput value={data.permanentContractPct} onChange={(v) => updateField({ permanentContractPct: v })} placeholder="e.g. 75" min={0} max={100} />
            </FieldGroup>
            <FieldGroup label="Average Monthly Wage (gross)" hint="Non-managerial staff, in local currency.">
              <NumberInput value={data.averageMonthlyWage} onChange={(v) => updateField({ averageMonthlyWage: v })} placeholder="e.g. 1100" min={0} />
            </FieldGroup>
            <FieldGroup label="Local Minimum Wage" hint="Statutory minimum monthly wage (e.g. Portugal 2026: €870).">
              <NumberInput value={data.minimumWage} onChange={(v) => updateField({ minimumWage: v })} placeholder="e.g. 870" min={0} />
            </FieldGroup>
          </>
        )}
      </StepShell>
    );
  }

  if (stepId === "p2-procurement") {
    return (
      <StepShell {...shell} title="Procurement" subtitle="Local sourcing for food & beverage and non-F&B operations.">
        <FieldGroup label="Do you have F&B operations?">
          <div className="flex gap-4">
            <button onClick={() => updateField({ tourNoFbSpend: false })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.tourNoFbSpend === false ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>Yes</button>
            <button onClick={() => updateField({ tourNoFbSpend: true })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.tourNoFbSpend === true ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>No F&B</button>
          </div>
        </FieldGroup>
        {!data.tourNoFbSpend && (
          <>
            <FieldGroup label="Total F&B Spend (EUR)" hint="12-month total from accounting records.">
              <NumberInput value={data.totalFbSpend} onChange={(v) => updateField({ totalFbSpend: v })} placeholder="e.g. 30000" min={0} />
            </FieldGroup>
            <FieldGroup label="Local F&B Spend (EUR)" hint="Suppliers within 100 km.">
              <NumberInput value={data.localFbSpend} onChange={(v) => updateField({ localFbSpend: v })} placeholder="e.g. 18000" min={0} />
            </FieldGroup>
          </>
        )}
        <FieldGroup label="Do you have non-F&B procurement?">
          <div className="flex gap-4">
            <button onClick={() => updateField({ tourNoNonFbSpend: false })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.tourNoNonFbSpend === false ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>Yes</button>
            <button onClick={() => updateField({ tourNoNonFbSpend: true })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.tourNoNonFbSpend === true ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>No non-F&B procurement</button>
          </div>
        </FieldGroup>
        {!data.tourNoNonFbSpend && (
          <>
            <FieldGroup label="Total Non-F&B Spend (EUR)" hint="Cleaning, toiletries, maintenance, linens — 12 months.">
              <NumberInput value={data.totalNonFbSpend} onChange={(v) => updateField({ totalNonFbSpend: v })} placeholder="e.g. 15000" min={0} />
            </FieldGroup>
            <FieldGroup label="Local Non-F&B Spend (EUR)" hint="Suppliers within 100 km.">
              <NumberInput value={data.localNonFbSpend} onChange={(v) => updateField({ localNonFbSpend: v })} placeholder="e.g. 8000" min={0} />
            </FieldGroup>
          </>
        )}
      </StepShell>
    );
  }

  if (stepId === "p2-revenue-community") {
    return (
      <StepShell {...shell} title="Revenue & Community" subtitle="Booking channels and community integration.">
        <FieldGroup label="Direct Booking Rate (%)" hint="Own website, phone, email — no OTA intermediary.">
          <NumberInput value={data.directBookingPct} onChange={(v) => updateField({ directBookingPct: v })} placeholder="e.g. 55" min={0} max={100} />
        </FieldGroup>
        <FieldGroup label="Community Integration Score (0–4)" hint="0 = none, 1 = minimal, 2 = present, 3 = active engagement, 4 = deep integration.">
          <BandSelector values={[0, 1, 2, 3, 4]} selected={data.communityScore} onSelect={(v) => updateField({ communityScore: v })} />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p3-status") {
    return (
      <StepShell {...shell} title="P3 Status" subtitle="Your current regenerative contribution programme status.">
        <FieldGroup label="Programme Status">
          <div className="grid gap-2">
            {([
              { id: "A", label: "Active programme with verified institutional partner" },
              { id: "B", label: "Active programme, institutional verification in progress" },
              { id: "C", label: "Internal programme (no institutional partner yet)" },
              { id: "D", label: "Forward commitment — planning to activate a programme" },
              { id: "E", label: "No programme currently" },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => updateField({ p3Status: id })}
                className={`w-full rounded-xl border-2 p-3 text-left text-sm transition-all ${
                  data.p3Status === id ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"
                }`}
              >
                <span className="font-semibold">Status {id}</span> — {label}
              </button>
            ))}
          </div>
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p3-programme") {
    return (
      <StepShell {...shell} title="Programme Details" subtitle="Details of your regenerative contribution programme.">
        <FieldGroup label="Contribution Category">
          <div className="space-y-2">
            {P3_CATEGORIES.map((cat) => (
              <label key={cat.id} className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="checkbox"
                  checked={data.p3ContributionCategories?.includes(cat.id) ?? false}
                  onChange={(e) => {
                    const current = data.p3ContributionCategories ?? [];
                    updateField({
                      p3ContributionCategories: e.target.checked
                        ? [...current, cat.id]
                        : current.filter((c) => c !== cat.id),
                    });
                  }}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm font-medium">{cat.label}</div>
                  <div className="text-xs text-muted-foreground">{cat.description}</div>
                </div>
              </label>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="Programme Description" hint="What specifically do you do? Max 300 words.">
          <textarea
            value={data.p3ProgrammeDescription ?? ""}
            onChange={(e) => updateField({ p3ProgrammeDescription: e.target.value })}
            className={inputCls + " min-h-[120px] resize-y"}
            placeholder="Describe the activity, not the intent..."
          />
        </FieldGroup>
        <FieldGroup label="Programme Duration">
          <select value={data.p3ProgrammeDuration ?? ""} onChange={(e) => updateField({ p3ProgrammeDuration: e.target.value || undefined })} className={inputCls}>
            <option value="">— Select —</option>
            <option value="<1">Less than 1 year</option>
            <option value="1-3">1–3 years</option>
            <option value=">3">More than 3 years</option>
            <option value="starting">Starting now</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Geographic Scope">
          <select value={data.p3GeographicScope ?? ""} onChange={(e) => updateField({ p3GeographicScope: e.target.value || undefined })} className={inputCls}>
            <option value="">— Select —</option>
            <option value="on-property">On-property only</option>
            <option value="local">Immediate local area (&lt; 5 km)</option>
            <option value="destination">Destination-wide</option>
            <option value="cross-destination">Cross-destination</option>
          </select>
        </FieldGroup>
        <FieldGroup label="Annual Budget (EUR)" hint="Amount or % of revenue committed.">
          <NumberInput value={data.p3AnnualBudget} onChange={(v) => updateField({ p3AnnualBudget: v })} placeholder="e.g. 5000" min={0} />
        </FieldGroup>
        <FieldGroup label="Guests Participating Per Year">
          <NumberInput value={data.p3GuestsParticipating} onChange={(v) => updateField({ p3GuestsParticipating: v })} placeholder="e.g. 200" min={0} />
        </FieldGroup>
        <FieldGroup label="Individual or Collective?">
          <div className="flex gap-4">
            <button onClick={() => updateField({ p3IsCollective: false })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.p3IsCollective === false ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>Individual</button>
            <button onClick={() => updateField({ p3IsCollective: true })} className={`flex-1 rounded-xl border-2 p-3 text-sm transition-all ${data.p3IsCollective === true ? "border-emerald-500 bg-emerald-50 font-medium" : "border-border hover:border-emerald-300"}`}>Collective</button>
          </div>
        </FieldGroup>
        {data.p3IsCollective && (
          <>
            <FieldGroup label="Collective Size">
              <select value={data.p3CollectiveSize ?? ""} onChange={(e) => updateField({ p3CollectiveSize: e.target.value || undefined })} className={inputCls}>
                <option value="">— Select —</option>
                <option value="2-4">2–4 operators</option>
                <option value="5+">5+ operators / destination-wide</option>
              </select>
            </FieldGroup>
            <FieldGroup label="Total Collective Budget (EUR)">
              <NumberInput value={data.p3CollectiveTotalBudget} onChange={(v) => updateField({ p3CollectiveTotalBudget: v })} placeholder="e.g. 12000" min={0} />
            </FieldGroup>
            <FieldGroup label="Your Share (%)">
              <NumberInput value={data.p3CollectiveSharePct} onChange={(v) => updateField({ p3CollectiveSharePct: v })} placeholder="e.g. 25" min={0} max={100} />
            </FieldGroup>
          </>
        )}
        <FieldGroup label="Administering Institution" hint="Name of the institution that validates your contribution.">
          <input type="text" value={data.p3InstitutionName ?? ""} onChange={(e) => updateField({ p3InstitutionName: e.target.value })} className={inputCls} placeholder="e.g. University of Madeira" />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p3-evidence-quality") {
    return (
      <StepShell {...shell} title="Evidence Quality" subtitle="Institutional traceability, additionality, and continuity of your programme.">
        <FieldGroup label="Institutional Traceability (0–100)" hint="0 = self-reported, 25 = NGO informal, 50 = NGO formal, 75 = academic institution, 100 = multiple institutions.">
          <BandSelector values={[0, 25, 50, 75, 100]} selected={data.p3Traceability} onSelect={(v) => updateField({ p3Traceability: v })} />
        </FieldGroup>
        <FieldGroup label="Additionality (0–100)" hint="0 = no additionality, 25 = low, 50 = moderate, 75 = high, 100 = full additionality.">
          <BandSelector values={[0, 25, 50, 75, 100]} selected={data.p3Additionality} onSelect={(v) => updateField({ p3Additionality: v })} />
        </FieldGroup>
        <FieldGroup label="Continuity & Commitment (0–100)" hint="0 = ad hoc, 25 = initial, 50 = developing, 75 = established, 100 = long-term embedded.">
          <BandSelector values={[0, 25, 50, 75, 100]} selected={data.p3Continuity} onSelect={(v) => updateField({ p3Continuity: v })} />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "p3-forward-commitment") {
    return (
      <StepShell {...shell} title="Forward Commitment" subtitle="Status D — declare your commitment to activating a regenerative contribution programme.">
        <div className="rounded-xl border bg-amber-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-amber-800">Forward Commitment Record</p>
          <p className="text-xs text-amber-700">
            P3 score will be 0 for this cycle. Your GPS will be computed from P1 and P2 only, renormalised to 0–100.
          </p>
        </div>
        <FieldGroup label="Preferred Contribution Category" hint="Which category fits your territory and operation?">
          <select value={data.forwardCommitmentPreferredCategory ?? ""} onChange={(e) => updateField({ forwardCommitmentPreferredCategory: e.target.value || undefined })} className={inputCls}>
            <option value="">— Select —</option>
            {P3_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </FieldGroup>
        <FieldGroup label="Territory Context" hint="Describe the ecological, cultural, or scientific need in your territory. Max 200 words.">
          <textarea
            value={data.forwardCommitmentTerritoryContext ?? ""}
            onChange={(e) => updateField({ forwardCommitmentTerritoryContext: e.target.value })}
            className={inputCls + " min-h-[100px] resize-y"}
            placeholder="Why does this category fit your context?"
          />
        </FieldGroup>
        <FieldGroup label="Target Activation Cycle" hint="Which assessment cycle do you commit to having a partner active?">
          <NumberInput value={data.forwardCommitmentTargetCycle} onChange={(v) => updateField({ forwardCommitmentTargetCycle: v })} placeholder="e.g. 2" min={2} />
        </FieldGroup>
        <FieldGroup label="Authorised Signatory">
          <input type="text" value={data.forwardCommitmentSignatory ?? ""} onChange={(e) => updateField({ forwardCommitmentSignatory: e.target.value })} className={inputCls} placeholder="Full name and date" />
        </FieldGroup>
      </StepShell>
    );
  }

  if (stepId === "evidence-upload") {
    const uploadedEvidence: Array<{
      id: string;
      indicatorId: string;
      tier: "T1" | "T2" | "T3" | "Proxy";
      fileName: string;
      checksum: string;
      verificationState: string;
    }> = evidenceData?.evidence ?? [];

    const selectedChecksums = new Set((data.evidenceRefs ?? []).map((r) => r.checksum));

    const toggleEvidence = (ev: (typeof uploadedEvidence)[0]) => {
      const current = data.evidenceRefs ?? [];
      if (selectedChecksums.has(ev.checksum)) {
        updateField({ evidenceRefs: current.filter((r) => r.checksum !== ev.checksum) });
      } else {
        updateField({
          evidenceRefs: [
            ...current,
            { indicatorId: ev.indicatorId, tier: ev.tier, checksum: ev.checksum, verificationState: "pending" as const },
          ],
        });
      }
    };

    return (
      <StepShell {...shell} title="Evidence Upload" subtitle="Link evidence files to this assessment. You may submit without evidence — T3 evidence must be verified before P3 score is published.">
        {uploadedEvidence.length === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
            <p className="text-sm font-medium">No evidence files linked yet</p>
            <p className="text-xs text-muted-foreground">
              Add files below or visit{" "}
              <Link href="/operator/evidence" className="text-emerald-600 underline" target="_blank">Evidence Management</Link>{" "}
              to upload and return here to link them.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {uploadedEvidence.map((ev) => {
              const selected = selectedChecksums.has(ev.checksum);
              const label = INDICATOR_LABELS[ev.indicatorId] ?? ev.indicatorId;
              return (
                <button
                  key={ev.id}
                  onClick={() => toggleEvidence(ev)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    selected ? "border-emerald-500 bg-emerald-50" : "border-border hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ev.fileName}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                        ev.tier === "T1" ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                          : ev.tier === "T2" ? "border-amber-300 text-amber-700 bg-amber-50"
                          : ev.tier === "T3" ? "border-blue-300 text-blue-700 bg-blue-50"
                          : "border-border text-muted-foreground"
                      }`}>{ev.tier}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${
                        ev.verificationState === "verified" ? "border-emerald-300 text-emerald-700" : "border-border text-muted-foreground"
                      }`}>{ev.verificationState}</span>
                    </div>
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1">
              {selectedChecksums.size} of {uploadedEvidence.length} file{uploadedEvidence.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        )}

        {/* Inline evidence file upload */}
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <p className="text-sm font-semibold">Add evidence file</p>
          {!latestSnapshotId ? (
            <p className="text-xs text-muted-foreground">
              Evidence files can be uploaded after your first assessment submission. You may also use{" "}
              <Link href="/operator/evidence" className="text-emerald-600 underline" target="_blank">Evidence Management</Link>{" "}
              to pre-register files.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FieldGroup label="Indicator">
                  <select
                    value={evidenceForm.indicatorId}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, indicatorId: e.target.value }))}
                    className={inputCls}
                  >
                    <option value="">— Select indicator —</option>
                    {Object.entries(INDICATOR_LABELS).map(([id, label]) => (
                      <option key={id} value={id}>{label}</option>
                    ))}
                  </select>
                </FieldGroup>
                <FieldGroup label="Tier">
                  <select
                    value={evidenceForm.tier}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, tier: e.target.value as "T1" | "T2" | "T3" | "Proxy" }))}
                    className={inputCls}
                  >
                    <option value="T1">T1 — Primary</option>
                    <option value="T2">T2 — Secondary</option>
                    <option value="T3">T3 — Institutional</option>
                    <option value="Proxy">Proxy</option>
                  </select>
                </FieldGroup>
              </div>
              <FieldGroup label="File name">
                <input
                  type="text"
                  value={evidenceForm.fileName}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, fileName: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. energy_bill_jan_2024.pdf"
                />
              </FieldGroup>
              <FieldGroup label="Storage path" hint="Path or URL in your document storage.">
                <input
                  type="text"
                  value={evidenceForm.storagePath}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, storagePath: e.target.value }))}
                  className={inputCls}
                  placeholder="e.g. documents/energy/bill_jan_2024.pdf"
                />
              </FieldGroup>
              <FieldGroup label="Checksum (SHA-256)" hint="File integrity hash.">
                <input
                  type="text"
                  value={evidenceForm.checksum}
                  onChange={(e) => setEvidenceForm((f) => ({ ...f, checksum: e.target.value }))}
                  className={inputCls}
                  placeholder="abc123..."
                />
              </FieldGroup>
              <button
                onClick={handleEvidenceFileSubmit}
                disabled={evidenceSubmitting}
                className="w-full rounded-lg border-2 border-emerald-500 bg-emerald-50 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
              >
                {evidenceSubmitting ? "Submitting..." : "Add evidence file"}
              </button>
            </div>
          )}
        </div>
      </StepShell>
    );
  }

  if (stepId === "delta") {
    const priorScore: {
      gpsScore: number;
      pillar1Score: number;
      pillar2Score: number;
      pillar3Score: number;
      methodologyVersion: string;
      createdAt: string;
    } | null = priorScoreData?.priorScore ?? null;

    return (
      <StepShell
        {...shell}
        title="Directional Change"
        subtitle="Compare your current performance to the prior assessment cycle."
      >
        {priorLoading ? (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Loading prior scores...</p>
          </div>
        ) : !priorScore ? (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">
              This is your first assessment cycle. Delta comparison will be available next cycle.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-semibold">Previous Assessment</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(priorScore.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-muted-foreground">Previous GPS</div>
                <div className="font-semibold tabular-nums">{Math.round(priorScore.gpsScore)}</div>

                <div className="text-muted-foreground">Previous P1 — Footprint</div>
                <div className="tabular-nums">{Math.round(priorScore.pillar1Score)}</div>

                <div className="text-muted-foreground">Previous P2 — Integration</div>
                <div className="tabular-nums">{Math.round(priorScore.pillar2Score)}</div>

                <div className="text-muted-foreground">Previous P3 — Regenerative</div>
                <div className="tabular-nums">{Math.round(priorScore.pillar3Score)}</div>

                <div className="text-muted-foreground">Methodology</div>
                <div className="font-mono text-xs">{priorScore.methodologyVersion}</div>
              </div>
            </div>

            <FieldGroup
              label="Explain major changes since last cycle"
              hint="Optional. Describe significant operational, structural, or programme changes that affected your scores."
            >
              <textarea
                value={data.deltaExplanation ?? ""}
                onChange={(e) =>
                  updateField({ deltaExplanation: e.target.value || undefined })
                }
                className={inputCls + " min-h-[120px] resize-y"}
                placeholder="e.g. Installed 40 kW solar array, reducing energy intensity by ~30%. Added two local F&B suppliers..."
              />
            </FieldGroup>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Delta Performance Score (DPS) is computed automatically by the TRT Scoring Engine from your locked Cycle 1 baseline.
              </p>
            </div>
          </div>
        )}
      </StepShell>
    );
  }

  if (stepId === "gps-preview") {
    return (
      <StepShell {...shell} title="GPS Preview" subtitle="Estimated Green Passport Score based on your current data.">
        {previewLoading || !preview ? (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Loading preview scores...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card p-6 text-center space-y-2">
              <p className="text-4xl font-bold tabular-nums">{Math.round(preview.gpsScore)}</p>
              <p className="text-sm text-muted-foreground capitalize">{preview.gpsBand?.replace(/_/g, " ") ?? "—"}</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { label: "P1 — Footprint", score: preview.pillar1Score, weight: "40%" },
                { label: "P2 — Integration", score: preview.pillar2Score, weight: "30%" },
                { label: "P3 — Regenerative", score: preview.pillar3Score, weight: "30%" },
              ] as const).map((p) => (
                <div key={p.label} className="rounded-xl border bg-card p-4 text-center space-y-1">
                  <p className="text-2xl font-bold tabular-nums">{Math.round(p.score)}</p>
                  <p className="text-xs text-muted-foreground">{p.label}</p>
                  <p className="text-xs text-muted-foreground">({p.weight})</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-xs text-muted-foreground">
                Preview scores are estimates. Final GPS is computed by the TRT Scoring Engine after submission and evidence verification. Methodology: {preview.methodologyVersion}.
              </p>
            </div>
          </div>
        )}
      </StepShell>
    );
  }

  if (stepId === "review-submit") {
    const hasP1 = data.totalElectricityKwh != null || data.totalGasKwh != null;
    const hasP2 = data.totalFte != null || data.soloOperator === true;
    const hasP3 = !!data.p3Status;
    const splitValid =
      data.operatorType !== "C" ||
      (data.revenueSplitAccommodationPct != null &&
        data.revenueSplitExperiencePct != null &&
        Math.abs(
          (data.revenueSplitAccommodationPct ?? 0) +
            (data.revenueSplitExperiencePct ?? 0) -
            100
        ) < 1);
    const dataComplete = !!(
      data.operatorType &&
      data.legalName &&
      data.country &&
      hasP1 &&
      hasP2 &&
      hasP3 &&
      splitValid
    );

    const [declarationChecked, setDeclarationChecked] = useState(false);
    const canSubmit = dataComplete && declarationChecked;

    const evidenceCount = data.evidenceRefs?.length ?? 0;

    const p3StatusLabel: Record<string, string> = {
      A: "Status A — Active, verified institutional partner",
      B: "Status B — Active, verification in progress",
      C: "Status C — Internal programme",
      D: "Status D — Forward commitment",
      E: "Status E — No programme",
    };

    return (
      <StepShell
        {...shell}
        title="Review & Submit"
        subtitle="Review your assessment before submitting."
        isLast
        canSubmit={canSubmit}
        onSubmit={handleSubmit}
      >
        <div className="space-y-4">

          {/* ── Operator summary ── */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Operator Summary</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="text-muted-foreground">Type</div>
              <div>{OPERATOR_TYPES[data.operatorType ?? "A"]?.label ?? "—"}</div>

              <div className="text-muted-foreground">Name</div>
              <div>{data.tradingName || data.legalName || "—"}</div>

              <div className="text-muted-foreground">Country</div>
              <div>{data.country ?? "—"}</div>

              <div className="text-muted-foreground">Region</div>
              <div>{data.destinationRegion ?? "—"}</div>

              {data.operatorType !== "B" && data.guestNights != null && (
                <>
                  <div className="text-muted-foreground">Guest-nights</div>
                  <div>{data.guestNights.toLocaleString()}</div>
                </>
              )}

              {data.operatorType !== "A" && data.visitorDays != null && (
                <>
                  <div className="text-muted-foreground">Visitor-days</div>
                  <div>{data.visitorDays.toLocaleString()}</div>
                </>
              )}

              <div className="text-muted-foreground">P3 Status</div>
              <div>{data.p3Status ? p3StatusLabel[data.p3Status] ?? data.p3Status : "—"}</div>

              <div className="text-muted-foreground">Evidence linked</div>
              <div>{evidenceCount > 0 ? `${evidenceCount} file${evidenceCount !== 1 ? "s" : ""}` : "None"}</div>
            </div>
          </div>

          {/* ── GPS preview ── */}
          {preview && (
            <div className="rounded-xl border bg-card p-5 space-y-3">
              <p className="text-sm font-semibold">Estimated GPS Score</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">{Math.round(preview.gpsScore)}</span>
                <span className="text-sm text-muted-foreground capitalize">{preview.gpsBand?.replace(/_/g, " ")}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                {([
                  { label: "P1 Footprint", score: preview.pillar1Score },
                  { label: "P2 Integration", score: preview.pillar2Score },
                  { label: "P3 Regenerative", score: preview.pillar3Score },
                ] as const).map((p) => (
                  <div key={p.label} className="rounded-lg border bg-muted/30 p-2 space-y-0.5">
                    <div className="text-lg font-semibold tabular-nums">{Math.round(p.score)}</div>
                    <div className="text-xs text-muted-foreground">{p.label}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimate only. Final GPS is computed by the TRT Scoring Engine after submission and evidence verification.
              </p>
            </div>
          )}

          {/* ── Readiness checklist ── */}
          <div className="rounded-xl border bg-card p-5 space-y-2">
            <p className="text-sm font-semibold">Assessment Readiness</p>
            <div className="space-y-1.5 text-sm">
              {[
                { label: "Operator profile complete", ok: !!(data.operatorType && data.legalName && data.country) },
                { label: "Pillar 1 — energy data provided", ok: hasP1 },
                { label: "Pillar 2 — employment data provided", ok: hasP2 },
                { label: "Pillar 3 — status selected", ok: hasP3 },
                { label: "Revenue split sums to 100%", ok: splitValid, skip: data.operatorType !== "C" },
                { label: "Evidence linked", ok: evidenceCount > 0, warn: true },
              ]
                .filter((c) => !("skip" in c && c.skip))
                .map((c) => (
                  <div key={c.label} className="flex items-center gap-2">
                    <span className={`text-base ${
                      c.ok
                        ? "text-emerald-600"
                        : "warn" in c && c.warn
                        ? "text-amber-500"
                        : "text-destructive"
                    }`}>
                      {c.ok ? "✓" : "warn" in c && c.warn ? "⚠" : "✗"}
                    </span>
                    <span className={
                      c.ok
                        ? ""
                        : "warn" in c && c.warn
                        ? "text-amber-700"
                        : "text-destructive"
                    }>
                      {c.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* ── Declaration ── */}
          <div className={`rounded-xl border p-4 transition-colors ${
            declarationChecked ? "border-emerald-400 bg-emerald-50" : "border-border bg-card"
          }`}>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={declarationChecked}
                onChange={(e) => setDeclarationChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
              />
              <span className="text-sm leading-relaxed">
                I confirm that the information submitted is accurate and verifiable, and I understand that
                publication depends on evidence verification.
              </span>
            </label>
          </div>

          {/* ── Submission notes ── */}
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              Your raw assessment data will be submitted to the TRT Scoring Engine.
              P1 intensities and P2 rates are derived server-side. An immutable ScoreSnapshot will be created with{" "}
              <span className="font-medium">isPublished = false</span> pending T1 evidence verification.
            </p>
          </div>

          {/* ── Blocking message ── */}
          {!dataComplete && (
            <p className="text-sm text-amber-600">
              Please complete the required steps before submitting.
            </p>
          )}
          {dataComplete && !declarationChecked && (
            <p className="text-sm text-amber-600">
              Please confirm the declaration above to enable submission.
            </p>
          )}

        </div>
      </StepShell>
    );
  }

  // Fallback for unknown step
  return (
    <StepShell {...shell} title={currentStep?.label ?? "Unknown Step"} subtitle="This step is not yet implemented.">
      <div className="rounded-xl border bg-muted/30 p-5">
        <p className="text-sm text-muted-foreground">Step &quot;{stepId}&quot; has no UI implementation yet.</p>
      </div>
    </StepShell>
  );
}
