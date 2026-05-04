import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { StepShell } from "../shell";
import { TrendingUp, Award, Info, Shield, AlertTriangle, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";

// ── GPS Preview ───────────────────────────────────────────────────────────────

interface GpsPreviewProps {
  data: OnboardingData;
  shell: StepShellBaseProps;
  preview: PreviewScores | null;
  previewLoading: boolean;
  floatingGps?: ReactNode;
  referenceDpi?: boolean;
}

export function GpsPreviewStep({
  shell,
  preview,
  previewLoading,
  floatingGps,
  referenceDpi,
}: GpsPreviewProps) {
  const t = useTranslations("onboarding.review.gpsPreview");
  const topIcon = (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-black" />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
    >
      {floatingGps}

      {previewLoading || !preview ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-48 rounded-xl bg-muted" />
          <div className="h-36 rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score Summary card */}
          <div className="rounded-xl border bg-card divide-y divide-border/60">
            <div className="px-5 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-black">
                {t("scoreSummary", { version: preview.methodologyVersion })}
              </p>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-black">{t("p1Row")}</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar1Score.toFixed(1)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-black">{t("p2Row")}</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar2Score.toFixed(1)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-black">{t("p3Row")}</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar3Score.toFixed(0)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold">{t("performanceScore")}</span>
              <span className="text-sm tabular-nums font-bold">{Math.round(preview.gpsScore)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-black">{t("progressModifier")}</span>
              <span className="text-sm tabular-nums text-black">+0</span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-base font-bold">{t("finalGps")}</span>
              <span className="text-base tabular-nums font-bold">{Math.round(preview.gpsScore)}</span>
            </div>
          </div>

          {/* Reference DPI warning */}
          {referenceDpi && (
            <div className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{t("noDpiWarning")}</p>
            </div>
          )}

          {/* DPS explanation card */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold">{t("dpsTitle")}</p>
              <p className="text-sm text-black mt-1.5 leading-relaxed">
                {t("dpsBody")}
              </p>
            </div>
            <div className="space-y-2">
              {([
                { label: t("dps1"), range: "±10 pts" },
                { label: t("dps2"), range: "0-10 pts" },
                { label: t("dps3"), range: "+5 pts" },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2.5">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-sm tabular-nums text-black">{item.range}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-black">
              {t("dpsNote")}
            </p>
          </div>
        </div>
      )}
    </StepShell>
  );
}

// ── Review & Submit ───────────────────────────────────────────────────────────

interface ReviewSubmitProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  preview: PreviewScores | null;
  declarationChecked: boolean;
  onDeclarationChange: (v: boolean) => void;
  onSubmit: () => void;
  onEditSection?: (stepId: string) => void;
  floatingGps?: ReactNode;
  referenceDpi?: boolean;
}

export function ReviewSubmitStep({
  shell,
  preview,
  declarationChecked,
  onDeclarationChange,
  onSubmit,
  floatingGps,
  referenceDpi,
}: ReviewSubmitProps) {
  const t = useTranslations("onboarding.review.submit");
  const canSubmit = declarationChecked;

  const topIcon = (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Award className="w-6 h-6 text-black" />
    </div>
  );

  const p1 = preview?.pillar1Score ?? 0;
  const p2 = preview?.pillar2Score ?? 0;
  const p3 = preview?.pillar3Score ?? 0;
  const gps = Math.round(preview?.gpsScore ?? 0);

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
      isLast
      canSubmit={canSubmit}
      onSubmit={onSubmit}
    >
      {floatingGps}

      {/* Green Passport Score card */}
      <div className="rounded-xl border bg-card px-5 py-6 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-black text-center">
          {t("gpsScoreTitle")}
        </p>
        <div className="text-center space-y-1">
          <p className="text-6xl font-bold tabular-nums">{gps}</p>
          <p className="text-xs text-black">{t("notYetPublished")}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center pt-2">
          <div>
            <p className="text-xs text-black">{t("p1Footprint")}</p>
            <p className="text-lg font-bold tabular-nums">{p1.toFixed(1)}/100</p>
            <p className="text-xs text-black">{t("weight40")}</p>
          </div>
          <div>
            <p className="text-xs text-black">{t("p2Integration")}</p>
            <p className="text-lg font-bold tabular-nums">{p2.toFixed(1)}/100</p>
            <p className="text-xs text-black">{t("weight30")}</p>
          </div>
          <div>
            <p className="text-xs text-black">{t("p3Contribution")}</p>
            <p className="text-lg font-bold tabular-nums">{p3.toFixed(0)}/100</p>
            <p className="text-xs text-black">{t("weight30")}</p>
          </div>
        </div>
        <p className="text-xs text-black text-center">
          How your GPS is calculated: ({p1.toFixed(1)}×0.40) + ({p2.toFixed(1)}×0.30) + ({p3.toFixed(0)}×0.30) = <strong>{gps}</strong>
        </p>
      </div>

      {/* Reference DPI warning */}
      {referenceDpi && (
        <div className="rounded-xl border bg-card px-4 py-3 flex items-start gap-3">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm leading-relaxed">{t("noDpiWarning")}</p>
        </div>
      )}

      {/* What happens next */}
      <div className="rounded-xl border bg-card px-5 py-4 space-y-3">
        <p className="text-sm font-semibold">{t("whatHappensTitle")}</p>
        <div className="space-y-2">
          {[
            { n: "1", text: t("step1") },
            { n: "2", text: t("step2") },
            { n: "3", text: t("step3") },
            { n: "4", text: t("step4") },
          ].map((item) => (
            <div key={item.n} className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-muted text-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                {item.n}
              </span>
              <p className="text-sm">{item.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Review before publishing info */}
      <div className="rounded-xl border bg-card px-4 py-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-black shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">{t("reviewTitle")}</p>
          <p className="text-xs text-black mt-1 leading-relaxed">
            {t("reviewBody")}
          </p>
        </div>
      </div>

      {/* Cycle 1 baseline warning */}
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
        <p className="text-sm text-black leading-relaxed">
          {t("baselineWarning")}
        </p>
      </div>

      {/* Privacy */}
      <div className="flex items-center justify-center gap-2 text-xs text-black py-1">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span>{t("howWeProtect")}</span>
      </div>

      {/* Declaration */}
      <div className="rounded-xl border bg-card px-4 py-4">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declarationChecked}
            onChange={(e) => onDeclarationChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 accent-primary"
          />
          <span className="text-sm leading-relaxed">
            {t("declarationText")}
          </span>
        </label>
      </div>
    </StepShell>
  );
}

// ── Submission Success Screen ─────────────────────────────────────────────────

export function SubmissionSuccessScreen({
  onGoToDashboard,
}: {
  onGoToDashboard: () => void;
}) {
  const t = useTranslations("onboarding.review.success");
  const nextSteps = [
    {
      icon: "📁",
      title: t("uploadTitle"),
      desc: t("uploadDesc"),
    },
    {
      icon: "🔍",
      title: t("reviewTitle"),
      desc: t("reviewDesc"),
    },
    {
      icon: "🌿",
      title: t("goLiveTitle"),
      desc: t("goLiveDesc"),
    },
  ];

  const recommendations = [
    t("rec1"),
    t("rec2"),
    t("rec3"),
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-3 sm:px-6 py-16">
        <div className="max-w-onboarding mx-auto w-full space-y-8">

          {/* Success hero */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-secondary text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
                {t("assessmentSubmitted")}
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                {t("heroTitle")}
              </h1>
              <p className="text-black text-base leading-relaxed max-w-lg mx-auto">
                {t("heroBody")}
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-black">
              {t("whatHappensTitle")}
            </p>
            <div className="space-y-3">
              {nextSteps.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-4 rounded-xl border bg-card"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold">{s.title}</p>
                    <p className="text-sm text-black mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">{t("recommendationsTitle")}</p>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 shrink-0 text-sm">→</span>
                  <p className="text-sm text-black leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-3 rounded-xl transition-colors text-base"
          >
            {t("goDashboard")}
          </button>
        </div>
      </div>
    </div>
  );
}
