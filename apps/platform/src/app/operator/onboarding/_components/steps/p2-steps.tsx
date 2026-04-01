import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { EvidenceTier } from "@/lib/onboarding/onboarding-steps";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { StepShell } from "../shell";
import {
  FieldGroup,
  NumberInput,
  BandSelector,
  TogglePair,
  Tip,
  EvidenceTierSelector,
} from "../primitives";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
  preview?: PreviewScores | null;
}

// ── P2: Employment ────────────────────────────────────────────────────────────

export function P2EmploymentStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const localFteWarning =
    data.localFte != null && data.totalFte != null && data.localFte > data.totalFte;

  return (
    <StepShell
      {...shell}
      title="Your team"
      subtitle="Indicator 2A · 35% of Pillar 2 · GPS impact 10.5%. Staff composition, local hiring, contract types, and wages."
    >
      {floatingGps}
      <FieldGroup label="Are you a solo / owner-operator?">
        <TogglePair
          value={data.soloOperator}
          trueLabel="Yes — solo operator"
          falseLabel="No — I have staff"
          onChange={(v) => updateField({ soloOperator: v })}
        />
      </FieldGroup>

      {data.soloOperator ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-sm font-medium text-emerald-800">Solo operator</p>
          <p className="text-xs text-emerald-700 mt-1">
            Employment metrics default to 100% for solo operators. You can continue.
          </p>
        </div>
      ) : (
        <>
          <FieldGroup
            label="Total staff (FTE)"
            hint="Full-time equivalents across the 12 months. 20 hr/week = 0.5 FTE."
          >
            <NumberInput
              value={data.totalFte}
              onChange={(v) => updateField({ totalFte: v })}
              placeholder="e.g. 8"
              min={0}
              step={0.5}
            />
          </FieldGroup>
          <FieldGroup
            label="Local staff (FTE)"
            hint="Permanent residence within 30 km of your property."
          >
            <NumberInput
              value={data.localFte}
              onChange={(v) => updateField({ localFte: v })}
              placeholder="e.g. 6"
              min={0}
              step={0.5}
            />
          </FieldGroup>
          {localFteWarning && (
            <p className="text-sm text-amber-600">
              Local FTE cannot exceed total FTE.
            </p>
          )}
          <FieldGroup
            label="Permanent contract %"
            hint="Percentage of total staff on permanent or open-ended contracts."
          >
            <NumberInput
              value={data.permanentContractPct}
              onChange={(v) => updateField({ permanentContractPct: v })}
              placeholder="e.g. 75"
              min={0}
              max={100}
            />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup
              label="Average monthly wage (€/month)"
              hint="Non-managerial staff, gross."
            >
              <NumberInput
                value={data.averageMonthlyWage}
                onChange={(v) => updateField({ averageMonthlyWage: v })}
                placeholder="e.g. 1 100"
                min={0}
              />
            </FieldGroup>
            <FieldGroup
              label="Local minimum wage"
              hint="Statutory monthly minimum (e.g. Portugal 2026: €870)."
            >
              <NumberInput
                value={data.minimumWage}
                onChange={(v) => updateField({ minimumWage: v })}
                placeholder="e.g. 870"
                min={0}
              />
            </FieldGroup>
          </div>
          <Tip icon="💰">
            Wages are scored as a ratio of local minimum wage. A score of 100 is
            awarded at 2× minimum wage. Family members count as local FTE if they
            reside within 30 km.
          </Tip>
        </>
      )}

      <EvidenceTierSelector
        value={data.evidenceTierEmployment}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierEmployment: v })}
        label="Evidence quality — employment data"
      />
    </StepShell>
  );
}

// ── P2: Procurement ───────────────────────────────────────────────────────────

