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
import { useTranslations } from "next-intl";

type EnergyTranslations = (key: string) => string;

function FieldTooltip({ text }: { text: string }) {
  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <button type="button" className="text-black/60 hover:text-black transition-colors">
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
  t,
}: {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  netEnergy: number;
  hasAnyEnergy: boolean;
  unitLabel: string;
  energyIntensity: number;
  activityUnit: number;
  t: EnergyTranslations;
}) {
  const onsitePct = data.renewableOnsitePct ?? 0;
  const tariffPct = data.renewableTariffPct ?? 0;
  const renewableCombined = Math.min(onsitePct + tariffPct, 100);

  return (
    <>
      {/* Renewable energy */}
      <div className="space-y-5 pt-1">
        <p className="text-sm font-semibold">{t("renewableSection")}</p>

        <div className="space-y-2">
          <label className="text-sm font-medium">{t("onsiteRenewable")}</label>
          <p className="text-xs text-black">{t("onsiteRenewableDesc")}</p>
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
          <label className="text-sm font-medium">{t("tariffRenewable")}</label>
          <p className="text-xs text-black">
            {t("tariffRenewableDesc")}
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
            {t("gridExport")}{" "}
            <FieldTooltip text={t("gridExportTooltip")} />
          </>
        }
        hint={t("gridExportHint")}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kWh/year
          </span>
        </div>
      </FieldGroup>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black">
          {t("liveComputation")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("netConsumption")}</span>
            <span className="text-sm font-bold tabular-nums">
              {hasAnyEnergy ? Math.round(netEnergy).toLocaleString() : "0"}
              <span className="text-xs font-normal text-black ml-1.5">kWh/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("energyIntensity")}</span>
            <span className="text-sm font-bold tabular-nums">
              {activityUnit > 0 && hasAnyEnergy ? Math.round(energyIntensity) : "0"}
              <span className="text-xs font-normal text-black ml-1.5">
                kWh/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("renewablePct")}</span>
            <span className="text-sm font-bold tabular-nums">
              {onsitePct > 0 || tariffPct > 0 ? `${Math.round(renewableCombined)}%` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("subScore1A")}</span>
            <span className="text-sm font-bold tabular-nums text-black">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-black">{t("evidenceSource")}</p>
        <select
          value={data.evidenceTierEnergy ?? ""}
          onChange={(e) =>
            updateField({ evidenceTierEnergy: (e.target.value as EvidenceTier) || undefined })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("selectEvidenceQuality")}</option>
          <option value="T1">{t("evidenceT1")}</option>
          <option value="T2">{t("evidenceT2")}</option>
          <option value="T3">{t("evidenceT3")}</option>
          <option value="Proxy">{t("evidenceProxy")}</option>
        </select>
      </div>
    </>
  );
}

