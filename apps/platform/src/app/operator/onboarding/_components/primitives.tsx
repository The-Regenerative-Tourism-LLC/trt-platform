import type { ReactNode } from "react";
import type { EvidenceTier } from "@/lib/onboarding/onboarding-steps";

export const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

export function FieldGroup({
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
      {hint && <p className="text-xs text-muted-foreground leading-relaxed">{hint}</p>}
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
      <div className="text-xs text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export function PrivacyBadge() {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-muted/30 border border-border/40 px-4 py-3">
      <span className="text-base select-none shrink-0 mt-0.5">🔒</span>
      <p className="text-xs text-muted-foreground leading-relaxed">
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
  { value: "T1", label: "T1 — Primary", desc: "Utility bills, meter readings, invoices" },
  { value: "T2", label: "T2 — Secondary", desc: "Estimates from reliable data" },
  { value: "T3", label: "T3 — Tertiary", desc: "Operator self-estimates" },
  { value: "Proxy", label: "Proxy", desc: "Industry benchmarks or peer averages" },
] as const;

export function EvidenceTierSelector({
  value,
  onChange,
  label,
}: {
  value: EvidenceTier | undefined;
  onChange: (v: EvidenceTier) => void;
  label?: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium text-muted-foreground">
        {label ?? "Evidence quality for this indicator"}
      </p>
      <div className="flex gap-2 flex-wrap">
        {EVIDENCE_TIERS.map((tier) => (
          <button
            key={tier.value}
            onClick={() => onChange(tier.value)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              value === tier.value
                ? "border-foreground bg-secondary text-foreground"
                : "border-border hover:border-primary/40 text-muted-foreground"
            }`}
          >
            {tier.label}
          </button>
        ))}
      </div>
    </div>
  );
}
