import { useEffect } from "react";
import type { ReactNode, KeyboardEvent } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { EvidenceTier } from "@/lib/onboarding/onboarding-steps";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { HelpCircle, Lock, ShoppingCart } from "lucide-react";
import { StepShell } from "../shell";
import {
  FieldGroup,
  NumberInput,
  EvidenceTierSelector,
  inputCls,
} from "../primitives";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";

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

// ── P2: Employment ────────────────────────────────────────────────────────────

export function P2EmploymentStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const t = useTranslations("onboarding.p2.employment");
  // Default soloOperator from ownership type on first entry
  useEffect(() => {
    if (data.soloOperator === undefined && data.ownershipType !== undefined) {
      updateField({ soloOperator: data.ownershipType === "sole-proprietor" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const localFteWarning =
    data.localFte != null && data.totalFte != null && data.localFte > data.totalFte;

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Confidentiality notice */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-foreground">{t("confidentialTitle")}</p>
          <p className="text-xs">{t("confidentialSubtitle")}</p>
        </div>
      </div>

      {/* Solo operator toggle card */}
      <button
        type="button"
        role="switch"
        aria-checked={data.soloOperator === true}
        onClick={() => updateField({ soloOperator: !(data.soloOperator ?? false) })}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); updateField({ soloOperator: !(data.soloOperator ?? false) }); } }}
        className="w-full flex items-center gap-4 rounded-2xl bg-muted/50 border border-border/50 px-5 py-4 text-left transition-colors hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Track */}
        <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${data.soloOperator ? "bg-foreground" : "bg-border"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${data.soloOperator ? "translate-x-5" : "translate-x-0"}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("soloToggle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("soloToggleDesc")}</p>
        </div>
      </button>

      {/* Seasonal toggle card */}
      <button
        type="button"
        role="switch"
        aria-checked={data.seasonalOperator === true}
        onClick={() => updateField({ seasonalOperator: !(data.seasonalOperator ?? false) })}
        onKeyDown={(e: KeyboardEvent) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); updateField({ seasonalOperator: !(data.seasonalOperator ?? false) }); } }}
        className="w-full flex items-center gap-4 rounded-2xl bg-muted/50 border border-border/50 px-5 py-4 text-left transition-colors hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* Track */}
        <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${data.seasonalOperator ? "bg-foreground" : "bg-border"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${data.seasonalOperator ? "translate-x-5" : "translate-x-0"}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("seasonalToggle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("seasonalToggleDesc")}</p>
        </div>
      </button>

      {data.soloOperator ? (
        <div className="rounded-xl border border-primary/30 bg-secondary p-5">
          <p className="text-base font-medium text-foreground">{t("soloSummaryTitle")}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {t("soloSummaryDesc")}
          </p>
        </div>
      ) : (
        <>
          {/* FTE row */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup
              label={<>{t("totalFteLabel")} <FieldTooltip text={t("totalFteTooltip")} /></>}
              
            >
              <NumberInput
                value={data.totalFte}
                onChange={(v) => updateField({ totalFte: v })}
                placeholder="e.g. 12"
                min={0}
                step={0.5}
              />
            </FieldGroup>
            <FieldGroup
              label={<>{t("localFteLabel")} <FieldTooltip text={t("localFteTooltip")} /></>}
            >
              <NumberInput
                value={data.localFte}
                onChange={(v) => updateField({ localFte: v })}
                placeholder="e.g. 10"
                min={0}
                step={0.5}
              />
            </FieldGroup>
          </div>
          {localFteWarning && (
            <p className="text-sm text-amber-600">
              {t("localFteError")}
            </p>
          )}

          {/* Permanent contracts slider */}
          <FieldGroup
            label={<>{t("permanentContractLabel")} <FieldTooltip text={t("permanentContractTooltip")} /></>}
          >
            <div className="space-y-3 pt-1">
              <p className="text-sm font-bold">{data.permanentContractPct ?? 0}%</p>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={data.permanentContractPct ?? 0}
                onChange={(e) => updateField({ permanentContractPct: parseInt(e.target.value) })}
                style={{
                  background: `linear-gradient(to right, #000 ${data.permanentContractPct ?? 0}%, hsl(var(--border)) ${data.permanentContractPct ?? 0}%)`,
                }}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid"
              />
              <div className="bg-muted/60 border border-border/40 rounded-xl px-4 py-3 text-sm text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{t("familyRunTip")}</span>{" "}
                {t("familyRunBody")}
              </div>
            </div>
          </FieldGroup>

          {/* Average monthly gross wage */}
          <FieldGroup
            label={<>{t("avgWageLabel")} <FieldTooltip text={t("avgWageTooltip")} /></>}
          >
            <div className="space-y-3">
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sm text-muted-foreground select-none">€</span>
                <input
                  type="number"
                  value={data.averageMonthlyWage ?? ""}
                  onChange={(e) =>
                    updateField({
                      averageMonthlyWage: e.target.value === "" ? undefined : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g. 950"
                  min={0}
                  className={`${inputCls} pl-7 pr-20`}
                />
                <span className="absolute right-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">
                  /month
                </span>
              </div>
              <div className="flex gap-3 rounded-xl bg-muted/60 border border-border/40 px-4 py-3">
                <span className="text-base select-none shrink-0 mt-0.5">💡</span>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t("minimumWageTip")}
                </p>
              </div>
            </div>
          </FieldGroup>
        </>
      )}

      <EvidenceTierSelector
        value={data.evidenceTierEmployment}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierEmployment: v })}
        label="What is the source of this data?"
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
  const t = useTranslations("onboarding.p2.procurement");
  const fbWarning =
    data.localFbSpend != null &&
    data.totalFbSpend != null &&
    data.localFbSpend > data.totalFbSpend;
  const nonFbWarning =
    data.localNonFbSpend != null &&
    data.totalNonFbSpend != null &&
    data.localNonFbSpend > data.totalNonFbSpend;

  const foodServiceLabel: Record<string, string> = {
    full_restaurant: "full restaurant / kitchen",
    breakfast_only: "breakfast only",
    snacks_bar: "snacks / bar service",
    no_food: "no food service",
  };
  const fsLabel = data.foodServiceType ? foodServiceLabel[data.foodServiceType] : null;

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Confidentiality notice */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-foreground">{t("confidentialTitle")}</p>
          <p className="text-xs">{t("confidentialSubtitle")}</p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/40 px-4 py-3">
        <ShoppingCart className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("infoBox")}
        </p>
      </div>

      {/* F&B section */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">{t("fbTitle")}</p>
        {fsLabel && (
          <p className="text-sm text-muted-foreground bg-muted/40 border border-border/40 rounded-xl px-4 py-2.5 leading-relaxed">
            {t.rich("fbContext", {
              fsLabel,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label={t("totalFbSpend")}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-muted-foreground select-none">€</span>
              <input
                type="number"
                value={data.totalFbSpend ?? ""}
                onChange={(e) => updateField({ totalFbSpend: e.target.value === "" ? undefined : parseFloat(e.target.value), tourNoFbSpend: false })}
                placeholder="e.g. 35000"
                min={0}
                className={`${inputCls} pl-7 pr-16`}
              />
              <span className="absolute right-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">/year</span>
            </div>
          </FieldGroup>
          <FieldGroup label={t("localFbSpend")}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-muted-foreground select-none">€</span>
              <input
                type="number"
                value={data.localFbSpend ?? ""}
                onChange={(e) => updateField({ localFbSpend: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 22000"
                min={0}
                className={`${inputCls} pl-7 pr-16`}
              />
              <span className="absolute right-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">/year</span>
            </div>
          </FieldGroup>
        </div>
        {fbWarning && <p className="text-sm text-amber-600">{t("fbWarning")}</p>}
      </div>

      {/* Non-F&B section */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">{t("nonFbTitle")}</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label={t("totalNonFbSpend")}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-muted-foreground select-none">€</span>
              <input
                type="number"
                value={data.totalNonFbSpend ?? ""}
                onChange={(e) => updateField({ totalNonFbSpend: e.target.value === "" ? undefined : parseFloat(e.target.value), tourNoNonFbSpend: false })}
                placeholder="e.g. 18000"
                min={0}
                className={`${inputCls} pl-7 pr-16`}
              />
              <span className="absolute right-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">/year</span>
            </div>
          </FieldGroup>
          <FieldGroup label={t("localNonFbSpend")}>
            <div className="relative flex items-center">
              <span className="absolute left-3 text-sm text-muted-foreground select-none">€</span>
              <input
                type="number"
                value={data.localNonFbSpend ?? ""}
                onChange={(e) => updateField({ localNonFbSpend: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 11000"
                min={0}
                className={`${inputCls} pl-7 pr-16`}
              />
              <span className="absolute right-3 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">/year</span>
            </div>
          </FieldGroup>
        </div>
        {nonFbWarning && <p className="text-sm text-amber-600">{t("nonFbWarning")}</p>}
      </div>

      <EvidenceTierSelector
        value={data.evidenceTierProcurement}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierProcurement: v })}
        label="What is the source of this data?"
        tiers={[
          { value: "T1", label: "T1 — Supplier invoices / receipts (×1.00)" },
          { value: "T2", label: "T2 — Estimated from accounts, with documentation (×0.75)" },
          { value: "T3", label: "T3 — Best estimate, no documentation (×0.50)" },
          { value: "Proxy", label: "Proxy — No records, using estimate (×0.25)" },
        ]}
      />
    </StepShell>
  );
}

// ── P2: Revenue ───────────────────────────────────────────────────────────────

export function P2RevenueStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const t = useTranslations("onboarding.p2.revenue");
  const directPct = data.allDirectBookings ? 100 : (data.directBookingPct ?? 0);
  const platformPct = 100 - directPct;

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/40 px-4 py-3">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("infoBox")}
        </p>
      </div>

      {/* Total bookings */}
      <FieldGroup
        label={<>{t("totalBookings")} <FieldTooltip text={t("totalBookingsTooltip")} /></>}
      >
        <NumberInput
          value={data.totalBookingsCount}
          onChange={(v) => updateField({ totalBookingsCount: v })}
          placeholder="e.g. 420"
          min={0}
          step={1}
        />
      </FieldGroup>

      {/* Direct booking % slider */}
      {!data.allDirectBookings && (
        <FieldGroup
          label={<>{t("directBookingPct")} <FieldTooltip text={t("directBookingTooltip")} /></>}
        >
          <div className="space-y-3 pt-1">
            <p className="text-sm font-bold">{directPct}%</p>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={directPct}
              onChange={(e) => updateField({ directBookingPct: parseInt(e.target.value), allDirectBookings: false })}
              style={{
                background: `linear-gradient(to right, #000 ${directPct}%, hsl(var(--border)) ${directPct}%)`,
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid"
            />
          </div>
        </FieldGroup>
      )}

      {/* All-direct toggle card */}
      <button
        type="button"
        role="switch"
        aria-checked={data.allDirectBookings === true}
        onClick={() =>
          updateField({
            allDirectBookings: !(data.allDirectBookings ?? false),
            directBookingPct: !(data.allDirectBookings ?? false) ? 100 : data.directBookingPct === 100 ? undefined : data.directBookingPct,
          })
        }
        onKeyDown={(e: KeyboardEvent) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            updateField({
              allDirectBookings: !(data.allDirectBookings ?? false),
              directBookingPct: !(data.allDirectBookings ?? false) ? 100 : data.directBookingPct === 100 ? undefined : data.directBookingPct,
            });
          }
        }}
        className="w-full flex items-center gap-4 rounded-2xl bg-muted/50 border border-border/50 px-5 py-4 text-left transition-colors hover:bg-muted/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className={`relative shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${data.allDirectBookings ? "bg-foreground" : "bg-border"}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-background shadow transition-transform duration-200 ${data.allDirectBookings ? "translate-x-5" : "translate-x-0"}`} />
        </div>
        <div>
          <p className="text-sm font-semibold">{t("allDirectToggle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("allDirectToggleDesc")}</p>
        </div>
      </button>

      {/* Local ownership % slider */}
      <FieldGroup
        label={<>{t("localOwnershipPct")} <FieldTooltip text={t("localOwnershipTooltip")} /></>}
      >
        <div className="space-y-3 pt-1">
          <p className="text-sm font-bold">{data.localEquityPct ?? 0}%</p>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={data.localEquityPct ?? 0}
            onChange={(e) => updateField({ localEquityPct: parseInt(e.target.value) })}
            style={{
              background: `linear-gradient(to right, #000 ${data.localEquityPct ?? 0}%, hsl(var(--border)) ${data.localEquityPct ?? 0}%)`,
            }}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-background [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-background [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-foreground [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-solid"
          />
          <p className="text-xs text-muted-foreground">{t("localOwnershipNote")}</p>
        </div>
      </FieldGroup>

      {/* Summary box */}
      <div className="rounded-2xl bg-muted/50 border border-border/40 px-4 py-4 space-y-3">
        <p className="text-sm font-semibold">{t("whereBookingTitle")}</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-border/50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{directPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">{t("directBookingsLabel")}</p>
          </div>
          <div className="bg-background rounded-xl border border-border/50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{platformPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">{t("platformsLabel")}</p>
          </div>
        </div>
      </div>

      <EvidenceTierSelector
        value={data.evidenceTierRevenue}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierRevenue: v })}
        label="What is the source of this data?"
        tiers={[
          { value: "T1", label: "T1 — Booking system / PMS / channel manager records (×1.00)" },
          { value: "T2", label: "T2 — Estimated from reservation history (×0.75)" },
          { value: "T3", label: "T3 — Best estimate, no documentation (×0.50)" },
          { value: "Proxy", label: "Proxy — No records, using estimate (×0.25)" },
        ]}
      />
    </StepShell>
  );
}

const P2_WEIGHTS = [
  { key: "p2a" as const, label: "2A Employment", weight: 35 },
  { key: "p2b" as const, label: "2B Procurement", weight: 30 },
  { key: "p2c" as const, label: "2C Revenue", weight: 20 },
  { key: "p2d" as const, label: "2D Community", weight: 15 },
];

// ── P2: Community ─────────────────────────────────────────────────────────────

export function P2CommunityStep({
  data,
  updateField,
  shell,
  floatingGps,
  preview,
}: StepProps) {
  const t = useTranslations("onboarding.p2.community");
  const communityOptions = [
    { value: 4, label: t("deeplyIntegrated") },
    { value: 3, label: t("activeEngagement") },
    { value: 2, label: t("moderatePresence") },
    { value: 1, label: t("minimalInteraction") },
    { value: 0, label: t("noEngagement") },
  ] as const;
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}

      {/* Community score select */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("engagementQuestion")}</p>
        <div className="relative">
          <select
            value={data.communityScore ?? ""}
            onChange={(e) => {
              if (e.target.value !== "") updateField({ communityScore: parseInt(e.target.value) });
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-9"
          >
            <option value="" disabled>{t("selectEngagement")}</option>
            {communityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">&#x2304;</span>
        </div>
      </div>

      {/* P2 breakdown card — always visible, updates dynamically as preview refreshes */}
      <div className="rounded-2xl border border-border/50 bg-background px-5 py-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">{t("p2SummaryTitle")}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("p2Formula")}</p>
        </div>
        <div className="space-y-3">
          {P2_WEIGHTS.map(({ key, label, weight }) => {
            const raw = preview?.p2SubScores?.[key] ?? 0;
            const contribution = Math.round(raw * weight / 100);
            const pct = Math.min(Math.max(raw, 0), 100);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(raw)}/100 · {weight}% = {contribution}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/60 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/40 pt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{t("integrationScore")}</span>
            <span className="text-sm font-bold tabular-nums">
              {preview ? preview.pillar2Score.toFixed(1) : "—"}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("gpsContribution")}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {preview ? (preview.pillar2Score * 0.30).toFixed(1) : "—"}
            </span>
          </div>
        </div>
      </div>

      <EvidenceTierSelector
        value={data.evidenceTierCommunity}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierCommunity: v })}
        label="What is the source of this data?"
        tiers={[
          { value: "T1", label: "T1 — Partnership agreements / MoUs (×1.00)" },
          { value: "T2", label: "T2 — Photos / event records with context (×0.75)" },
          { value: "T3", label: "T3 — Self-declared, no documentation (×0.50)" },
          { value: "Proxy", label: "Proxy — No records, using estimate (×0.25)" },
        ]}
      />
    </StepShell>
  );
}