export function P1EnergyStep({ data, updateField, shell, floatingGps }: StepProps) {
  const t = useTranslations("onboarding.p1.energy");
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
        title={t("stepTitle")}
        subtitle={t("stepSubtitle")}
      >
        {floatingGps}

        {/* Fuel type */}
        <FieldGroup label={t("primaryFuelType")}>
          <div className="relative">
            <select
              value={fuelType}
              onChange={(e) => updateField({ tourFuelType: e.target.value || undefined })}
              className="w-full rounded-lg border border-input bg-background px-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
            >
              <option value="">{t("selectFuelType")}</option>
              <option value="no_vehicle">{t("noVehicle")}</option>
              <option value="diesel">{t("diesel")}</option>
              <option value="petrol">{t("petrol")}</option>
              <option value="marine_diesel">{t("marineDiesel")}</option>
              <option value="hybrid">{t("hybrid")}</option>
              <option value="electric">{t("electric")}</option>
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-black">
              ▾
            </span>
          </div>
        </FieldGroup>

        {/* Fuel consumption — hidden when no_vehicle */}
        {!isNoVehicle && fuelType && (
          <FieldGroup
            label={
              <>
                {isElectric ? t("monthlyElectricVehicle") : t("monthlyFuelConsumption")}{" "}
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
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
              {t("noFixedBase")}
            </p>
            <p className="text-xs text-black mt-0.5">
              {t("noFixedBaseDesc")}
            </p>
          </div>
        </label>

        {/* Office / base electricity — hidden when no fixed base */}
        {!data.tourNoFixedBase && (
          <FieldGroup
            label={t("officeElectricity")}
            hint={t("officeElectricityHint")}
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
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
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
          t={t}
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
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">🏢</span>
        <p className="text-sm text-black leading-relaxed">
          {t("multipleBuildings")}
        </p>
      </div>

      {/* Electricity */}
      <FieldGroup
        label={
          <>
            {t("totalElectricity")}{" "}
            <FieldTooltip text={t("totalElectricityTooltip")} />
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kWh/year
          </span>
        </div>
      </FieldGroup>

      {/* Gas */}
      <FieldGroup
        label={t("totalGas")}
        hint={t("totalGasHint")}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
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
          t={t}
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
  const t = useTranslations("onboarding.p1.water");
  const waterPractices = [
    { key: "waterGreywater" as const, label: t("greywaterLabel") },
    { key: "waterRainwater" as const, label: t("rainwaterLabel") },
    { key: "waterWastewaterTreatment" as const, label: t("wastewaterLabel") },
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
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Total water */}
      <FieldGroup
        label={t("totalWater")}
        hint={t("totalWaterHint")}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            litres/year
          </span>
        </div>
      </FieldGroup>

      {/* Recirculation practices */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{t("recirculationTitle")}</p>
          <p className="text-xs text-black">
            {t("recirculationDesc")}
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
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black">
          {t("liveComputation")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("waterIntensity")}</span>
            <span className="text-sm font-bold tabular-nums">
              {data.totalWaterLitres != null && activityUnit > 0
                ? Math.round(waterIntensity).toLocaleString()
                : "0"}
              <span className="text-xs font-normal text-black ml-1.5">
                L/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("recirculationBonus")}</span>
            <span className="text-sm font-bold tabular-nums">
              {selectedCount > 0 ? `+${recirculationBonus.toFixed(1)}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("subScore1B")}</span>
            <span className="text-sm font-bold tabular-nums text-black">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-black">
          {t("evidenceSource")}
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
          <option value="">{t("selectEvidenceQuality")}</option>
          <option value="T1">{t("evidenceT1")}</option>
          <option value="T2">{t("evidenceT2")}</option>
          <option value="T3">{t("evidenceT3")}</option>
          <option value="Proxy">{t("evidenceProxy")}</option>
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
  const t = useTranslations("onboarding.p1.waste");
  const recycled = data.wasteRecycledKg ?? 0;
  const composted = data.wasteCompostedKg ?? 0;
  const otherDiverted = data.wasteOtherDivertedKg ?? 0;
  const totalDiverted = recycled + composted + otherDiverted;
  const totalWaste = data.totalWasteKg ?? 0;
  const diversionRate =
    totalWaste > 0 ? Math.min((totalDiverted / totalWaste) * 100, 100) : 0;

  const wastePractices = [
    { key: "noSingleUsePlastics" as const, label: t("noSingleUsePlastics") },
    { key: "foodWasteProgramme" as const, label: t("foodWasteProgramme") },
    { key: "wasteEducation" as const, label: t("wasteEducation") },
  ] as const;

  const bonusCount = wastePractices.filter((p) => data[p.key] === true).length;

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <div className="text-sm text-black leading-relaxed space-y-2">
          <p>
            <strong>{t("estimationTitle")}</strong> {t("estimationBody")}
          </p>
          <ul className="space-y-1 list-none">
            <li>
              <strong>{t("bagCountMethod")}</strong> {t("bagCountDesc")}
            </li>
            <li>
              <strong>{t("containerMethod")}</strong> {t("containerDesc")}
            </li>
            <li>
              <strong>{t("invoiceMethod")}</strong> {t("invoiceDesc")}
            </li>
          </ul>
          <p>
            {t("estimationNote")}
          </p>
        </div>
      </div>

      {/* Total waste produced */}
      <FieldGroup
        label={t("totalWaste")}
        hint={t("totalWasteHint")}
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
        <p className="text-sm text-black bg-muted/50 border border-border/50 rounded-xl px-4 py-3 leading-relaxed">
          {t("breakdownIntro", {
            total: totalWaste.toLocaleString(),
            remaining: Math.max(0, totalWaste - totalDiverted).toLocaleString(),
          })}
        </p>
      )}

      {/* Recycled */}
      <FieldGroup
        label={t("recycled")}
        hint={t("recycledHint")}
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
        label={t("composted")}
        hint={t("compostedHint")}
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
        label={t("otherDiverted")}
        hint={t("otherDivertedHint")}
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
            <span className="text-black">{t("sentToLandfill")}</span>
            <span className="font-medium">{Math.max(0, totalWaste - totalDiverted).toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-black">{t("diversionRate")}</span>
            <span className="font-bold">{diversionRate.toFixed(1)}%</span>
          </div>
        </div>
      )}

      {/* Bonus practices */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">{t("bonusPractices")}</p>
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
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black">
          {t("liveComputation")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("wasteDiversionRate")}</span>
            <span className="text-sm font-bold tabular-nums">
              {totalWaste > 0 && totalDiverted > 0
                ? `${Math.round(diversionRate)}%`
                : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("bonusPoints")}</span>
            <span className="text-sm font-bold tabular-nums">
              {bonusCount > 0 ? `+${bonusCount}` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("subScore1C")}</span>
            <span className="text-sm font-bold tabular-nums text-black">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-black">
          {t("evidenceSource")}
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
          <option value="">{t("selectEvidenceQuality")}</option>
          <option value="T1">{t("evidenceT1")}</option>
          <option value="T2">{t("evidenceT2")}</option>
          <option value="T3">{t("evidenceT3")}</option>
          <option value="Proxy">{t("evidenceProxy")}</option>
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
  const t = useTranslations("onboarding.p1.carbon");
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
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">☁️</span>
        <p className="text-sm text-black leading-relaxed">
          {t("autoCalcInfo")}
        </p>
      </div>

      {/* Auto-calculated emission figures */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">Auto-calculated emission figures</p>
        <p className="text-xs text-black font-mono">
          {t("gridFactor")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">
              {t("scope1Label")}
            </span>
            <span className="text-sm font-bold tabular-nums whitespace-nowrap ml-4">
              {Math.round(scope1KgCo2).toLocaleString()}
              <span className="text-xs font-normal text-black ml-1.5">kgCO₂/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">
              {t("scope2Label")}
            </span>
            <span className="text-sm font-bold tabular-nums whitespace-nowrap ml-4">
              {Math.round(scope2KgCo2).toLocaleString()}
              <span className="text-xs font-normal text-black ml-1.5">kgCO₂/year</span>
            </span>
          </div>
        </div>
      </div>

      {/* Scope 3 input */}
      <FieldGroup
        label={t("scope3Label")}
        hint={t("scope3Hint")}
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
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black font-medium bg-muted px-2 py-0.5 rounded pointer-events-none">
            kgCO₂/year
          </span>
        </div>
      </FieldGroup>

      {/* Scope 3 explanation box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <div className="text-sm text-black leading-relaxed space-y-2">
          <p className="font-semibold text-foreground">{t("scope3Title")}</p>
          <p>
            {t("scope3Body")}
          </p>
          <p>{t("scope3Sources")}</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>{t("scope3Source1")}</li>
            <li>{t("scope3Source2")}</li>
            <li>{t("scope3Source3")}</li>
            <li>{t("scope3Source4")}</li>
          </ul>
        </div>
      </div>

      {/* Live computation */}
      <div className="space-y-2">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black">
          {t("liveComputation")}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("totalEmissions")}</span>
            <span className="text-sm font-bold tabular-nums">
              {Math.round(totalKgCo2).toLocaleString()}
              <span className="text-xs font-normal text-black ml-1.5">kgCO₂/year</span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("carbonIntensity")}</span>
            <span className="text-sm font-bold tabular-nums">
              {activityUnit > 0 ? carbonIntensity.toFixed(2) : "0"}
              <span className="text-xs font-normal text-black ml-1.5">
                kgCO₂/{unitLabel}
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between bg-muted/50 border border-border/40 rounded-xl px-4 py-3">
            <span className="text-sm text-black">{t("subScore1D")}</span>
            <span className="text-sm font-bold tabular-nums text-black">—</span>
          </div>
        </div>
      </div>

      {/* Evidence quality */}
      <div className="rounded-xl border border-border/60 bg-card p-4 space-y-3">
        <p className="text-sm text-black">{t("evidenceSource")}</p>
        <select
          value={data.evidenceTierCarbon ?? ""}
          onChange={(e) =>
            updateField({
              evidenceTierCarbon: (e.target.value as EvidenceTier) || undefined,
            })
          }
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("selectEvidenceQuality")}</option>
          <option value="T1">{t("evidenceT1")}</option>
          <option value="T2">{t("evidenceT2")}</option>
          <option value="T3">{t("evidenceT3")}</option>
          <option value="Proxy">{t("evidenceProxy")}</option>
        </select>
      </div>
    </StepShell>
  );
}

// ── P1: Site & land use ───────────────────────────────────────────────────────

export function P1SiteStep({
  data,
  updateField,
  shell,
  floatingGps,
  preview,
}: StepProps) {
  const t = useTranslations("onboarding.p1.site");
  const siteOptions: { label: string; score: number }[] = [
    { label: t("pristineNatural"), score: 100 },
    { label: t("lowImpactNatural"), score: 75 },
    { label: t("mixed"), score: 50 },
    { label: t("mostlyDeveloped"), score: 25 },
    { label: t("fullyUrban"), score: 0 },
  ];
  // 1E: selected option index stored in p1SiteScore (0–4 where 0=pristine, 4=urban)
  // Convert to display score: option 0→100, 1→75, 2→50, 3→25, 4→0
  const selectedIdx = data.p1SiteScore ?? null;
  const site1E = selectedIdx !== null ? siteOptions[selectedIdx]?.score ?? 0 : 0;
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
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Environment dropdown */}
      <div className="space-y-2">
        <label className="text-sm font-medium">
          {t("environmentQuestion")}
        </label>
        <select
          value={selectedIdx ?? ""}
          onChange={(e) => {
            const val = e.target.value;
            updateField({ p1SiteScore: val === "" ? undefined : parseInt(val) });
          }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">{t("selectPlaceholder")}</option>
          {siteOptions.map((opt, i) => (
            <option key={i} value={i}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Pillar 1 summary card */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold">{t("p1SummaryTitle")}</p>
          <p className="text-xs text-black font-mono">
            {t("p1Formula")}
          </p>
        </div>

        <div className="space-y-3">
          {displayIndicators.map((ind) => {
            const contribution = (ind.score * ind.weight) / 100;
            return (
              <div key={ind.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-black font-medium">{ind.label}</span>
                  <span className="tabular-nums text-black">
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
            <span className="text-sm font-bold">{t("footprintScore")}</span>
            <span className="text-sm font-bold tabular-nums">
              {p1Total % 1 === 0 ? p1Total : p1Total.toFixed(1)}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-black">{t("gpsContribution")}</span>
            <span className="text-xs text-black tabular-nums">
              {gpsContribution % 1 === 0 ? gpsContribution : gpsContribution.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </StepShell>
  );
}