export function P2ProcurementStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const fbWarning =
    !data.tourNoFbSpend &&
    data.localFbSpend != null &&
    data.totalFbSpend != null &&
    data.localFbSpend > data.totalFbSpend;
  const nonFbWarning =
    !data.tourNoNonFbSpend &&
    data.localNonFbSpend != null &&
    data.totalNonFbSpend != null &&
    data.localNonFbSpend > data.totalNonFbSpend;

  return (
    <StepShell
      {...shell}
      title="Where do you buy from?"
      subtitle="Indicator 2B · 30% of Pillar 2 · GPS impact 9%. Local sourcing for food & beverage and other operational spending."
    >
      {floatingGps}
      <FieldGroup label="Do you have F&B operations?">
        <TogglePair
          value={data.tourNoFbSpend === undefined ? undefined : !data.tourNoFbSpend}
          trueLabel="Yes — we have F&B"
          falseLabel="No F&B operations"
          onChange={(v) => updateField({ tourNoFbSpend: !v })}
        />
      </FieldGroup>
      {data.tourNoFbSpend === false && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Total F&B spend (€)" hint="Annual total from accounting records.">
              <NumberInput
                value={data.totalFbSpend}
                onChange={(v) => updateField({ totalFbSpend: v })}
                placeholder="e.g. 30 000"
                min={0}
              />
            </FieldGroup>
            <FieldGroup label="Local F&B spend (€)" hint="Suppliers within 100 km.">
              <NumberInput
                value={data.localFbSpend}
                onChange={(v) => updateField({ localFbSpend: v })}
                placeholder="e.g. 18 000"
                min={0}
              />
            </FieldGroup>
          </div>
          {fbWarning && (
            <p className="text-sm text-amber-600">
              Local F&B spend cannot exceed total F&B spend.
            </p>
          )}
        </>
      )}
      <FieldGroup label="Do you have non-F&B procurement?">
        <TogglePair
          value={data.tourNoNonFbSpend === undefined ? undefined : !data.tourNoNonFbSpend}
          trueLabel="Yes — we have non-F&B"
          falseLabel="No non-F&B procurement"
          onChange={(v) => updateField({ tourNoNonFbSpend: !v })}
        />
      </FieldGroup>
      {data.tourNoNonFbSpend === false && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Total non-F&B spend (€)" hint="Cleaning, toiletries, maintenance — annual total.">
              <NumberInput
                value={data.totalNonFbSpend}
                onChange={(v) => updateField({ totalNonFbSpend: v })}
                placeholder="e.g. 15 000"
                min={0}
              />
            </FieldGroup>
            <FieldGroup label="Local non-F&B spend (€)" hint="Suppliers within 100 km.">
              <NumberInput
                value={data.localNonFbSpend}
                onChange={(v) => updateField({ localNonFbSpend: v })}
                placeholder="e.g. 8 000"
                min={0}
              />
            </FieldGroup>
          </div>
          {nonFbWarning && (
            <p className="text-sm text-amber-600">
              Local non-F&B spend cannot exceed total non-F&B spend.
            </p>
          )}
        </>
      )}

      <EvidenceTierSelector
        value={data.evidenceTierProcurement}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierProcurement: v })}
        label="Evidence quality — procurement data"
      />
    </StepShell>
  );
}

// ── P2: Revenue & Community ───────────────────────────────────────────────────

export function P2RevenueCommunityStep({
  data,
  updateField,
  shell,
  floatingGps,
  preview,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Revenue & community"
      subtitle="Indicators 2C (20% of P2 · GPS 6%) and 2D (15% of P2 · GPS 4.5%). Booking channels, local ownership, and community integration."
    >
      {floatingGps}

      {/* Revenue — 2C */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          How guests find and book you — 2C
        </p>
        <label className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors">
          <input
            type="checkbox"
            checked={data.directBookingPct === 100}
            onChange={(e) =>
              updateField({
                directBookingPct: e.target.checked ? 100 : undefined,
              })
            }
            className="mt-0.5 accent-emerald-600"
          />
          <span className="text-sm font-medium">All bookings are direct (100%)</span>
        </label>
        {data.directBookingPct !== 100 && (
          <FieldGroup
            label="Direct booking rate (%)"
            hint="Percentage of bookings via your own website, phone, or email — excluding OTA intermediaries."
          >
            <NumberInput
              value={data.directBookingPct}
              onChange={(v) => updateField({ directBookingPct: v })}
              placeholder="e.g. 55"
              min={0}
              max={100}
            />
          </FieldGroup>
        )}
        <EvidenceTierSelector
          value={data.evidenceTierRevenue}
          onChange={(v: EvidenceTier) => updateField({ evidenceTierRevenue: v })}
          label="Evidence quality — revenue data"
        />
      </div>

      {/* Community — 2D */}
      <div className="space-y-4 border-t border-border/50 pt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Community engagement — 2D
        </p>
        <FieldGroup
          label="Community integration score"
          hint="How actively is your business embedded in and contributing to local community life?"
        >
          <BandSelector
            values={[4, 3, 2, 1, 0]}
            labels={[
              "4 Deeply integrated",
              "3 Active engagement",
              "2 Moderate presence",
              "1 Minimal interaction",
              "0 No engagement",
            ]}
            selected={data.communityScore}
            onSelect={(v) => updateField({ communityScore: v })}
          />
        </FieldGroup>
        <EvidenceTierSelector
          value={data.evidenceTierCommunity}
          onChange={(v: EvidenceTier) => updateField({ evidenceTierCommunity: v })}
          label="Evidence quality — community data"
        />
      </div>

      {/* Pillar 2 summary */}
      {preview && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pillar 2 — Local Integration Summary
          </p>
          <div className="text-2xl font-bold tabular-nums text-teal-600">
            {Math.round(preview.pillar2Score)}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Weighted: 2A Employment 35% · 2B Procurement 30% · 2C Revenue 20% · 2D Community 15%
          </p>
        </div>
      )}
    </StepShell>
  );
}
