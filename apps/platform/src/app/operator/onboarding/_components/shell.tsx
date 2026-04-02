import type { ReactNode } from "react";
import Link from "next/link";
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

// ── Section progress bar ──────────────────────────────────────────────────────

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
  stepId,
  progress,
  stepNumber,
  totalSteps,
  onBack,
  onNext,
  saving,
  saved,
  isFirst,
  isLast,
  canNext,
  canSubmit,
  onSubmit,
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
}) {
  const sectionLabel = STEP_SECTIONS[stepId];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Thin progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-0.5 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="fixed top-0.5 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-2.5 max-w-4xl mx-auto gap-3">
          {/* Step counter (mobile) */}
          <span className="text-xs text-muted-foreground shrink-0 sm:hidden font-mono font-medium">
            {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>

          {/* Section progress (desktop) */}
          <SectionProgress stepId={stepId} />

          {/* Save status + close */}
          <div className="flex items-center gap-3 ml-auto sm:ml-0 shrink-0">
            {saved ? (
              <span className="text-xs text-primary font-medium">Saved ✓</span>
            ) : saving ? (
              <span className="text-xs text-muted-foreground">Saving…</span>
            ) : null}
            <Link
              href="/operator/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm"
              aria-label="Close onboarding"
            >
              ✕
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-14 pb-28 px-4">
        <div className="max-w-2xl mx-auto py-8 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-medium text-muted-foreground tabular-nums">
                {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
              </span>
              {sectionLabel && (
                <>
                  <span className="text-xs text-muted-foreground/40">·</span>
                  <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                    {sectionLabel}
                  </span>
                </>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground leading-relaxed">{subtitle}</p>
            )}
          </div>
          <div className="space-y-5">{children}</div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t">
        <div className="flex items-center justify-between px-4 py-3.5 max-w-2xl mx-auto">
          {/* Back */}
          <button
            onClick={onBack}
            disabled={isFirst}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          >
            ← Back
          </button>

          {/* Next / Submit */}
          {isLast ? (
            <button
              onClick={onSubmit}
              disabled={saving || !canSubmit}
              className="bg-primary text-primary-foreground font-semibold px-8 py-2.5 rounded-xl disabled:opacity-50 hover:bg-primary/90 transition-colors"
            >
              {saving ? "Submitting…" : "Submit Assessment"}
            </button>
          ) : (
            <div className="flex flex-col items-end gap-1">
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
