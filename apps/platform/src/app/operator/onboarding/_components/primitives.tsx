import type { ReactNode } from "react";
import type { EvidenceTier } from "@/lib/onboarding/onboarding-steps";

export const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function FieldGroup({
  label,
  hint,
  children,
}: {
  label: ReactNode;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-sm font-medium">{label}</label>
      {hint && <p className="text-sm text-muted-foreground leading-relaxed">{hint}</p>}
      {children}
    </div>
  );
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step,
  unit,
}: {
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}) {
  if (unit) {
    return (
      <div className="relative">
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
          className={`${inputCls} pr-20`}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-muted px-2 py-1 rounded pointer-events-none">
          {unit}
        </span>
      </div>
    );
  }
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

export function BandSelector({
  values,
  labels,
  selected,
  onSelect,
}: {
  values: number[];
  labels?: string[];
  selected: number | undefined;
  onSelect: (v: number) => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {values.map((v, i) => (
        <button
          key={v}
          onClick={() => onSelect(v)}
          className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
            selected === v
              ? "border-foreground bg-secondary text-foreground"
              : "border-border hover:border-primary/40"
          }`}
        >
          {labels ? labels[i] : v}
        </button>
      ))}
    </div>
  );
}

export function TogglePair({
  value,
  trueLabel,
  falseLabel,
  onChange,
}: {
  value: boolean | undefined;
  trueLabel: string;
  falseLabel: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex gap-3">
      {([
        { label: trueLabel, val: true },
        { label: falseLabel, val: false },
      ] as const).map(({ label, val }) => (
        <button
          key={String(val)}
          onClick={() => onChange(val)}
          className={`flex-1 rounded-xl border-2 p-3 text-sm text-center transition-all ${
            value === val
              ? "border-foreground bg-secondary font-medium text-foreground"
              : "border-border hover:border-primary/40"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function Tip({
  children,
  icon = "💡",
}: {
  children: ReactNode;
  icon?: string;
}) {
  return (
    <div className="flex gap-3 rounded-xl bg-muted/50 border border-border/50 px-4 py-3">
      <span className="text-base select-none shrink-0 mt-0.5">{icon}</span>
      <div className="text-sm text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function PrivacyBadge() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 border border-border/40 px-4 py-3">
      <span className="text-base select-none shrink-0 mt-0.5">🔒</span>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Your data is protected under our NDA. Only aggregated, anonymised scores are
        ever shared publicly. Individual operational data remains confidential.
      </p>
    </div>
  );
}

export function MetricDisplay({
  label,
  value,
  unit,
}: {
  label: string;
  value: string | number;
  unit?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 bg-muted/50 rounded-xl px-4 py-3">
      <span className="text-xs text-muted-foreground min-w-0 truncate">{label}</span>
      <span className="font-bold text-sm tabular-nums shrink-0">
        {value}
        {unit ? ` ${unit}` : ""}
      </span>
    </div>
  );
}

export function ScoreBar({
  label,
  score,
  meta,
  colorClass,
}: {
  label: string;
  score: number;
  meta?: string;
  colorClass: string;
}) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          {meta && (
            <span className="text-xs text-muted-foreground">{meta}</span>
          )}
          <span className="text-sm font-bold tabular-nums w-7 text-right">
            {Math.round(score)}
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Evidence tier selector ────────────────────────────────────────────────────

export const EVIDENCE_TIERS = [
  { value: "T1", label: "T1 — Payroll records / employment contracts (×1.00)" },
  { value: "T2", label: "T2 — Self-declared with supporting documents (×0.75)" },
  { value: "T3", label: "T3 — Self-declared, no documentation (×0.50)" },
  { value: "Proxy", label: "Proxy — No records, using estimate (×0.25)" },
] as const;

export function EvidenceTierSelector({
  value,
  onChange,
  label,
  tiers,
}: {
  value: EvidenceTier | undefined;
  onChange: (v: EvidenceTier) => void;
  label?: string;
  tiers?: readonly { value: string; label: string }[];
}) {
  const options = tiers ?? EVIDENCE_TIERS;
  return (
    <div className="rounded-2xl bg-muted/50 border border-border/40 px-4 py-4 space-y-2">
      <p className="text-sm text-muted-foreground">
        {label ?? "What is the source of this data?"}
      </p>
      <div className="relative">
        <select
          value={value ?? ""}
          onChange={(e) => { if (e.target.value) onChange(e.target.value as EvidenceTier); }}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-ring pr-9"
        >
          <option value="" disabled>Select evidence quality...</option>
          {options.map((tier) => (
            <option key={tier.value} value={tier.value}>
              {tier.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          &#x2304;
        </span>
      </div>
    </div>
  );
}
