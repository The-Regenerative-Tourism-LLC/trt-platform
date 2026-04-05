import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Save, X } from "lucide-react";
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

  const progressPct = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#E7E3D8" }}
    >
      {/* Progress bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50"
        style={{ height: "2px", backgroundColor: "rgba(0,0,0,0.08)" }}
      >
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progressPct}%`, backgroundColor: "#000000" }}
        />
      </div>

      {/* Header bar */}
      <div
        className="fixed left-0 right-0 z-40 flex items-center backdrop-blur-sm"
        style={{
          top: "2px",
          height: "56px",
          backgroundColor: "rgba(231,227,216,0.9)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="flex items-center w-full"
          style={{ maxWidth: "640px", margin: "0 auto", padding: "0 24px" }}
        >
          <button
            onClick={onBack}
            className="flex items-center transition-opacity hover:opacity-60"
            style={{ gap: "6px", fontSize: "13px", color: "rgba(41,38,35,0.6)", width: "80px" }}
          >
            <ArrowLeft style={{ width: "15px", height: "15px" }} />
            Back
          </button>

          <span
            className="flex-1 text-center tabular-nums"
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(41,38,35,0.6)",
            }}
          >
            {String(stepNumber).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
          </span>

          <div className="flex items-center justify-end" style={{ width: "80px" }}>
            <button
              onClick={onSaveClose}
              className="flex items-center transition-opacity hover:opacity-60"
              style={{ gap: "6px", fontSize: "13px", color: "rgba(41,38,35,0.6)" }}
            >
              <Save style={{ width: "15px", height: "15px" }} />
              <span>Save</span>
              <X style={{ width: "15px", height: "15px" }} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className="flex-1"
        style={{ paddingTop: "80px", paddingBottom: "120px", paddingLeft: "24px", paddingRight: "24px" }}
      >
        <div style={{ maxWidth: "640px", margin: "0 auto" }}>
          {saved && (
            <p style={{ fontSize: "12px", color: "rgba(41,38,35,0.5)", marginBottom: "8px" }}>Saved ✓</p>
          )}
          <div style={{ marginBottom: "24px" }}>
            <h1
              style={{
                fontSize: "32px",
                lineHeight: "38px",
                fontWeight: 600,
                color: "#1F1C19",
                marginBottom: "8px",
                letterSpacing: "-0.3px",
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p style={{ fontSize: "15px", lineHeight: "22px", color: "rgba(41,38,35,0.6)" }}>
                {subtitle}
              </p>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>{children}</div>
        </div>
      </div>

      {/* Bottom navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center backdrop-blur-sm"
        style={{
          height: "72px",
          backgroundColor: "rgba(231,227,216,0.95)",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div
          className="flex items-center justify-end w-full"
          style={{ maxWidth: "640px", margin: "0 auto", padding: "0 24px" }}
        >
          {isLast ? (
            <button
              onClick={onSubmit}
              disabled={saving || !canSubmit}
              className="flex items-center transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                backgroundColor: "#1F1C19",
                color: "#ffffff",
                borderRadius: "12px",
                padding: "10px 20px",
                fontSize: "14px",
                fontWeight: 600,
                gap: "6px",
                border: "none",
                cursor: saving || !canSubmit ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Submitting…" : "Submit Assessment"}
            </button>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
              {canNext === false && (
                <p style={{ fontSize: "11px", color: "rgba(41,38,35,0.5)" }}>
                  Complete required fields to continue
                </p>
              )}
              <button
                onClick={onNext}
                disabled={canNext === false || saving}
                className="flex items-center transition-opacity hover:opacity-80 disabled:opacity-30"
                style={{
                  backgroundColor: "#1F1C19",
                  color: "#ffffff",
                  borderRadius: "12px",
                  padding: "10px 20px",
                  fontSize: "14px",
                  fontWeight: 600,
                  gap: "6px",
                  border: "none",
                  cursor: canNext === false || saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? "Saving…" : (
                  <>
                    Continue
                    <ArrowRight style={{ width: "15px", height: "15px" }} />
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
