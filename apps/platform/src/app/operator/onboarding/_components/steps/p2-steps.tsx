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
      title="Your team"
      subtitle="Indicator 2A · Staff composition, local hiring, contract types, and wages"
    >
      {floatingGps}

      {/* Confidentiality notice */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-foreground">Employment data</p>
          <p className="text-xs">Confidential — protected under NDA</p>
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
          <p className="text-sm font-semibold">I am a solo operator (no employees)</p>
          <p className="text-xs text-muted-foreground mt-0.5">Local employment = 100%, permanent contracts = 100%</p>
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
          <p className="text-sm font-semibold">My operation is seasonal (operates &lt; 9 months/year)</p>
          <p className="text-xs text-muted-foreground mt-0.5">Permanent contract % floored at 50% in scoring only</p>
        </div>
      </button>

      {data.soloOperator ? (
        <div className="rounded-xl border border-primary/30 bg-secondary p-5">
          <p className="text-base font-medium text-foreground">Solo operator</p>
          <p className="text-sm text-muted-foreground mt-1">
            Employment metrics default to 100% for solo operators. You can continue.
          </p>
        </div>
      ) : (
        <>
          {/* FTE row */}
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup
              label={<>Total FTE (full-time equivalents) <FieldTooltip text="Sum of all staff hours / 40h week. Part-time = 0.5 FTE." /></>}
              
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
              label={<>Local FTE (within 100 km) <FieldTooltip text="Staff whose primary residence is within 100 km." /></>}
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
              Local FTE cannot exceed total FTE.
            </p>
          )}

          {/* Permanent contracts slider */}
          <FieldGroup
            label={<>% on permanent or long-term contracts <FieldTooltip text="Include permanent staff + contracts longer than 6 months. Family members working regularly count as permanent even without formal contracts." /></>}
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
                <span className="font-semibold text-foreground">Family-run tip:</span> Family members who work regularly in the business count as permanent staff, even if they don&apos;t have formal employment contracts. Count them towards your permanent %.
              </div>
            </div>
          </FieldGroup>

          {/* Average monthly gross wage */}
          <FieldGroup
            label={<>Average monthly gross wage <FieldTooltip text="Average across all local staff, gross before tax." /></>}
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
                  Local minimum wage: €870/month (Portugal, 2024). The wage component reaches its maximum (50 pts) at 2× the country minimum wage benchmark (€1740/month).
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
      title="Where do you buy from?"
      subtitle="Indicator 2B · Weight: 30% of P2 · GPS Impact: 9%"
    >
      {floatingGps}

      {/* Confidentiality notice */}
      <div className="flex items-center gap-3 text-muted-foreground">
        <Lock className="w-4 h-4 shrink-0" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium text-foreground">Procurement data</p>
          <p className="text-xs">Financial data — protected under NDA</p>
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/40 px-4 py-3">
        <ShoppingCart className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" strokeWidth={1.5} />
        <p className="text-sm text-muted-foreground leading-relaxed">
          This data measures how much of your spending stays in the local economy. We compare local vs total spend to calculate your Local Procurement Rate — a key P2 indicator.
        </p>
      </div>

      {/* F&B section */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Food &amp; beverage sourcing</p>
        {fsLabel && (
          <p className="text-sm text-muted-foreground bg-muted/40 border border-border/40 rounded-xl px-4 py-2.5 leading-relaxed">
            You indicated <strong>{fsLabel}</strong> — tell us how much you spend on food &amp; beverage and what % comes from local suppliers.
          </p>
        )}
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Total annual F&B spend">
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
          <FieldGroup label="From local suppliers (within 100 km)">
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
        {fbWarning && <p className="text-sm text-amber-600">Local F&amp;B spend cannot exceed total.</p>}
      </div>

      {/* Non-F&B section */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Non-food operating supplies</p>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Total annual non-food spend">
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
          <FieldGroup label="From local suppliers (within 100 km)">
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
        {nonFbWarning && <p className="text-sm text-amber-600">Local non-F&amp;B spend cannot exceed total.</p>}
      </div>

      <EvidenceTierSelector
        value={data.evidenceTierProcurement}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierProcurement: v })}
        label="What is the source of this data?"
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
  const directPct = data.allDirectBookings ? 100 : (data.directBookingPct ?? 0);
  const platformPct = 100 - directPct;

  return (
    <StepShell
      {...shell}
      title="How guests find and book you"
      subtitle="Indicator 2C · Weight: 20% of P2 · GPS Impact: 6%"
    >
      {floatingGps}

      {/* Info box */}
      <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/40 px-4 py-3">
        <span className="text-base select-none shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Direct bookings keep more revenue in your business and signal a loyal guest base. Platforms are counted but weighted lower in the P2 score.
        </p>
      </div>

      {/* Total bookings */}
      <FieldGroup
        label={<>Total bookings in the last 12 months <FieldTooltip text="Count of completed reservations (arrivals) in the last 12-month period." /></>}
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
          label={<>% booked directly with you <FieldTooltip text="Bookings made via your own website, phone, email, or walk-in — excluding any OTA or platform." /></>}
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
          <p className="text-sm font-semibold">All our bookings are direct — no platforms</p>
          <p className="text-xs text-muted-foreground mt-0.5">Sets your direct booking rate to 100%</p>
        </div>
      </button>

      {/* Local ownership % slider */}
      <FieldGroup
        label={<>% local ownership / equity <FieldTooltip text="Percentage of the business owned by residents within 100 km." /></>}
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
          <p className="text-xs text-muted-foreground">Pre-filled from your business profile. Editable here.</p>
        </div>
      </FieldGroup>

      {/* Summary box */}
      <div className="rounded-2xl bg-muted/50 border border-border/40 px-4 py-4 space-y-3">
        <p className="text-sm font-semibold">Where are your guests booking?</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-background rounded-xl border border-border/50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{directPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Direct bookings</p>
          </div>
          <div className="bg-background rounded-xl border border-border/50 px-4 py-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{platformPct}%</p>
            <p className="text-xs text-muted-foreground mt-1">Via online platforms</p>
          </div>
        </div>
      </div>

      <EvidenceTierSelector
        value={data.evidenceTierRevenue}
        onChange={(v: EvidenceTier) => updateField({ evidenceTierRevenue: v })}
        label="What is the source of this data?"
      />
    </StepShell>
  );
}

