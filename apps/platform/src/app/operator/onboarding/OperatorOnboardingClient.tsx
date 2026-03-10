"use client";

/**
 * Operator Onboarding — Client Component
 *
 * Multi-step assessment form for Green Passport scoring.
 *
 * Architecture compliance:
 * - This component ONLY collects form data and displays UI state
 * - Score computation is NEVER performed here
 * - On "Submit Assessment", data is posted to POST /api/v1/score
 * - The API route delegates to the scoring orchestrator
 * - The orchestrator invokes the TRT Scoring Engine
 * - The result (ScoreSnapshot) is persisted before being returned
 * - Onboarding progress is saved incrementally via POST /api/v1/onboarding
 *
 * Zustand store holds local UI state only.
 * TanStack Query manages server state.
 */

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useOnboardingStore } from "@/store/onboarding-store";
import { OPERATOR_TYPES, P3_CATEGORIES } from "@/lib/constants";
import { normalizeValue, normalizeDiscreteScore } from "@/lib/engine/trt-scoring-engine";
import { DEFAULT_METHODOLOGY_BUNDLE } from "@/lib/methodology/default-bundle";
import { toast } from "sonner";
import Link from "next/link";

const nb = DEFAULT_METHODOLOGY_BUNDLE.normalizationBounds;
const nbTours = DEFAULT_METHODOLOGY_BUNDLE.normalizationBoundsTours!;

const TOTAL_STEPS = 8; // 0=Profile, 1=Activity, 2=P1, 3=P2, 4=P3, 5=Evidence, 6=Delta, 7=Review

// ── Shared UI primitives ────────────────────────────────────────────────────

function StepShell({
  children,
  title,
  subtitle,
  progress,
  step,
  onBack,
  onNext,
  onSave,
  saving,
  isLast,
  canSubmit,
  onSubmit,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  progress: number;
  step: number;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
  saving: boolean;
  isLast?: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Top bar */}
      <div className="fixed top-1 left-0 right-0 z-40 bg-background/90 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3 max-w-3xl mx-auto">
          {step > 0 ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div className="w-14" />
          )}
          <span className="text-xs text-muted-foreground font-medium">
            Step {step + 1} of {TOTAL_STEPS}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <Link
              href="/operator/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              ✕
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-16 pb-24 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          <div className="space-y-6">{children}</div>
        </div>
      </div>

      {/* Bottom bar */}
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

function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
}: {
  value: number | undefined;
  onChange: (v: number | null) => void;
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
        onChange(e.target.value === "" ? null : parseFloat(e.target.value))
      }
      placeholder={placeholder}
      min={min}
      max={max}
      step={step}
      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
    />
  );
}

