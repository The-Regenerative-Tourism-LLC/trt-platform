import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import { StepShell } from "../shell";
import {
  FieldGroup,
  NumberInput,
  inputCls,
} from "../primitives";
import { P3_CATEGORIES } from "@/lib/constants";
import { Award, Sparkles, Leaf, TrendingUp, ChevronRight } from "lucide-react";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
}

// ── P3: Status ────────────────────────────────────────────────────────────────

const P3_STATUS_OPTIONS = [
  {
    id: "A" as const,
    icon: Award,
    title: "Active programme with a partner organisation",
    desc: "NGO, university, public body — full scoring",
  },
  {
    id: "B" as const,
    icon: Sparkles,
    title: "Own programme — self-managed",
    desc: "No external partner — full scoring",
  },
  {
    id: "C" as const,
    icon: Leaf,
    title: "Informal contributions — not yet formalised",
    desc: "Full scoring, but traceability likely lower",
  },
  {
    id: "D" as const,
    icon: TrendingUp,
    title: "Forward commitment — want to start, not yet active",
    desc: "P3 = 15 (partial credit). We'll match you with a local partner.",
  },
  {
    id: "E" as const,
    icon: ChevronRight,
    title: "Not applicable right now",
    desc: "P3 = 0. Skip to next step.",
  },
];