const COMMUNITY_OPTIONS = [
  { value: 4, label: "Deeply integrated — formal community access, cultural programming, 2+ local org partnerships" },
  { value: 3, label: "Active engagement — regular participation in local events and community initiatives" },
  { value: 2, label: "Moderate presence — some community activities or local sponsorships" },
  { value: 1, label: "Minimal interaction — limited to occasional local sourcing or referrals" },
  { value: 0, label: "No engagement — no meaningful community involvement" },
] as const;

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
  return (
    <StepShell
      {...shell}
      title="Community engagement"
      subtitle="Indicator 2D · Weight: 15% of P2 · GPS Impact: 4.5%"
    >
      {floatingGps}

      {/* Community score select */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">How would you describe your operation&apos;s engagement with the local community?</p>
        <div className="relative">
          <select
            value={data.communityScore ?? ""}
            onChange={(e) => {
              if (e.target.value !== "") updateField({ communityScore: parseInt(e.target.value) });
            }}
            className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-9"
          >
            <option value="" disabled>Select engagement level...</option>
            {COMMUNITY_OPTIONS.map((opt) => (
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
          <p className="text-sm font-semibold">Pillar 2: Local Integration (30% of GPS)</p>
          <p className="text-xs text-muted-foreground mt-0.5">P2 = p2a×0.35 + p2b×0.30 + p2c×0.20 + p2d×0.15</p>
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
            <span className="text-sm font-semibold">Integration score</span>
            <span className="text-sm font-bold tabular-nums">
              {preview ? preview.pillar2Score.toFixed(1) : "—"}/100
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">GPS contribution (P2 × 0.30)</span>
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
      />
    </StepShell>
  );
}
