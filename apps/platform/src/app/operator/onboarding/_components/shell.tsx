import type { ReactNode } from "react";
import { ArrowLeft, Save, X } from "lucide-react";
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50">
        <div className="flex items-center h-14 px-6 max-w-[768px] mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <span className="flex-1 text-center text-sm font-mono font-medium tabular-nums">
            {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>

          <button
            onClick={onSaveClose}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
            <X className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-14 pb-32 px-6">
        <div className="max-w-[768px] mx-auto py-10 space-y-8">
          {saved && (
            <span className="text-xs text-primary font-medium">Saved ✓</span>
          )}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          <div className="space-y-5">{children}</div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center justify-end px-6 max-w-[768px] mx-auto">
          {isLast ? (
            <button
              onClick={onSubmit}
              disabled={saving || !canSubmit}
              className="bg-foreground text-background font-semibold px-8 py-2.5 rounded-xl disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "Submitting…" : "Submit Assessment"}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1 py-[8px]">
              {canNext === false && (
                <p className="text-[10px] text-muted-foreground">
                  Complete required fields to continue
                </p>
              )}
              <button
                onClick={onNext}
                disabled={canNext === false || saving}
                className="bg-foreground text-background font-semibold px-8 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving…" : "Continue →"}
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
  gpsBand,
  visible,
}: {
  p1: number;
  p2: number;
  p3: number;
  gps: number;
  gpsBand?: string;
  visible: boolean;
}) {
  if (!visible) return null;

  const bandLabels: Record<string, string> = {
    regenerative_leader: "Regenerative Leader",
    regenerative_practice: "Regenerative Practice",
    advancing: "Advancing",
    developing: "Developing",
    not_yet_published: "Not Yet Published",
  };
  const bandColors: Record<string, string> = {
    regenerative_leader: "text-primary",
    regenerative_practice: "text-teal-600",
    advancing: "text-sky-600",
    developing: "text-amber-600",
    not_yet_published: "text-muted-foreground",
  };

  return (
    <div className="hidden lg:block fixed top-20 right-6 z-30 w-56">
      <div className="rounded-xl border bg-card shadow-lg p-4 space-y-3">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          GPS Preview
        </p>
        <div className="text-center">
          <span className={`text-3xl font-bold tabular-nums ${bandColors[gpsBand ?? ""] ?? "text-foreground"}`}>
            {Math.round(gps)}
          </span>
          {gpsBand && (
            <p className={`text-xs font-medium mt-0.5 ${bandColors[gpsBand] ?? "text-muted-foreground"}`}>
              {bandLabels[gpsBand] ?? gpsBand}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          {([
            { label: "P1 Footprint", score: p1, color: "bg-primary" },
            { label: "P2 Integration", score: p2, color: "bg-teal-500" },
            { label: "P3 Regenerative", score: p3, color: "bg-sky-500" },
          ] as const).map((p) => (
            <div key={p.label} className="space-y-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">{p.label}</span>
                <span className="text-[10px] font-bold tabular-nums">{Math.round(p.score)}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${p.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(Math.max(p.score, 0), 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
