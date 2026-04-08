import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { EvidenceTier } from "@/lib/onboarding/onboarding-steps";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { HelpCircle } from "lucide-react";
import { StepShell } from "../shell";
import {
  FieldGroup,
  NumberInput,
} from "../primitives";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button type="button" className="text-muted-foreground/60 hover:text-muted-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-background text-foreground border border-border shadow-md max-w-[280px] text-sm leading-relaxed py-3 px-4"
      >
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
  preview?: PreviewScores | null;
}

// ── P1: Energy ────────────────────────────────────────────────────────────────

// kWh per litre factors for each liquid fuel type
const FUEL_KWH_PER_L: Record<string, number> = {
  diesel: 10.7,
  petrol: 9.5,
  marine_diesel: 11,
  hybrid: 5.3,
};

// Shared renewable + export + live computation + evidence block used by both layouts
function EnergySharedTail({
  data,
  updateField,
  netEnergy,
  hasAnyEnergy,
  unitLabel,
  energyIntensity,
  activityUnit,
}: {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  netEnergy: number;
  hasAnyEnergy: boolean;
  unitLabel: string;
  energyIntensity: number;
  activityUnit: number;
}) {
  const onsitePct = data.renewableOnsitePct ?? 0;
  const tariffPct = data.renewableTariffPct ?? 0;
  const renewableCombined = Math.min(onsitePct + tariffPct, 100);

  return (
    <>
      {/* Renewable energy */}
      <div className="space-y-5 pt-1">
        <p className="text-sm font-semibold">Renewable energy</p>

        <div className="space-y-2">
          <label className="text-sm font-medium">% on-site renewable generation</label>
          <p className="text-xs text-muted-foreground">Solar PV, wind. If none: 0</p>
          <p className="text-sm font-semibold tabular-nums">{onsitePct}%</p>
          <input
            type="range"
            min={0}
            max={100}
            value={onsitePct}
            onChange={(e) => updateField({ renewableOnsitePct: parseInt(e.target.value) })}
            className="w-full accent-foreground"
          />
        </div>

        <div className="h-px bg-border/40" />

        <div className="space-y-2">
          <label className="text-sm font-medium">% from renewable energy tariff</label>
          <p className="text-xs text-muted-foreground">
            Green tariff certificate from energy provider. If none: 0
          </p>
          <p className="text-sm font-semibold tabular-nums">{tariffPct}%</p>
          <input
            type="range"
            min={0}
            max={100}
            value={tariffPct}
            onChange={(e) => updateField({ renewableTariffPct: parseInt(e.target.value) })}
            className="w-full accent-foreground"
          />
        </div>
      </div>

      {/* Energy exported to grid */}
      <FieldGroup
        label={
          <>
            Energy exported to the grid (annual){" "}
            <FieldTooltip text="Surplus renewable energy (solar, wind, etc.) fed back into the public grid. This reduces your net energy consumption and carbon footprint." />
          </>
        }
        hint="From your inverter or net metering bill. If none: 0"
      >
        <div className="relative">
          <input
            type="number"
            value={data.gridExportKwh ?? ""}
            onChange={(e) =>
              updateField({
                gridExportKwh: e.target.value === "" ? undefined : parseFloat(e.target.value),
              })
            }
            placeholder="e.g. 5000"
            min={0}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kWh/year
          </span>
        </div>
      </FieldGroup>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live Computation
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Net energy consumption</span>
            <span className="text-sm font-bold tabular-nums">
              {hasAnyEnergy ? Math.round(netEnergy).toLocaleString() : "0"}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">kWh/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Energy intensity</span>
            <span className="text-sm font-bold tabular-nums">
              {activityUnit > 0 && hasAnyEnergy ? Math.round(energyIntensity) : "0"}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                kWh/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Renewable %</span>
            <span className="text-sm font-bold tabular-nums">
              {onsitePct > 0 || tariffPct > 0 ? `${Math.round(renewableCombined)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">1A sub-score</span>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">What is the source of this energy data?</p>
        <select
          value={data.evidenceTierEnergy ?? ""}
          onChange={(e) =>
            updateField({ evidenceTierEnergy: (e.target.value as EvidenceTier) || undefined })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select evidence quality…</option>
          <option value="T1">T1 — Utility invoice / meter reading (×1.00)</option>
          <option value="T2">T2 — Secondary</option>
          <option value="T3">T3 — Tertiary</option>
          <option value="Proxy">Proxy</option>
        </select>
      </div>
    </>
  );
}

export function P1EnergyStep({ data, updateField, shell, floatingGps }: StepProps) {
  const exported = data.gridExportKwh ?? 0;

  // ── Type B (tours-only) layout ─────────────────────────────────────────────
  if (data.operatorType === "B") {
    const fuelType = data.tourFuelType ?? "";
    const isElectric = fuelType === "electric";
    const isNoVehicle = fuelType === "no_vehicle";

    // Annual fuel energy in kWh
    const fuelAnnualKwh = isElectric
      ? (data.evKwhPerMonth ?? 0) * 12
      : isNoVehicle
      ? 0
      : (data.tourFuelLitresPerMonth ?? 0) * (FUEL_KWH_PER_L[fuelType] ?? 0) * 12;

    const officeKwh = data.officeElectricityKwh ?? 0;
    const netEnergy = Math.max(0, fuelAnnualKwh + officeKwh - exported);
    const visitorDays = data.visitorDays ?? 0;
    const energyIntensity = visitorDays > 0 ? netEnergy / visitorDays : 0;
    const hasAnyEnergy = fuelAnnualKwh > 0 || officeKwh > 0;

    return (
      <StepShell
        {...shell}
        title="Energy consumption"
        subtitle="Indicator 1A · Weight: 30% of P1 · GPS Impact: 12%"
      >
        {floatingGps}

        {/* Fuel type */}
        <FieldGroup label="Primary transport / fuel type">
          <div className="relative">
            <select
              value={fuelType}
              onChange={(e) => updateField({ tourFuelType: e.target.value || undefined })}
              className="w-full rounded-lg border border-input bg-background px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="">Select fuel type…</option>
              <option value="no_vehicle">No vehicle — walking, cycling, or non-motorised tours</option>
              <option value="diesel">Diesel — 10.7 kWh/L</option>
              <option value="petrol">Petrol — 9.5 kWh/L</option>
              <option value="marine_diesel">Marine diesel — 11 kWh/L</option>
              <option value="hybrid">Hybrid — 5.3 kWh/L</option>
              <option value="electric">Electric — 0 direct emissions</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              ▾
            </span>
          </div>
        </FieldGroup>

        {/* Fuel consumption — hidden when no_vehicle */}
        {!isNoVehicle && fuelType && (
          <FieldGroup
            label={
              <>
                {isElectric ? "Average monthly electricity (vehicle)" : "Average monthly fuel consumption"}{" "}
                {!isElectric && <FieldTooltip text="Average over the past 12 months." />}
              </>
            }
          >
            <div className="relative">
              <input
                type="number"
                value={
                  isElectric ? (data.evKwhPerMonth ?? "") : (data.tourFuelLitresPerMonth ?? "")
                }
                onChange={(e) => {
                  const val = e.target.value === "" ? undefined : parseFloat(e.target.value);
                  if (isElectric) {
                    updateField({ evKwhPerMonth: val });
                  } else {
                    updateField({ tourFuelLitresPerMonth: val });
                  }
                }}
                placeholder="e.g. 30"
                min={0}
                className="w-full rounded-lg border border-input bg-background pl-3 pr-28 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
                {isElectric ? "kWh/month" : "litres/month"}
              </span>
            </div>
          </FieldGroup>
        )}

        {/* No fixed base toggle */}
        <label className="flex items-start gap-3 p-4 rounded-xl border border-border/60 bg-card cursor-pointer">
          <div className="relative shrink-0 mt-0.5">
            <input
              type="checkbox"
              checked={data.tourNoFixedBase === true}
              onChange={(e) => updateField({ tourNoFixedBase: e.target.checked || undefined })}
              className="sr-only peer"
            />
            <div className="w-10 h-6 rounded-full bg-muted peer-checked:bg-foreground transition-colors" />
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4" />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">
              We have no fixed office, workshop, or base of operations
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mobile operations — meet clients at trailheads, harbours, etc.
            </p>
          </div>
        </label>

        {/* Office / base electricity — hidden when no fixed base */}
        {!data.tourNoFixedBase && (
          <FieldGroup
            label="Office / base electricity"
            hint="Building consumption only — do NOT include vehicle charging"
          >
            <div className="relative">
              <input
                type="number"
                value={data.officeElectricityKwh ?? ""}
                onChange={(e) =>
                  updateField({
                    officeElectricityKwh:
                      e.target.value === "" ? undefined : parseFloat(e.target.value),
                  })
                }
                placeholder="e.g. 2000"
                min={0}
                className="w-full rounded-lg border border-input bg-background pl-3 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
                kWh/year
              </span>
            </div>
          </FieldGroup>
        )}

        <EnergySharedTail
          data={data}
          updateField={updateField}
          netEnergy={netEnergy}
          hasAnyEnergy={hasAnyEnergy}
          unitLabel="vd"
          energyIntensity={energyIntensity}
          activityUnit={visitorDays}
        />
      </StepShell>
    );
  }

  // ── Type A / C (accommodation) layout ─────────────────────────────────────
  const elec = data.totalElectricityKwh ?? 0;
  const gas = data.totalGasKwh ?? 0;
  const netEnergy = Math.max(0, elec + gas - exported);
  const guestNights = data.guestNights ?? 0;
  const energyIntensity = guestNights > 0 ? netEnergy / guestNights : 0;
  const hasAnyEnergy = data.totalElectricityKwh != null || data.totalGasKwh != null;

  return (
    <StepShell
      {...shell}
      title="Energy consumption"
      subtitle="Indicator 1A · Weight: 30% of P1 · GPS Impact: 12%"
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">🏢</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you operate multiple buildings, enter the combined annual totals across all
          buildings and meters.
        </p>
      </div>

      {/* Electricity */}
      <FieldGroup
        label={
          <>
            Total electricity consumed (annual){" "}
            <FieldTooltip text="From annual utility invoice" />
          </>
        }
      >
        <div className="relative">
          <input
            type="number"
            value={data.totalElectricityKwh ?? ""}
            onChange={(e) =>
              updateField({
                totalElectricityKwh:
                  e.target.value === "" ? undefined : parseFloat(e.target.value),
              })
            }
            placeholder="e.g. 45000"
            min={0}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kWh/year
          </span>
        </div>
      </FieldGroup>

      {/* Gas */}
      <FieldGroup
        label="Total gas / LPG consumed (annual)"
        hint="If no gas: 0. 1 kg LPG = 13.9 kWh"
      >
        <div className="relative">
          <input
            type="number"
            value={data.totalGasKwh ?? ""}
            onChange={(e) =>
              updateField({
                totalGasKwh:
                  e.target.value === "" ? undefined : parseFloat(e.target.value),
              })
            }
            placeholder="e.g. 8000"
            min={0}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kWh/year
          </span>
        </div>
      </FieldGroup>

      <EnergySharedTail
        data={data}
        updateField={updateField}
        netEnergy={netEnergy}
        hasAnyEnergy={hasAnyEnergy}
        unitLabel={data.operatorType === "C" ? "gn" : "gn"}
        energyIntensity={energyIntensity}
        activityUnit={guestNights}
      />
    </StepShell>
  );
}

// ── P1: Water ─────────────────────────────────────────────────────────────────

export function P1WaterStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const waterPractices = [
    { key: "waterGreywater" as const, label: "Greywater recycling system" },
    { key: "waterRainwater" as const, label: "Rainwater harvesting" },
    { key: "waterWastewaterTreatment" as const, label: "On-site wastewater treatment" },
  ] as const;

  const selectedCount = waterPractices.filter((p) => data[p.key] === true).length;
  const recirculationBonus = Math.min(selectedCount * 3.3, 9.9);

  const activityUnit =
    data.operatorType === "B"
      ? (data.visitorDays ?? 0)
      : (data.guestNights ?? 0);
  const waterIntensity =
    activityUnit > 0 && data.totalWaterLitres != null
      ? data.totalWaterLitres / activityUnit
      : 0;
  const unitLabel = data.operatorType === "B" ? "vd" : "gn";

  return (
    <StepShell
      {...shell}
      title="Water usage"
      subtitle="Indicator 1B · Weight: 25% of P1 · GPS Impact: 10%"
    >
      {floatingGps}

      {/* Total water */}
      <FieldGroup
        label="Total water consumed (annual)"
        hint="From water meter or utility bills. 1 m³ = 1 000 litres."
      >
        <div className="relative">
          <input
            type="number"
            value={data.totalWaterLitres ?? ""}
            onChange={(e) =>
              updateField({
                totalWaterLitres:
                  e.target.value === "" ? undefined : parseFloat(e.target.value),
              })
            }
            placeholder="e.g. 750000"
            min={0}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-24 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            litres/year
          </span>
        </div>
      </FieldGroup>

      {/* Recirculation practices */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Water recirculation practices</p>
          <p className="text-xs text-muted-foreground">
            Each practice adds +3.3 points (max +9.9). Select all that apply.
          </p>
        </div>
        {waterPractices.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <input
              type="checkbox"
              checked={data[item.key] === true}
              onChange={(e) => updateField({ [item.key]: e.target.checked })}
              className="w-4 h-4 accent-foreground shrink-0"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live Computation
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Water intensity</span>
            <span className="text-sm font-bold tabular-nums">
              {data.totalWaterLitres != null && activityUnit > 0
                ? Math.round(waterIntensity).toLocaleString()
                : "0"}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                L/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Recirculation bonus</span>
            <span className="text-sm font-bold tabular-nums">
              {selectedCount > 0 ? `+${recirculationBonus.toFixed(1)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">1B sub-score</span>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          What is the source of this water data?
        </p>
        <select
          value={data.evidenceTierWater ?? ""}
          onChange={(e) =>
            updateField({
              evidenceTierWater: (e.target.value as EvidenceTier) || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select evidence quality…</option>
          <option value="T1">T1 — Utility invoice / meter reading (×1.00)</option>
          <option value="T2">T2 — Secondary</option>
          <option value="T3">T3 — Tertiary</option>
          <option value="Proxy">Proxy</option>
        </select>
      </div>
    </StepShell>
  );
}

// ── P1: Waste ─────────────────────────────────────────────────────────────────

export function P1WasteStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const recycled = data.wasteRecycledKg ?? 0;
  const composted = data.wasteCompostedKg ?? 0;
  const otherDiverted = data.wasteOtherDivertedKg ?? 0;
  const totalDiverted = recycled + composted + otherDiverted;
  const totalWaste = data.totalWasteKg ?? 0;
  const diversionRate =
    totalWaste > 0 ? Math.min((totalDiverted / totalWaste) * 100, 100) : 0;

  const wastePractices = [
    { key: "noSingleUsePlastics" as const, label: "Single-use plastics eliminated (+5 pts)" },
    { key: "foodWasteProgramme" as const, label: "Active food waste reduction programme (+5 pts)" },
    { key: "wasteEducation" as const, label: "Guest/staff waste education (+3 pts)" },
  ] as const;

  const bonusCount = wastePractices.filter((p) => data[p.key] === true).length;

  return (
    <StepShell
      {...shell}
      title="Waste management"
      subtitle="Indicator 1C · Weight: 20% of P1 · GPS Impact: 8%"
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p>
            <strong>How to estimate your annual waste:</strong> Most operators don&apos;t weigh waste
            daily — that&apos;s OK. Use one of these standard methods:
          </p>
          <ul className="space-y-1 list-none">
            <li>
              <strong>Bag count method:</strong> Count bags per week × average bag weight (a
              standard 120L bin bag ≈ 8–12 kg) × 52 weeks.
            </li>
            <li>
              <strong>Container method:</strong> Number of bin pickups × container capacity (e.g.
              240L wheelie bin ≈ 20 kg, 1100L skip ≈ 90 kg).
            </li>
            <li>
              <strong>Invoice method:</strong> Check your waste collection invoices for tonnage or
              volume data.
            </li>
          </ul>
          <p>
            If you don&apos;t know yet, leave it empty — you can track for a week and come back to fill
            it in.
          </p>
        </div>
      </div>

      {/* Total waste produced */}
      <FieldGroup
        label="Total waste produced in the last 12 months (kg)"
        hint="All waste streams combined: general, recyclable, organic, hazardous"
      >
        <NumberInput
          value={data.totalWasteKg}
          onChange={(v) => updateField({ totalWasteKg: v })}
          placeholder="e.g. 12,000"
          min={0}
          unit="kg/year"
        />
      </FieldGroup>
      {totalWaste > 0 && (
        <p className="text-sm text-muted-foreground bg-muted/50 border border-border/50 rounded-xl px-4 py-3 leading-relaxed">
          Break down your {totalWaste.toLocaleString()} kg into the categories below. What&apos;s left ({Math.max(0, totalWaste - totalDiverted).toLocaleString()} kg) is assumed to go to landfill.
        </p>
      )}

      {/* Recycled */}
      <FieldGroup
        label="Recycled (kg)"
        hint="Paper, plastic, glass, metal sent to recycling. Check with your waste collector for recycling tonnage."
      >
        <NumberInput
          value={data.wasteRecycledKg}
          onChange={(v) => updateField({ wasteRecycledKg: v })}
          placeholder="e.g. 3,000"
          min={0}
          unit="kg/year"
        />
      </FieldGroup>

      {/* Composted */}
      <FieldGroup
        label="Composted (kg)"
        hint="Food scraps, garden waste composted on or off site."
      >
        <NumberInput
          value={data.wasteCompostedKg}
          onChange={(v) => updateField({ wasteCompostedKg: v })}
          placeholder="e.g. 1,500"
          min={0}
          unit="kg/year"
        />
      </FieldGroup>

      {/* Other diversion */}
      <FieldGroup
        label="Other diversion (kg)"
        hint="Donated, repurposed, or any other waste kept from landfill (textiles, electronics, construction debris)."
      >
        <NumberInput
          value={data.wasteOtherDivertedKg}
          onChange={(v) => updateField({ wasteOtherDivertedKg: v })}
          placeholder="e.g. 500"
          min={0}
          unit="kg/year"
        />
      </FieldGroup>
      {totalWaste > 0 && (
        <div className="bg-muted/50 border border-border/50 rounded-xl px-4 py-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sent to landfill</span>
            <span className="font-medium">{Math.max(0, totalWaste - totalDiverted).toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Diversion rate</span>
            <span className="font-bold">{diversionRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Bonus practices */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Bonus practices (max +13 pts)</p>
        </div>
        {wastePractices.map((item) => (
          <label
            key={item.key}
            className="flex items-center gap-3 p-4 border border-border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
          >
            <input
              type="checkbox"
              checked={data[item.key] === true}
              onChange={(e) => updateField({ [item.key]: e.target.checked })}
              className="w-4 h-4 accent-foreground shrink-0"
            />
            <span className="text-sm font-medium">{item.label}</span>
          </label>
        ))}
      </div>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live computation
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Waste diversion rate</span>
            <span className="text-sm font-bold tabular-nums">
              {totalWaste > 0 && totalDiverted > 0
                ? `${Math.round(diversionRate)}%`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Bonus points</span>
            <span className="text-sm font-bold tabular-nums">
              {bonusCount > 0 ? `+${bonusCount}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">1C sub-score</span>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">
          What is the source of this data?
        </p>
        <select
          value={data.evidenceTierWaste ?? ""}
          onChange={(e) =>
            updateField({
              evidenceTierWaste: (e.target.value as EvidenceTier) || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select evidence quality…</option>
          <option value="T1">T1 — Utility invoice / meter reading (×1.00)</option>
          <option value="T2">T2 — Secondary (×0.75)</option>
          <option value="T3">T3 — Tertiary</option>
          <option value="Proxy">Proxy</option>
        </select>
      </div>
    </StepShell>
  );
}

// ── P1: Carbon ────────────────────────────────────────────────────────────────

const GRID_FACTOR_KG_CO2E = 0.149; // kg CO₂e/kWh (Portugal, IEA 2023)
const GAS_FACTOR_KG_CO2E = 0.202;  // kg CO₂e/kWh (natural gas)

export function P1CarbonStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const netElectricityKwh = Math.max(
    0,
    (data.totalElectricityKwh ?? 0) - (data.gridExportKwh ?? 0)
  );
  const tariffFactor = 1 - Math.min((data.renewableTariffPct ?? 0) / 100, 1);

  const scope1KgCo2 = (data.totalGasKwh ?? 0) * GAS_FACTOR_KG_CO2E;
  const scope2KgCo2 = netElectricityKwh * GRID_FACTOR_KG_CO2E * tariffFactor;
  const scope3KgCo2 = data.scope3TransportKgCo2e ?? 0;
  const totalKgCo2 = scope1KgCo2 + scope2KgCo2 + scope3KgCo2;

  const activityUnit =
    data.operatorType === "B"
      ? (data.visitorDays ?? 0)
      : (data.guestNights ?? 0);
  const unitLabel = data.operatorType === "B" ? "vd" : "gn";
  const carbonIntensity = activityUnit > 0 ? totalKgCo2 / activityUnit : 0;

  return (
    <StepShell
      {...shell}
      title="Carbon emissions"
      subtitle="Indicator 1D · Weight: 15% of P1 · GPS Impact: 6%"
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">☁️</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We auto-calculate your carbon emissions from the energy data you already provided. No
          extra input needed for Scope 1 &amp; 2.
        </p>
      </div>

      {/* Auto-calculated emission figures */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Auto-calculated emission figures</p>
        <p className="text-xs text-muted-foreground font-mono">
          Grid emission factor: 0.149 kgCO₂/kWh (Portugal, IEA 2023)
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Scope 1 — Direct (gas, fuel combustion)
            </span>
            <span className="text-sm font-bold tabular-nums whitespace-nowrap ml-4">
              {Math.round(scope1KgCo2).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">kgCO₂/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">
              Scope 2 — Electricity (kWh × grid factor × (1 − green tariff %))
            </span>
            <span className="text-sm font-bold tabular-nums whitespace-nowrap ml-4">
              {Math.round(scope2KgCo2).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">kgCO₂/year</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scope 3 input */}
      <FieldGroup
        label="Scope 3 — Other indirect emissions (kgCO₂)"
        hint="Optional. Includes refrigerant leakage, business travel, waste transport, and guest commuting. Leave blank if you haven't measured this yet — it won't affect your score negatively."
      >
        <div className="relative">
          <input
            type="number"
            value={data.scope3TransportKgCo2e ?? ""}
            onChange={(e) =>
              updateField({
                scope3TransportKgCo2e:
                  e.target.value === "" ? undefined : parseFloat(e.target.value),
              })
            }
            placeholder="e.g. 1,200"
            min={0}
            className="w-full rounded-lg border border-input bg-background pl-3 pr-28 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kgCO₂/year
          </span>
        </div>
      </FieldGroup>

      {/* Scope 3 explanation box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <div className="text-sm text-muted-foreground leading-relaxed space-y-2">
          <p className="font-semibold text-foreground">How is Scope 3 used?</p>
          <p>
            Scope 3 is <strong>not included </strong>in your Carbon Intensity (1D) score — only
            Scope 1 &amp; 2 count. This field is collected for transparency and future reporting.
            If you don&apos;t have this data, simply leave it blank.
          </p>
          <p>If you do track it, common sources include:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Guest transport to/from your property</li>
            <li>Refrigerant gas leakage (HVAC systems)</li>
            <li>Staff commuting &amp; business travel</li>
            <li>Waste collection &amp; disposal transport</li>
          </ul>
        </div>
      </div>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Live computation
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Total emissions</span>
            <span className="text-sm font-bold tabular-nums">
              {Math.round(totalKgCo2).toLocaleString()}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">kgCO₂/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">Carbon intensity</span>
            <span className="text-sm font-bold tabular-nums">
              {activityUnit > 0 ? carbonIntensity.toFixed(2) : "0"}
              <span className="text-xs font-normal text-muted-foreground ml-1.5">
                kgCO₂/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-muted-foreground">1D sub-score</span>
            <span className="text-sm font-bold tabular-nums text-muted-foreground">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-muted-foreground">What is the source of this data?</p>
        <select
          value={data.evidenceTierCarbon ?? ""}
          onChange={(e) =>
            updateField({
              evidenceTierCarbon: (e.target.value as EvidenceTier) || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select evidence quality…</option>
          <option value="T1">T1 — Utility invoice / meter reading (×1.00)</option>
          <option value="T2">T2 — Secondary (×0.75)</option>
          <option value="T3">T3 — Tertiary</option>
          <option value="Proxy">Proxy</option>
        </select>
      </div>
    </StepShell>
  );
}

// ── P1: Site & land use ───────────────────────────────────────────────────────

const SITE_OPTIONS: { label: string; score: number }[] = [
  { label: "Pristine natural — remote, minimal human impact", score: 100 },
  { label: "Low-impact natural — mostly natural with limited infrastructure", score: 75 },
  { label: "Mixed — blend of natural and developed areas", score: 50 },
  { label: "Mostly developed — predominantly urban or built-up", score: 25 },
  { label: "Fully urban — entirely developed, no natural surroundings", score: 0 },
];

export function P1SiteStep({
  data,
  updateField,
  shell,
  floatingGps,
  preview,
}: StepProps) {
  // 1E: selected option index stored in p1SiteScore (0–4 where 0=pristine, 4=urban)
  // Convert to display score: option 0→100, 1→75, 2→50, 3→25, 4→0
  const selectedIdx = data.p1SiteScore ?? null;
  const site1E = selectedIdx !== null ? SITE_OPTIONS[selectedIdx]?.score ?? 0 : 0;
  const p1Total = preview?.pillar1Score ?? 0;
  const gpsContribution = p1Total * 0.40;

  const indicators: { key: string; label: string; score: number; weight: number }[] = [
    { key: "1A", label: "1A Energy", score: 0, weight: 30 },
    { key: "1B", label: "1B Water",  score: 0, weight: 25 },
    { key: "1C", label: "1C Waste",  score: 0, weight: 20 },
    { key: "1D", label: "1D Carbon", score: 0, weight: 15 },
    { key: "1E", label: "1E Site",   score: site1E, weight: 10 },
  ];

  // Back-fill 1A–1D from p1Total when preview arrives.
  // We only know the weighted sum; individual scores are not exposed by PreviewScores.
  // 1E we compute locally; derive the remaining contribution for display.
  const site1EContribution = site1E * 0.10;
  const remainingP1 = Math.max(0, p1Total - site1EContribution);

  // Distribute remaining score proportionally to weights 30/25/20/15 = 90
  const weights = [30, 25, 20, 15];
  const totalOtherWeight = 90;
  const derivedScores =
    preview != null
      ? weights.map((w) => Math.min(100, Math.round((remainingP1 * w) / totalOtherWeight)))
      : [0, 0, 0, 0];

  const displayIndicators = indicators.map((ind, i) =>
    i < 4 ? { ...ind, score: derivedScores[i] ?? 0 } : ind
  );

  return (
    <StepShell
      {...shell}
      title="Site & land use"
      subtitle="Indicator 1E · Weight: 10% of P1 · GPS Impact: 4%"
    >
      {floatingGps}

      {/* Environment dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          How would you describe the natural environment surrounding your operation?
        </label>
        <select
          value={selectedIdx ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            updateField({ p1SiteScore: val === "" ? undefined : parseInt(val) });
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Select</option>
          {SITE_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pillar 1 summary card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">Pillar 1: Operational Footprint (40% of GPS)</p>
          <p className="text-xs text-muted-foreground font-mono">
            P1 = p1a×0.30 + p1b×0.25 + p1c×0.20 + p1d×0.15 + p1e×0.10
          </p>
        </div>

        <div className="space-y-3">
          {displayIndicators.map((ind) => {
            const contribution = (ind.score * ind.weight) / 100;
            return (
              <div key={ind.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{ind.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {preview != null || ind.key === "1E"
                      ? `${ind.score}/100 · ${ind.weight}% = ${contribution % 1 === 0 ? contribution : contribution.toFixed(1)}`
                      : `—/100 · ${ind.weight}% = —`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-foreground transition-all duration-300"
                    style={{ width: `${ind.score}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-2 border-t border-border/40 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold">Footprint score</span>
            <span className="text-sm font-bold tabular-nums">
              {p1Total % 1 === 0 ? p1Total : p1Total.toFixed(1)}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">GPS contribution (P1 × 0.40)</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {gpsContribution % 1 === 0 ? gpsContribution : gpsContribution.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </StepShell>
  );
}