export function P3StatusStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Giving back to your destination"
      subtitle="Pillar 3: Regenerative Contribution — 30% of your total score."
    >
      {floatingGps}
      <div className="grid gap-3">
        {P3_STATUS_OPTIONS.map(({ id, icon: Icon, title, desc }) => {
          const selected = data.p3Status === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => updateField({ p3Status: id })}
              className={`w-full flex items-center gap-4 rounded-xl border px-4 py-4 text-left transition-all ${
                selected
                  ? "border-foreground bg-secondary"
                  : "border-border hover:border-foreground/30 hover:bg-muted/20"
              }`}
            >
              <div className="shrink-0 w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                selected ? "border-foreground bg-foreground" : "border-muted-foreground/40"
              }`}>
                {selected && <div className="w-2 h-2 rounded-full bg-background" />}
              </div>
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}

// ── P3: Programme (merged with evidence quality indicators) ───────────────────

const TRACEABILITY_OPTIONS = [
  { value: 100, label: "Fully verified — multiple institutions, peer-reviewed data" },
  { value: 75,  label: "Strong — academic partner with signed impact reports" },
  { value: 50,  label: "Good — local NGO with signed documentation" },
  { value: 25,  label: "Basic — local partner, informal agreement" },
  { value: 0,   label: "Self-reported only — no external validation" },
];

const ADDITIONALITY_OPTIONS = [
  { value: 100, label: "Entirely dependent — would not exist without you" },
  { value: 75,  label: "Significantly dependent — primary driver" },
  { value: 50,  label: "Moderately — formalised something pre-existing" },
  { value: 25,  label: "Some — financial contribution but would continue" },
  { value: 0,   label: "Minimal — programme would happen regardless" },
];

const CONTINUITY_OPTIONS = [
  { value: 100, label: "Long-term — 3+ years with dedicated annual budget" },
  { value: 75,  label: "Established — 1–3 years, written multi-year commitment" },
  { value: 50,  label: "Growing — under 1 year, formal budget allocated" },
  { value: 25,  label: "Starting — documented intention, very early stages" },
  { value: 0,   label: "Ad hoc — no formal commitment or budget" },
];

const P3_BREAKDOWN = [
  { key: "3a" as const, label: "3A Scope",         weight: 40 },
  { key: "3b" as const, label: "3B Traceability",  weight: 30 },
  { key: "3c" as const, label: "3C Additionality", weight: 20 },
  { key: "3d" as const, label: "3D Continuity",    weight: 10 },
];

export function P3ProgrammeStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const cats = data.p3ContributionCategories ?? [];
  const p3a = cats.length === 0 ? 0 : cats.length === 1 ? 50 : cats.length === 2 ? 75 : 100;
  const p3b = data.p3Traceability ?? 0;
  const p3c = data.p3Additionality ?? 0;
  const p3d = data.p3Continuity ?? 0;
  const p3Total = p3a * 0.40 + p3b * 0.30 + p3c * 0.20 + p3d * 0.10;

  const subScores: Record<string, number> = { "3a": p3a, "3b": p3b, "3c": p3c, "3d": p3d };

  return (
    <StepShell
      {...shell}
      title="Your contribution programme"
    >
      {floatingGps}

      {data.p3Status === "C" && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 flex gap-3">
          <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-amber-500">i</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">Traceability cap for informal contributions</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Informal contributions are capped at &apos;Partially traceable&apos; (50) on the Traceability dimension. To unlock higher Traceability scores, formalise your programme with an institutional partner (Status A or B).
            </p>
          </div>
        </div>
      )}

      {/* 3A: Category scope */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">Which contribution categories does your programme cover?</p>
          <p className="text-xs text-muted-foreground mt-0.5">3A — Category Scope (40% of P3) · 1 category = 50, 2 = 75, 3+ = 100</p>
        </div>
        <div className="space-y-2">
          {P3_CATEGORIES.map((cat) => {
            const checked = cats.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  updateField({
                    p3ContributionCategories: checked
                      ? cats.filter((c) => c !== cat.id)
                      : [...cats, cat.id],
                  });
                }}
                className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                  checked
                    ? "border-foreground bg-secondary"
                    : "border-border hover:border-foreground/30 hover:bg-muted/20"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{cat.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                </div>
                <div className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                  checked ? "border-foreground bg-foreground" : "border-muted-foreground/40"
                }`}>
                  {checked && <div className="w-2 h-2 rounded-full bg-background" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3B: Traceability */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">How independently verifiable is the impact?</p>
        <p className="text-xs text-muted-foreground">3B — Traceability (30% of P3)</p>
        <select
          value={data.p3Traceability ?? ""}
          onChange={(e) => updateField({ p3Traceability: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>Select</option>
          {TRACEABILITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 3C: Additionality */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">To what extent would this programme exist without you?</p>
        <p className="text-xs text-muted-foreground">3C — Additionality (20% of P3)</p>
        <select
          value={data.p3Additionality ?? ""}
          onChange={(e) => updateField({ p3Additionality: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>Select</option>
          {ADDITIONALITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 3D: Continuity */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">How established is this contribution programme?</p>
        <p className="text-xs text-muted-foreground">3D — Continuity (10% of P3)</p>
        <select
          value={data.p3Continuity ?? ""}
          onChange={(e) => updateField({ p3Continuity: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>Select</option>
          {CONTINUITY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Supporting context (not scored) */}
      <div className="space-y-4 pt-1">
        <p className="text-sm font-medium text-muted-foreground">Supporting context (not scored)</p>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Programme description</p>
          <p className="text-xs text-muted-foreground">Min 50 characters</p>
          <textarea
            value={data.p3ProgrammeDescription ?? ""}
            onChange={(e) => updateField({ p3ProgrammeDescription: e.target.value })}
            className={inputCls + " min-h-[100px] resize-y"}
            placeholder="Describe your contribution programme..."
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">How long running?</p>
            <select
              value={data.p3ProgrammeDuration ?? ""}
              onChange={(e) => updateField({ p3ProgrammeDuration: e.target.value || undefined })}
              className={inputCls}
            >
              <option value="">Select</option>
              <option value="<1">Less than 1 year</option>
              <option value="1-3">1–3 years</option>
              <option value=">3">More than 3 years</option>
              <option value="starting">Starting now</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Annual budget</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">€</span>
              <input
                type="number"
                value={data.p3AnnualBudget ?? ""}
                onChange={(e) => updateField({ p3AnnualBudget: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 5000"
                min={0}
                className={inputCls + " pl-7 pr-14"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">/year</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Partner institution name</p>
          <p className="text-xs text-muted-foreground">If applicable</p>
          <input
            type="text"
            value={data.p3InstitutionName ?? ""}
            onChange={(e) => updateField({ p3InstitutionName: e.target.value })}
            className={inputCls}
            placeholder="e.g. University of Madeira"
          />
        </div>
      </div>

      {/* Collective toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative" onClick={() => updateField({ p3IsCollective: !data.p3IsCollective })}>
          <div className={`w-10 h-6 rounded-full transition-colors ${data.p3IsCollective ? "bg-foreground" : "bg-muted"}`} />
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-background shadow transition-all ${data.p3IsCollective ? "left-5" : "left-1"}`} />
        </div>
        <span className="text-sm">This is a collective/shared programme</span>
      </label>

      {/* P3 breakdown card */}
      <div className="rounded-2xl border border-border/50 bg-background px-5 py-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">Pillar 3: Regenerative Contribution (30% of GPS)</p>
          <p className="text-xs text-muted-foreground mt-0.5">P3 = p3a×0.40 + p3b×0.30 + p3c×0.20 + p3d×0.10</p>
        </div>
        <div className="space-y-3">
          {P3_BREAKDOWN.map(({ key, label, weight }) => {
            const score = subScores[key] ?? 0;
            const contribution = Math.round(score * weight / 100);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(score)}/100 · {weight}% = {contribution}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-foreground/60 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(Math.max(score, 0), 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="border-t border-border/40 pt-3 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Contribution score</span>
            <span className="text-sm font-bold tabular-nums">{Math.round(p3Total)}/100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">GPS contribution (P3 × 0.30)</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(p3Total * 0.30).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </StepShell>
  );
}

// ── P3: Forward Commitment ────────────────────────────────────────────────────

export function P3ForwardCommitmentStep({
  data,
  updateField,
  shell,
}: StepProps) {
  return (
    <StepShell
      {...shell}
      title="Forward commitment"
      subtitle="Declare your commitment to activating a regenerative programme in a future cycle."
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-1">
        <p className="text-sm font-semibold text-amber-800">Status D — Forward Commitment</p>
        <p className="text-xs text-amber-700">
          Your P3 score will be 0 this cycle. Your GPS is computed from Pillar 1 and Pillar 2 only,
          renormalised to 0–100. A Forward Commitment Record will be created upon submission.
        </p>
      </div>
      <FieldGroup
        label="Preferred contribution category"
        hint="Which category fits your territory and operation best?"
      >
        <select
          value={data.forwardCommitmentPreferredCategory ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredCategory: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">— Select —</option>
          {P3_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </FieldGroup>
      <FieldGroup
        label="Territory context"
        hint="Describe the ecological, cultural, or scientific need in your territory. Max 200 words."
      >
        <textarea
          value={data.forwardCommitmentTerritoryContext ?? ""}
          onChange={(e) => updateField({ forwardCommitmentTerritoryContext: e.target.value })}
          className={inputCls + " min-h-[100px] resize-y"}
          placeholder="Why does this category fit your territory?"
        />
      </FieldGroup>
      <FieldGroup
        label="Preferred institution type"
        hint="What kind of institution do you intend to partner with?"
      >
        <select
          value={data.forwardCommitmentPreferredInstitutionType ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredInstitutionType: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">— Select —</option>
          <option value="NGO">NGO / Non-profit</option>
          <option value="University">University / Research institution</option>
          <option value="Government">Government / Public agency</option>
          <option value="Community">Community organisation</option>
          <option value="Other">Other</option>
        </select>
      </FieldGroup>
      <FieldGroup
        label="Target activation cycle"
        hint="Which assessment cycle do you commit to having an active partner?"
      >
        <NumberInput
          value={data.forwardCommitmentTargetCycle}
          onChange={(v) => updateField({ forwardCommitmentTargetCycle: v })}
          placeholder="e.g. 2"
          min={2}
        />
      </FieldGroup>
      <FieldGroup label="Authorised signatory" hint="Full legal name of the person signing this commitment.">
        <input
          type="text"
          value={data.forwardCommitmentSignatory ?? ""}
          onChange={(e) => updateField({ forwardCommitmentSignatory: e.target.value })}
          className={inputCls}
          placeholder="e.g. Maria Silva"
        />
      </FieldGroup>
      <FieldGroup label="Signature date">
        <input
          type="date"
          value={data.forwardCommitmentSignedAt ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentSignedAt: e.target.value || undefined })
          }
          max={new Date().toISOString().slice(0, 10)}
          className={inputCls}
        />
      </FieldGroup>
    </StepShell>
  );
}
