"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  STEP_SECTIONS,
  SECTION_GROUPS,
  getSectionForStep,
} from "@/lib/onboarding/onboarding-steps";

// ── Shared shell prop types ───────────────────────────────────────────────────

export interface StepShellBaseProps {
  stepId: string;
  progress: number;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
  saved: boolean;
  canNext: boolean;
}

// ── Section progress bar (kept for compatibility) ─────────────────────────────

export function SectionProgress({ stepId }: { stepId: string }) {
  const currentSection = getSectionForStep(stepId);
  const currentIdx = currentSection
    ? SECTION_GROUPS.findIndex((g) => g.id === currentSection.id)
    : -1;

  return (
    <div className="hidden sm:flex items-center gap-0.5 overflow-x-auto">
      {SECTION_GROUPS.map((g, i) => {
        const isCurrent = i === currentIdx;
        const isPast = i < currentIdx;

        return (
          <div key={g.id} className="flex items-center gap-0.5">
            {i > 0 && (
              <div
                className={`h-px w-3 mx-0.5 shrink-0 ${
                  isPast ? "bg-primary/80" : "bg-border"
                }`}
              />
            )}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap transition-colors ${
                isCurrent
                  ? "bg-secondary text-primary border border-primary/30"
                  : isPast
                  ? "text-primary"
                  : "text-muted-foreground/40"
              }`}
            >
              {isPast ? "✓ " : ""}
              {g.shortLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Step shell ────────────────────────────────────────────────────────────────

export function StepShell({
  children,
  title,
  subtitle,
  topIcon,
  stepId: _stepId,
  progress: _progress,
  stepNumber,
  totalSteps,
  onBack,
  onNext,
  saving,
  saved,
  isFirst: _isFirst,
  isLast,
  canNext,
  canSubmit,
  onSubmit,
  onSaveClose,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  topIcon?: ReactNode;
  stepId: string;
  progress: number;
  stepNumber: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  saving: boolean;
  saved: boolean;
  isFirst?: boolean;
  isLast?: boolean;
  canNext?: boolean;
  canSubmit?: boolean;
  onSubmit?: () => void;
  onSaveClose?: () => void;
}) {
  void STEP_SECTIONS;
  void _stepId;
  void _progress;
  void _isFirst;

  const t = useTranslations("onboarding.navigation");

  const progressPct = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-border/40">
        <div
          className="h-full bg-foreground transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Header bar */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center bg-background/90 backdrop-blur-sm border-b border-border/40"
        style={{ top: "2px", height: "56px" }}
      >
        <div className={`flex items-center w-full 
          max-w-onboarding mx-auto px-3 sm:px-6`}>
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors w-16 sm:w-20"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">{t("back")}</span>
          </button>

          <span className="flex-1 text-center text-xs sm:text-sm font-mono font-medium tabular-nums text-muted-foreground">
            {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>

          <div className="flex items-center justify-end w-16 sm:w-20">
            <button
              onClick={onSaveClose}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">{t("save")}</span>
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-14 sm:pt-20 pb-24 sm:pb-28 px-3 sm:px-6">
        {topIcon ? (
          <div className="max-w-onboarding mx-auto space-y-4 sm:space-y-5">
            {topIcon}
            {saved && (
              <span className="text-xs text-muted-foreground font-medium">{t("saved")}</span>
            )}
            <div className="space-y-2">
              <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm text-muted-foreground leading-relaxed">{subtitle}</p>
              )}
            </div>
            <div className="space-y-3">{children}</div>
          </div>
        ) : (
          <div className="max-w-onboarding mx-auto space-y-5 sm:space-y-8">
            {saved && (
              <span className="text-xs text-muted-foreground font-medium">{t("saved")}</span>
            )}
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">{title}</h1>
              {subtitle && (
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{subtitle}</p>
              )}
            </div>
            <div className="space-y-4 sm:space-y-5">{children}</div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center bg-background/95 backdrop-blur-md border-t border-border/40"
        style={{ height: "72px" }}
      >
        <div className={`flex items-center justify-end w-full max-w-onboarding mx-auto px-3 sm:px-6`}>
          {isLast ? (
            <div className="flex flex-col items-end gap-1">
              {!canSubmit && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {t("tickConfirm")}
                </p>
              )}
              <button
                onClick={onSubmit}
                disabled={saving || !canSubmit}
                className="inline-flex items-center gap-2 bg-foreground text-background font-semibold rounded-xl h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {saving ? t("submitting") : t("submitAssessment")}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end gap-1">
              {canNext === false && (
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {t("completeRequired")}
                </p>
              )}
              <button
                onClick={onNext}
                disabled={canNext === false || saving}
                className="inline-flex items-center gap-2 bg-foreground text-background font-semibold rounded-xl h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {saving ? t("saving") : (
                  <>
                    {t("next")}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Floating GPS preview card ─────────────────────────────────────────────────

export function GpsFloatingCard({
  p1,
  p2,
  p3,
  gps,
  visible,
}: {
  p1: number;
  p2: number;
  p3: number;
  gps: number;
  visible: boolean;
}) {
  const t = useTranslations("onboarding.gps");

  if (!visible) return null;

  return (
    <div className="hidden lg:block fixed top-20 right-6 z-30 w-52">
      <div className="rounded-xl border bg-card shadow-lg p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("preview")}
        </p>
        <div className="space-y-2">
          {([
            { labelKey: "p1" as const, score: p1 },
            { labelKey: "p2" as const, score: p2 },
            { labelKey: "p3" as const, score: p3 },
          ]).map((p) => (
            <div key={p.labelKey} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{t(p.labelKey)}</span>
              <span className="text-xs tabular-nums text-foreground">
                {p.score.toFixed(1)}/100
              </span>
            </div>
          ))}
        </div>
        <div className="border-t border-border/50 pt-2 flex items-center justify-between">
          <span className="text-sm font-bold">GPS</span>
          <span className="text-xl font-bold tabular-nums">{gps.toFixed(1)}</span>
        </div>
        <p className="text-xs text-center text-muted-foreground">
          {t("notPublished")}
        </p>
      </div>
    </div>
  );
}
