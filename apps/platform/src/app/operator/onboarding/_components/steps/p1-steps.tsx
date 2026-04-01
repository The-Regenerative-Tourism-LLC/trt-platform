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

// ── P1: Energy ────────────────────────────────────────────────────────────────

export function P1EnergyStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Energy consumption"
      subtitle="Indicator 1A · 30% of Pillar 1 · GPS impact 12%. Total energy use and renewable share for the 12-month assessment period."
    >
      {floatingGps}
      {data.operatorType === "B" ? (
        <>
          <FieldGroup
            label="Tour transport fuel type"
            hint="How do you transport guests? Select the primary fuel type."
          >
            <div className="flex gap-2 flex-wrap">
              {(["no_vehicle", "diesel", "petrol", "marine_diesel", "hybrid", "electric"] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() =>
                    updateField({ tourFuelType: data.tourFuelType === ft ? undefined : ft })
                  }
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    data.tourFuelType === ft
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  {ft === "no_vehicle" ? "No vehicle" : ft === "marine_diesel" ? "Marine diesel" : ft.charAt(0).toUpperCase() + ft.slice(1)}
                </button>
              ))}
            </div>
          </FieldGroup>
          {data.tourFuelType && data.tourFuelType !== "electric" && data.tourFuelType !== "no_vehicle" && (
            <FieldGroup label="Tour fuel (litres per month)" hint="Average monthly fuel used for guest transport.">
              <NumberInput
                value={data.tourFuelLitresPerMonth}
                onChange={(v) => updateField({ tourFuelLitresPerMonth: v })}
                placeholder="e.g. 200"
                min={0}
              />
            </FieldGroup>
          )}
          {data.tourFuelType === "electric" && (
            <FieldGroup label="EV charging (kWh per month)" hint="Electricity used for electric vehicle fleet.">
              <NumberInput
                value={data.evKwhPerMonth}
                onChange={(v) => updateField({ evKwhPerMonth: v })}
                placeholder="e.g. 500"
                min={0}
              />
            </FieldGroup>
          )}
          <FieldGroup
            label="Office / base electricity (kWh)"
            hint="Annual electricity for your office or base location, if applicable."
          >
            <NumberInput
              value={data.totalElectricityKwh}
              onChange={(v) => updateField({ totalElectricityKwh: v })}
              placeholder="e.g. 3 000"
              min={0}
            />
          </FieldGroup>
        </>
      ) : (
        <>
          <FieldGroup
            label="Total electricity (kWh)"
            hint="Sum from all electricity bills — include common areas, kitchens, EV charging."
          >
            <NumberInput
              value={data.totalElectricityKwh}
              onChange={(v) => updateField({ totalElectricityKwh: v })}
              placeholder="e.g. 45 000"
              min={0}
            />
          </FieldGroup>
          <FieldGroup
            label="Total gas / LPG / fuel oil (kWh)"
            hint="Convert: 1 kg LPG ≈ 13.9 kWh · 1 m³ natural gas ≈ 10.5 kWh · 1 L heating oil ≈ 10.7 kWh"
          >
            <NumberInput
              value={data.totalGasKwh}
              onChange={(v) => updateField({ totalGasKwh: v })}
              placeholder="e.g. 12 000"
              min={0}
            />
          </FieldGroup>
        </>
      )}
      <FieldGroup
        label="On-site renewable generation (%)"
        hint="Solar PV, wind, small hydro, or biomass generated on your property."
      >
        <NumberInput
          value={data.renewableOnsitePct}
          onChange={(v) => updateField({ renewableOnsitePct: v })}
          placeholder="e.g. 30"
          min={0}
          max={100}
        />
      </FieldGroup>
      <FieldGroup
        label="Certified renewable tariff (%)"
        hint="Green energy tariff backed by a certificate of origin (GoO or REGO)."
      >
        <NumberInput
          value={data.renewableTariffPct}
          onChange={(v) => updateField({ renewableTariffPct: v })}
          placeholder="e.g. 50"
          min={0}
          max={100}
        />
      </FieldGroup>
      {data.operatorType !== "B" && (
        <>
          <FieldGroup
            label="Tour transport fuel type"
            hint="If your operation provides guest transport — leave unselected if not applicable."
          >
            <div className="flex gap-2 flex-wrap">
              {(["diesel", "petrol", "electric"] as const).map((ft) => (
                <button
                  key={ft}
                  onClick={() =>
                    updateField({
                      tourFuelType: data.tourFuelType === ft ? undefined : ft,
                    })
                  }
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all capitalize ${
                    data.tourFuelType === ft
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-border hover:border-emerald-300"
                  }`}
                >
                  {ft}
                </button>
              ))}
            </div>
          </FieldGroup>
          {data.tourFuelType && data.tourFuelType !== "electric" && (
            <FieldGroup label="Tour fuel (litres per month)" hint="Average monthly fuel used for guest transport.">
              <NumberInput
                value={data.tourFuelLitresPerMonth}
                onChange={(v) => updateField({ tourFuelLitresPerMonth: v })}
                placeholder="e.g. 200"
                min={0}
              />
            </FieldGroup>
          )}
          {data.tourFuelType === "electric" && (
            <FieldGroup label="EV charging (kWh per month)" hint="Electricity used for electric vehicle fleet.">
              <NumberInput
                value={data.evKwhPerMonth}
                onChange={(v) => updateField({ evKwhPerMonth: v })}
                placeholder="e.g. 500"
                min={0}
              />
            </FieldGroup>
          )}
        </>
      )}

      <Tip icon="⚡">
        Energy intensity is measured in kWh per activity unit ({data.operatorType === "B" ? "visitor-day" : "guest-night"}).
        Lower intensity and higher renewable share improve your 1A sub-score.
      </Tip>

      <EvidenceTierSelector
        value={data.evidenceTierEnergy}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierEnergy: v })}
        label="Evidence quality — energy data"
      />
    </StepShell>
  );
}

// ── P1: Water & Waste ─────────────────────────────────────────────────────────

export function P1WaterWasteStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const totalDiverted =
    (data.wasteRecycledKg ?? 0) +
    (data.wasteCompostedKg ?? 0) +
    (data.wasteOtherDivertedKg ?? 0);
  const wasteWarning =
    data.totalWasteKg != null &&
    data.totalWasteKg > 0 &&
    totalDiverted > data.totalWasteKg;

  return (
    <StepShell
      {...shell}
      title="Water & waste"
      subtitle="Indicator 1B (25% of P1) and 1C (20% of P1). Water consumption, waste generation, and diversion over the 12-month period."
    >
      {floatingGps}

      {/* Water section */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Water — Indicator 1B · GPS impact 10%
        </p>
        <FieldGroup
          label="Total water consumed (litres)"
          hint="From water meter or utility bills. 1 m³ = 1 000 litres."
        >
          <NumberInput
            value={data.totalWaterLitres}
            onChange={(v) => updateField({ totalWaterLitres: v })}
            placeholder="e.g. 750 000"
            min={0}
          />
        </FieldGroup>
        <FieldGroup
          label="Water recirculation systems"
          hint="Each active system adds 3.3 points to your water sub-score."
        >
          <BandSelector
            values={[0, 1, 2, 3]}
            labels={["0 — none", "1 system", "2 systems", "3 systems"]}
            selected={data.p1RecirculationScore}
            onSelect={(v) => updateField({ p1RecirculationScore: v })}
          />
        </FieldGroup>
        <EvidenceTierSelector
          value={data.evidenceTierWater}
          onChange={(v: EvidenceTier) => updateField({ evidenceTierWater: v })}
          label="Evidence quality — water data"
        />
      </div>

      {/* Waste section */}
      <div className="space-y-4 border-t border-border/50 pt-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Waste — Indicator 1C · GPS impact 8%
        </p>
        <Tip icon="🗑️">
          Estimate annual waste from bag count × weight, container volume ×
          collections, or waste contractor invoices.
        </Tip>
        <FieldGroup
          label="Total waste generated (kg)"
          hint="From waste collection invoices or on-site weighing records."
        >
          <NumberInput
            value={data.totalWasteKg}
            onChange={(v) => updateField({ totalWasteKg: v })}
            placeholder="e.g. 5 000"
            min={0}
          />
        </FieldGroup>
        <div className="grid grid-cols-3 gap-3">
          <FieldGroup label="Recycled (kg)">
            <NumberInput
              value={data.wasteRecycledKg}
              onChange={(v) => updateField({ wasteRecycledKg: v })}
              placeholder="e.g. 2 000"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Composted (kg)">
            <NumberInput
              value={data.wasteCompostedKg}
              onChange={(v) => updateField({ wasteCompostedKg: v })}
              placeholder="e.g. 1 000"
              min={0}
            />
          </FieldGroup>
          <FieldGroup label="Other diverted (kg)" hint="Anaerobic digestion, reuse.">
            <NumberInput
              value={data.wasteOtherDivertedKg}
              onChange={(v) => updateField({ wasteOtherDivertedKg: v })}
              placeholder="e.g. 500"
              min={0}
            />
          </FieldGroup>
        </div>
        {wasteWarning && (
          <p className="text-sm text-amber-600">
            Diverted waste ({totalDiverted.toLocaleString()} kg) exceeds total waste.
          </p>
        )}

        {/* Bonus waste practices */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Bonus practices (each adds to your waste sub-score)
          </p>
          {([
            { key: "noSingleUsePlastics", label: "No single-use plastics policy" },
            { key: "foodWasteProgramme", label: "Active food waste reduction programme" },
            { key: "wasteEducation", label: "Guest waste education / signage" },
          ] as const).map((item) => (
            <label
              key={item.key}
              className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={
                  data[item.key] === true
                }
                onChange={(e) =>
                  updateField({ [item.key]: e.target.checked })
                }
                className="mt-0.5 accent-emerald-600"
              />
              <span className="text-sm">{item.label}</span>
            </label>
          ))}
        </div>

        <EvidenceTierSelector
          value={data.evidenceTierWaste}
          onChange={(v: EvidenceTier) => updateField({ evidenceTierWaste: v })}
          label="Evidence quality — waste data"
        />
      </div>
    </StepShell>
  );
}

// ── P1: Site & Carbon ─────────────────────────────────────────────────────────

export function P1SiteCarbonStep({
  data,
  updateField,
  shell,
  floatingGps,
  preview,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Site & land use"
      subtitle="Indicator 1E · 10% of Pillar 1 · GPS impact 4%. Plus carbon context and a summary of your Pillar 1 inputs."
    >
      {floatingGps}
      <FieldGroup
        label="Site & land use score"
        hint="How well does your site support ecological health and low-impact land use?"
      >
        <BandSelector
          values={[4, 3, 2, 1, 0]}
          labels={[
            "4 Pristine / regenerative",
            "3 Low-impact",
            "2 Standard",
            "1 Below average",
            "0 Fully urban / degraded",
          ]}
          selected={data.p1SiteScore}
          onSelect={(v) => updateField({ p1SiteScore: v })}
        />
      </FieldGroup>

      <div className="border-t border-border/50 pt-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-600">
          Carbon context — Indicator 1D · GPS impact 6%
        </p>
        <Tip icon="🌍">
          Scope 1 &amp; 2 emissions are auto-calculated from your energy data.
          You can optionally add Scope 3 (transport arranged by you) for context —
          it appears on your report but does not affect the 1D sub-score.
        </Tip>
        <FieldGroup
          label="Scope 3 transport emissions (kg CO₂e)"
          hint="Guest transport arranged by you (not guests' flights). Optional."
        >
          <NumberInput
            value={data.scope3TransportKgCo2e}
            onChange={(v) => updateField({ scope3TransportKgCo2e: v })}
            placeholder="e.g. 1 200"
            min={0}
          />
        </FieldGroup>
      </div>

      {/* Pillar 1 summary */}
      {preview && (
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pillar 1 — Operational Footprint Summary
          </p>
          <div className="text-2xl font-bold tabular-nums text-emerald-600">
            {Math.round(preview.pillar1Score)}
            <span className="text-sm font-normal text-muted-foreground ml-1">/ 100</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Weighted: 1A Energy 30% · 1B Water 25% · 1C Waste 20% · 1D Carbon 15% · 1E Site 10%
          </p>
        </div>
      )}

      <EvidenceTierSelector
        value={data.evidenceTierCarbon}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierCarbon: v })}
        label="Evidence quality — carbon data"
      />
    </StepShell>
  );
}
