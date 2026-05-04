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
import { useTranslations } from "next-intl";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  floatingGps?: ReactNode;
}

// ── P3: Status ────────────────────────────────────────────────────────────────

export function P3StatusStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const t = useTranslations("onboarding.p3.status");
  const statusOptions = [
    {
      id: "A" as const,
      icon: Award,
      title: t("activePartner"),
      desc: t("activePartnerDesc"),
    },
    {
      id: "B" as const,
      icon: Sparkles,
      title: t("ownProgramme"),
      desc: t("ownProgrammeDesc"),
    },
    {
      id: "C" as const,
      icon: Leaf,
      title: t("informalContributions"),
      desc: t("informalContributionsDesc"),
    },
    {
      id: "D" as const,
      icon: TrendingUp,
      title: t("forwardCommitment"),
      desc: t("forwardCommitmentDesc"),
    },
    {
      id: "E" as const,
      icon: ChevronRight,
      title: t("notApplicable"),
      desc: t("notApplicableDesc"),
    },
  ];
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {floatingGps}
      <div className="grid gap-3">
        {statusOptions.map(({ id, icon: Icon, title, desc }) => {
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
                <Icon className="w-5 h-5 text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-black mt-0.5">{desc}</p>
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

export function P3ProgrammeStep({
  data,
  updateField,
  shell,
  floatingGps,
}: StepProps) {
  const t = useTranslations("onboarding.p3.programme");
  const traceabilityOptions = [
    { value: 100, label: t("traceabilityFullyVerified") },
    { value: 75, label: t("traceabilityStrong") },
    { value: 50, label: t("traceabilityGood") },
    { value: 25, label: t("traceabilityBasic") },
    { value: 0, label: t("traceabilitySelfReported") },
  ];
  const additionalityOptions = [
    { value: 100, label: t("additionalityEntirelyDependent") },
    { value: 75, label: t("additionalitySignificant") },
    { value: 50, label: t("additionalityModerate") },
    { value: 25, label: t("additionalitySome") },
    { value: 0, label: t("additionalityMinimal") },
  ];
  const continuityOptions = [
    { value: 100, label: t("continuityLongTerm") },
    { value: 75, label: t("continuityEstablished") },
    { value: 50, label: t("continuityGrowing") },
    { value: 25, label: t("continuityStarting") },
    { value: 0, label: t("continuityAdHoc") },
  ];
  const p3Breakdown = [
    { key: "3a" as const, label: "3A Scope", weight: 40 },
    { key: "3b" as const, label: "3B Traceability", weight: 30 },
    { key: "3c" as const, label: "3C Additionality", weight: 20 },
    { key: "3d" as const, label: "3D Continuity", weight: 10 },
  ];
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
      title={t("stepTitle")}
    >
      {floatingGps}

      {data.p3Status === "C" && (
        <div className="rounded-xl border border-border bg-muted/40 p-4 flex gap-3">
          <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-amber-500">i</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t("informalCapTitle")}</p>
            <p className="text-sm text-black leading-relaxed">
              {t("informalCapBody")}
            </p>
          </div>
        </div>
      )}

      {/* 3A: Category scope */}
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium">{t("categoryTitle")}</p>
          <p className="text-xs text-black mt-0.5">{t("categorySubtitle")}</p>
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
                  <p className="text-xs text-black mt-0.5">{cat.description}</p>
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
        <p className="text-sm font-medium">{t("traceabilityTitle")}</p>
        <p className="text-xs text-black">{t("traceabilitySubtitle")}</p>
        <select
          value={data.p3Traceability ?? ""}
          onChange={(e) => updateField({ p3Traceability: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>{t("selectPlaceholder")}</option>
          {traceabilityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 3C: Additionality */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("additionalityTitle")}</p>
        <p className="text-xs text-black">{t("additionalitySubtitle")}</p>
        <select
          value={data.p3Additionality ?? ""}
          onChange={(e) => updateField({ p3Additionality: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>{t("selectPlaceholder")}</option>
          {additionalityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* 3D: Continuity */}
      <div className="space-y-1.5">
        <p className="text-sm font-medium">{t("continuityTitle")}</p>
        <p className="text-xs text-black">{t("continuitySubtitle")}</p>
        <select
          value={data.p3Continuity ?? ""}
          onChange={(e) => updateField({ p3Continuity: e.target.value === "" ? undefined : parseInt(e.target.value) })}
          className={inputCls}
        >
          <option value="" disabled>{t("selectPlaceholder")}</option>
          {continuityOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Supporting context (not scored) */}
      <div className="space-y-4 pt-1">
        <p className="text-sm font-medium text-black">{t("contextTitle")}</p>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("programmeDescription")}</p>
          <p className="text-xs text-black">{t("programmeDescriptionHint")}</p>
          <textarea
            value={data.p3ProgrammeDescription ?? ""}
            onChange={(e) => updateField({ p3ProgrammeDescription: e.target.value })}
            className={inputCls + " min-h-[100px] resize-y"}
            placeholder={t("programmeDescriptionPlaceholder")}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("howLongRunning")}</p>
            <select
              value={data.p3ProgrammeDuration ?? ""}
              onChange={(e) => updateField({ p3ProgrammeDuration: e.target.value || undefined })}
              className={inputCls}
            >
              <option value="">{t("selectDuration")}</option>
              <option value="<1">{t("lessThan1")}</option>
              <option value="1-3">{t("oneToThree")}</option>
              <option value=">3">{t("moreThan3")}</option>
              <option value="starting">{t("startingNow")}</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <p className="text-sm font-medium">{t("annualBudget")}</p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-black pointer-events-none">€</span>
              <input
                type="number"
                value={data.p3AnnualBudget ?? ""}
                onChange={(e) => updateField({ p3AnnualBudget: e.target.value === "" ? undefined : parseFloat(e.target.value) })}
                placeholder="e.g. 5000"
                min={0}
                className={inputCls + " pl-7 pr-14"}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-black pointer-events-none">/year</span>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">{t("partnerName")}</p>
          <p className="text-xs text-black">{t("partnerNameHint")}</p>
          <input
            type="text"
            value={data.p3InstitutionName ?? ""}
            onChange={(e) => updateField({ p3InstitutionName: e.target.value })}
            className={inputCls}
            placeholder={t("partnerNamePlaceholder")}
          />
        </div>
      </div>

      {/* Collective toggle */}
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <div className="relative" onClick={() => updateField({ p3IsCollective: !data.p3IsCollective })}>
          <div className={`w-10 h-6 rounded-full transition-colors ${data.p3IsCollective ? "bg-foreground" : "bg-muted"}`} />
          <div className={`absolute top-1 w-4 h-4 rounded-full bg-background shadow transition-all ${data.p3IsCollective ? "left-5" : "left-1"}`} />
        </div>
        <span className="text-sm">{t("isCollective")}</span>
      </label>

      {/* P3 breakdown card */}
      <div className="rounded-2xl border border-border/50 bg-background px-5 py-4 space-y-4">
        <div>
          <p className="text-sm font-semibold">{t("p3SummaryTitle")}</p>
          <p className="text-xs text-black mt-0.5">{t("p3Formula")}</p>
        </div>
        <div className="space-y-3">
          {p3Breakdown.map(({ key, label, weight }) => {
            const score = subScores[key] ?? 0;
            const contribution = Math.round(score * weight / 100);
            return (
              <div key={key} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-xs text-black tabular-nums">
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
            <span className="text-sm font-semibold">{t("contributionScore")}</span>
            <span className="text-sm font-bold tabular-nums">{Math.round(p3Total)}/100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-black">{t("gpsContribution")}</span>
            <span className="text-xs text-black tabular-nums">
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
  const t = useTranslations("onboarding.p3.forwardCommitment");
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      <div className="rounded-xl border bg-card p-4 space-y-1">
        <p className="text-sm font-semibold">{t("statusTitle")}</p>
        <p className="text-xs text-amber-700">
          {t("statusBody")}
        </p>
      </div>
      <FieldGroup
        label={t("preferredCategory")}
        hint={t("preferredCategoryHint")}
      >
        <select
          value={data.forwardCommitmentPreferredCategory ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredCategory: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">{t("selectCategory")}</option>
          {P3_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </FieldGroup>
      <FieldGroup
        label={t("territoryContext")}
        hint={t("territoryContextHint")}
      >
        <textarea
          value={data.forwardCommitmentTerritoryContext ?? ""}
          onChange={(e) => updateField({ forwardCommitmentTerritoryContext: e.target.value })}
          className={inputCls + " min-h-[100px] resize-y"}
          placeholder={t("territoryContextPlaceholder")}
        />
      </FieldGroup>
      <FieldGroup
        label={t("institutionType")}
        hint={t("institutionTypeHint")}
      >
        <select
          value={data.forwardCommitmentPreferredInstitutionType ?? ""}
          onChange={(e) =>
            updateField({ forwardCommitmentPreferredInstitutionType: e.target.value || undefined })
          }
          className={inputCls}
        >
          <option value="">{t("selectInstitution")}</option>
          <option value="NGO">{t("institutionNgo")}</option>
          <option value="University">{t("institutionUniversity")}</option>
          <option value="Government">{t("institutionGovernment")}</option>
          <option value="Community">{t("institutionCommunity")}</option>
          <option value="Other">{t("institutionOther")}</option>
        </select>
      </FieldGroup>
      <FieldGroup
        label={t("targetCycle")}
        hint={t("targetCycleHint")}
      >
        <NumberInput
          value={data.forwardCommitmentTargetCycle}
          onChange={(v) => updateField({ forwardCommitmentTargetCycle: v })}
          placeholder="e.g. 2"
          min={2}
        />
      </FieldGroup>
      <FieldGroup label={t("signatory")} hint={t("signatoryHint")}>
        <input
          type="text"
          value={data.forwardCommitmentSignatory ?? ""}
          onChange={(e) => updateField({ forwardCommitmentSignatory: e.target.value })}
          className={inputCls}
          placeholder={t("signatoryPlaceholder")}
        />
      </FieldGroup>
      <FieldGroup label={t("signatureDate")}>
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