function ScorePreview({
  label,
  rawValue,
  bounds,
}: {
  label: string;
  rawValue: number | undefined;
  bounds: (typeof nb)[keyof typeof nb];
}) {
  if (rawValue == null) return null;
  const score = normalizeValue(rawValue, bounds);
  const pct = score;
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tabular-nums font-medium">{score}/100</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function OperatorOnboardingClient() {
  const router = useRouter();
  const { step, data, setStep, updateData, resetOnboarding } = useOnboardingStore();
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  // Load existing operator data
  const { data: onboardingData } = useQuery({
    queryKey: ["onboarding"],
    queryFn: () => fetch("/api/v1/onboarding").then((r) => r.json()),
  });

  // Infer normalisation bounds based on operator type
  const isTypeB = data.operatorType === "B";
  const bounds = isTypeB ? nbTours : nb;

  const saveProgress = async () => {
    setSaving(true);
    try {
      await fetch("/api/v1/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data }),
      });
      toast.success("Progress saved");
    } catch {
      toast.error("Failed to save progress");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const operator = onboardingData?.operator;
      if (!operator?.id || !operator?.territoryId) {
        toast.error("Operator profile incomplete");
        return;
      }

      const res = await fetch("/api/v1/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: operator.id,
          territoryId: operator.territoryId,
          assessmentPeriodEnd: new Date().toISOString().slice(0, 10),
          operatorType: data.operatorType ?? "A",
          activityUnit: {
            guestNights: data.guestNights,
            visitorDays: data.visitorDays,
          },
          revenueSplit: {
            accommodationPct: data.revenueSplitAccommodationPct,
            experiencePct: data.revenueSplitExperiencePct,
          },
          pillar1: {
            energyIntensity: data.p1EnergyIntensity ?? null,
            renewablePct: data.p1RenewablePct ?? null,
            waterIntensity: data.p1WaterIntensity ?? null,
            recirculationScore: data.p1RecirculationScore ?? null,
            wasteDiversionPct: data.p1WasteDiversionPct ?? null,
            carbonIntensity: data.p1CarbonIntensity ?? null,
            siteScore: data.p1SiteScore ?? null,
          },
          pillar2: {
            localEmploymentRate: data.p2LocalEmploymentRate ?? null,
            employmentQuality: data.p2EmploymentQuality ?? null,
            localFbRate: data.p2LocalFbRate ?? null,
            localNonfbRate: data.p2LocalNonfbRate ?? null,
            directBookingRate: data.p2DirectBookingRate ?? null,
            localOwnershipPct: data.p2LocalOwnershipPct ?? null,
            communityScore: data.p2CommunityScore ?? null,
          },
          pillar3: {
            categoryScope: data.p3CategoryScope ?? null,
            traceability: data.p3Traceability ?? null,
            additionality: data.p3Additionality ?? null,
            continuity: data.p3Continuity ?? null,
          },
          p3Status: data.p3Status ?? "E",
          delta: null, // Cycle 1 — no delta
          evidence: data.evidenceRefs ?? [],
        }),
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
      setSubmitting(false);
    }
  };

  const goNext = () => setStep(Math.min(step + 1, TOTAL_STEPS - 1));
  const goBack = () => setStep(Math.max(step - 1, 0));

  // ── Step renders ─────────────────────────────────────────────────────────

  // Step 0: Operator Profile
  if (step === 0) {
    return (
      <StepShell
        title="Operator Profile"
        subtitle="Tell us about your operation. This determines your scoring methodology."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        <FieldGroup label="Operator Type" hint="This determines which assessment modules apply.">
          <div className="grid gap-3">
            {Object.entries(OPERATOR_TYPES).map(([key, val]) => (
              <button
                key={key}
                onClick={() => updateData({ operatorType: key as "A" | "B" | "C" })}
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

        <FieldGroup label="Legal Name">
          <input
            type="text"
            value={data.legalName ?? ""}
            onChange={(e) => updateData({ legalName: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Registered legal name"
          />
        </FieldGroup>

        <FieldGroup label="Trading Name (if different)">
          <input
            type="text"
            value={data.tradingName ?? ""}
            onChange={(e) => updateData({ tradingName: e.target.value })}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Name known to guests"
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Country">
            <input
              type="text"
              value={data.country ?? ""}
              onChange={(e) => updateData({ country: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Portugal"
            />
          </FieldGroup>
          <FieldGroup label="Destination / Region">
            <input
              type="text"
              value={data.destinationRegion ?? ""}
              onChange={(e) => updateData({ destinationRegion: e.target.value })}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="e.g. Madeira"
            />
          </FieldGroup>
        </div>
      </StepShell>
    );
  }

  // Step 1: Activity Units (Section 0 data)
  if (step === 1) {
    return (
      <StepShell
        title="Activity Unit"
        subtitle="Define your operational scale. This normalises your environmental intensity metrics."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        {data.operatorType !== "B" && (
          <FieldGroup label="Total Guest-Nights" hint="12-month assessment period. Used to normalise P1 intensity metrics.">
            <NumberInput
              value={data.guestNights}
              onChange={(v) => updateData({ guestNights: v ?? undefined })}
              placeholder="e.g. 5000"
              min={0}
            />
          </FieldGroup>
        )}
        {data.operatorType !== "A" && (
          <FieldGroup label="Total Visitor-Days" hint="12-month assessment period.">
            <NumberInput
              value={data.visitorDays}
              onChange={(v) => updateData({ visitorDays: v ?? undefined })}
              placeholder="e.g. 2000"
              min={0}
            />
          </FieldGroup>
        )}
        {data.operatorType === "C" && (
          <>
            <FieldGroup label="Revenue Split — Accommodation %" hint="Proportion of total revenue from accommodation.">
              <NumberInput
                value={data.revenueSplitAccommodationPct}
                onChange={(v) => updateData({ revenueSplitAccommodationPct: v ?? undefined })}
                placeholder="e.g. 60"
                min={0}
                max={100}
              />
            </FieldGroup>
            <FieldGroup label="Revenue Split — Experience %">
              <NumberInput
                value={data.revenueSplitExperiencePct}
                onChange={(v) => updateData({ revenueSplitExperiencePct: v ?? undefined })}
                placeholder="e.g. 40"
                min={0}
                max={100}
              />
            </FieldGroup>
          </>
        )}
      </StepShell>
    );
  }

  // Step 2: Pillar 1 — Operational Footprint
  if (step === 2) {
    return (
      <StepShell
        title="Pillar 1: Operational Footprint"
        subtitle="Energy, water, waste, carbon, and site management. Intensity metrics are normalised per activity unit."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        <FieldGroup
          label="1A: Energy Intensity (kWh per activity unit)"
          hint="Total electricity + fuel consumption divided by guest-nights or visitor-days."
        >
          <NumberInput
            value={data.p1EnergyIntensity}
            onChange={(v) => updateData({ p1EnergyIntensity: v ?? undefined })}
            placeholder={isTypeB ? "e.g. 8" : "e.g. 25"}
            min={0}
            step={0.1}
          />
          <ScorePreview
            label="Energy intensity score"
            rawValue={data.p1EnergyIntensity}
            bounds={bounds["p1_energy_intensity"]}
          />
        </FieldGroup>

        <FieldGroup
          label="1A: Renewable Energy (%)"
          hint="Percentage of total electricity from renewable sources (on-site or certified green tariff)."
        >
          <NumberInput
            value={data.p1RenewablePct}
            onChange={(v) => updateData({ p1RenewablePct: v ?? undefined })}
            placeholder="e.g. 75"
            min={0}
            max={100}
          />
          <ScorePreview
            label="Renewable score"
            rawValue={data.p1RenewablePct}
            bounds={bounds["p1_renewable_pct"]}
          />
        </FieldGroup>

        <FieldGroup
          label="1B: Water Intensity (L per activity unit)"
          hint="Total water consumption divided by activity units."
        >
          <NumberInput
            value={data.p1WaterIntensity}
            onChange={(v) => updateData({ p1WaterIntensity: v ?? undefined })}
            placeholder={isTypeB ? "e.g. 3" : "e.g. 150"}
            min={0}
            step={0.1}
          />
          <ScorePreview
            label="Water intensity score"
            rawValue={data.p1WaterIntensity}
            bounds={bounds["p1_water_intensity"]}
          />
        </FieldGroup>

        <FieldGroup
          label="1B: Water Recirculation / Grey Water (0–3)"
          hint="0 = none, 1 = basic collection, 2 = grey water reuse, 3 = closed-loop system."
        >
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((v) => (
              <button
                key={v}
                onClick={() => updateData({ p1RecirculationScore: v })}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.p1RecirculationScore === v
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </FieldGroup>

        <FieldGroup
          label="1C: Waste Diversion Rate (%)"
          hint="Percentage of total waste diverted from landfill (recycling, composting, reuse)."
        >
          <NumberInput
            value={data.p1WasteDiversionPct}
            onChange={(v) => updateData({ p1WasteDiversionPct: v ?? undefined })}
            placeholder="e.g. 60"
            min={0}
            max={100}
          />
          <ScorePreview
            label="Waste diversion score"
            rawValue={data.p1WasteDiversionPct}
            bounds={bounds["p1_waste_diversion_pct"]}
          />
        </FieldGroup>

        <FieldGroup
          label="1D: Carbon Intensity (kg CO₂e per activity unit)"
          hint="Total Scope 1 + 2 emissions divided by activity units."
        >
          <NumberInput
            value={data.p1CarbonIntensity}
            onChange={(v) => updateData({ p1CarbonIntensity: v ?? undefined })}
            placeholder={isTypeB ? "e.g. 5" : "e.g. 15"}
            min={0}
            step={0.1}
          />
          <ScorePreview
            label="Carbon intensity score"
            rawValue={data.p1CarbonIntensity}
            bounds={bounds["p1_carbon_intensity"]}
          />
        </FieldGroup>

        <FieldGroup
          label="1E: Site & Land Use Score (0–4)"
          hint="0 = conventional site, 1 = some native species, 2 = significant habitat, 3 = certified, 4 = active restoration."
        >
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => updateData({ p1SiteScore: v })}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.p1SiteScore === v
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </FieldGroup>
      </StepShell>
    );
  }

  // Step 3: Pillar 2 — Local Integration
  if (step === 3) {
    return (
      <StepShell
        title="Pillar 2: Local Integration"
        subtitle="Employment, procurement, revenue retention, and community engagement."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        <FieldGroup
          label="2A: Local Employment Rate (%)"
          hint="Percentage of permanent FTE roles held by people from the local community."
        >
          <NumberInput
            value={data.p2LocalEmploymentRate}
            onChange={(v) => updateData({ p2LocalEmploymentRate: v ?? undefined })}
            placeholder="e.g. 60"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2A: Employment Quality Score (0–100)"
          hint="Assessment of contracts, wages, training, and progression. Use provided rubric."
        >
          <NumberInput
            value={data.p2EmploymentQuality}
            onChange={(v) => updateData({ p2EmploymentQuality: v ?? undefined })}
            placeholder="e.g. 70"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2B: Local F&B Procurement Rate (%)"
          hint="Percentage of food and beverage expenditure spent with local suppliers."
        >
          <NumberInput
            value={data.p2LocalFbRate}
            onChange={(v) => updateData({ p2LocalFbRate: v ?? undefined })}
            placeholder="e.g. 55"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2B: Local Non-F&B Procurement Rate (%)"
          hint="Percentage of non-food goods/services expenditure spent with local suppliers."
        >
          <NumberInput
            value={data.p2LocalNonfbRate}
            onChange={(v) => updateData({ p2LocalNonfbRate: v ?? undefined })}
            placeholder="e.g. 45"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2C: Direct Booking Rate (%)"
          hint="Percentage of bookings received directly (not via OTAs)."
        >
          <NumberInput
            value={data.p2DirectBookingRate}
            onChange={(v) => updateData({ p2DirectBookingRate: v ?? undefined })}
            placeholder="e.g. 55"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2C: Local Ownership (%)"
          hint="Percentage of equity held by local/regional owners."
        >
          <NumberInput
            value={data.p2LocalOwnershipPct}
            onChange={(v) => updateData({ p2LocalOwnershipPct: v ?? undefined })}
            placeholder="e.g. 80"
            min={0}
            max={100}
          />
        </FieldGroup>

        <FieldGroup
          label="2D: Community Integration Score (0–4)"
          hint="0 = none, 1 = occasional, 2 = regular, 3 = structured programme, 4 = co-governance."
        >
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((v) => (
              <button
                key={v}
                onClick={() => updateData({ p2CommunityScore: v })}
                className={`flex-1 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                  data.p2CommunityScore === v
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </FieldGroup>
      </StepShell>
    );
  }

  // Step 4: Pillar 3 — Regenerative Contribution
  if (step === 4) {
    return (
      <StepShell
        title="Pillar 3: Regenerative Contribution"
        subtitle="Your contribution to ecological and cultural regeneration through institutional partnerships."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        <FieldGroup label="3A: Programme Status">
          <div className="grid gap-2">
            {[
              { id: "A", label: "Active programme with verified institutional partner" },
              { id: "B", label: "Active programme, institutional verification in progress" },
              { id: "C", label: "Internal programme (no institutional partner yet)" },
              { id: "D", label: "Forward commitment — planning to activate a programme" },
              { id: "E", label: "Not applicable for this operator type" },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => updateData({ p3Status: id as "A" | "B" | "C" | "D" | "E" })}
                className={`w-full rounded-xl border-2 p-3 text-left text-sm transition-all ${
                  data.p3Status === id
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-border hover:border-emerald-300"
                }`}
              >
                <span className="font-semibold">Status {id}</span> — {label}
              </button>
            ))}
          </div>
        </FieldGroup>

        {data.p3Status && !["D", "E"].includes(data.p3Status) && (
          <>
            <FieldGroup label="3A: Programme Category">
              <div className="space-y-2">
                {P3_CATEGORIES.map((cat) => (
                  <label key={cat.id} className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
                    <input
                      type="radio"
                      name="p3category"
                      value={cat.id}
                      checked={data.p3ContributionCategories?.includes(cat.id)}
                      onChange={() => updateData({ p3ContributionCategories: [cat.id] })}
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

            <FieldGroup
              label="3B: Institutional Traceability Score"
              hint="Based on verification tier of your institutional partner."
            >
              <div className="flex gap-2 flex-wrap">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => updateData({ p3Traceability: v })}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      data.p3Traceability === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup
              label="3C: Additionality Score"
              hint="Evidence that your contribution exceeds business-as-usual."
            >
              <div className="flex gap-2 flex-wrap">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => updateData({ p3Additionality: v })}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      data.p3Additionality === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </FieldGroup>

            <FieldGroup
              label="3D: Continuity & Commitment Score"
              hint="Duration and contractual commitment of the programme."
            >
              <div className="flex gap-2 flex-wrap">
                {[0, 25, 50, 75, 100].map((v) => (
                  <button
                    key={v}
                    onClick={() => updateData({ p3Continuity: v })}
                    className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      data.p3Continuity === v
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-border hover:border-emerald-300"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </FieldGroup>
          </>
        )}

        {data.p3Status === "D" && (
          <div className="rounded-xl border bg-amber-50 p-4 space-y-2">
            <p className="text-sm font-semibold text-amber-800">Forward Commitment</p>
            <p className="text-xs text-amber-700">
              You have selected Status D. A Forward Commitment Record will be created.
              P3 score will be 0 for this cycle. Your GPS will be based on P1 and P2 only.
            </p>
          </div>
        )}
      </StepShell>
    );
  }

  // Step 5: Evidence
  if (step === 5) {
    return (
      <StepShell
        title="Evidence & Documentation"
        subtitle="Evidence is verified separately. Submit references now and upload files in the Evidence section."
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        <div className="rounded-xl border bg-muted/30 p-5 space-y-3">
          <p className="text-sm font-medium">Evidence Tiers</p>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              { tier: "T1", desc: "Required on submission — utility bills, invoices, certifications" },
              { tier: "T2", desc: "Required within 60 days — secondary verification documents" },
              { tier: "T3", desc: "Required for P3 score — institutional contribution records" },
              { tier: "Proxy", desc: "Accepted for small operators — proxy calculations with correction factor" },
            ].map((t) => (
              <div key={t.tier} className="flex gap-2">
                <span className="font-mono font-semibold w-8 shrink-0">{t.tier}</span>
                <span>{t.desc}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          You can upload evidence files in the{" "}
          <Link href="/operator/evidence" className="text-emerald-600 underline">
            Evidence Management
          </Link>{" "}
          section after submitting your assessment.
        </p>
      </StepShell>
    );
  }

  // Step 6: Delta (Cycle 2+ only — skip on Cycle 1)
  if (step === 6) {
    const cycleCount = onboardingData?.operator?.assessmentCycleCount ?? 0;
    return (
      <StepShell
        title="Section 4: Directional Change"
        subtitle={
          cycleCount === 0
            ? "This is your baseline assessment. DPS will be computed from Cycle 2 onwards."
            : "Compare your current performance to the prior cycle."
        }
        progress={progress}
        step={step}
        onBack={goBack}
        onNext={goNext}
        onSave={saveProgress}
        saving={saving}
      >
        {cycleCount === 0 ? (
          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">
              As your first assessment (Cycle 1), your DPS = 0 by definition.
              Baseline scores will be locked from this submission to enable
              future directional comparison.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Delta computation will be performed automatically from your locked
            baseline scores. The TRT Scoring Engine computes DPS-1, DPS-2, and
            DPS-3 from the submitted data.
          </p>
        )}
      </StepShell>
    );
  }

  // Step 7: Review & Submit
  return (
    <StepShell
      title="Review & Submit"
      subtitle="Review your assessment before submitting. Scores will be computed by the TRT Scoring Engine."
      progress={progress}
      step={step}
      onBack={goBack}
      onNext={goNext}
      onSave={saveProgress}
      saving={submitting}
      isLast
      canSubmit={!!(data.operatorType && data.legalName && data.country)}
      onSubmit={handleSubmit}
    >
      <div className="space-y-4">
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">Operator Profile</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Type</div>
            <div>{OPERATOR_TYPES[data.operatorType ?? "A"]?.label ?? "—"}</div>
            <div className="text-muted-foreground">Name</div>
            <div>{data.tradingName || data.legalName || "—"}</div>
            <div className="text-muted-foreground">Location</div>
            <div>{data.destinationRegion ? `${data.destinationRegion}, ${data.country}` : "—"}</div>
          </div>
        </div>

        <div className="rounded-xl border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">
            Your assessment data will be submitted to the TRT Scoring Engine.
            Scores are computed deterministically and an immutable ScoreSnapshot
            will be created. The engine uses the current MethodologyBundle v1.0.0.
          </p>
        </div>

        {!(data.operatorType && data.legalName && data.country) && (
          <p className="text-sm text-amber-600">
            Please complete at least Step 0 (Operator Profile) before submitting.
          </p>
        )}
      </div>
    </StepShell>
  );
}
