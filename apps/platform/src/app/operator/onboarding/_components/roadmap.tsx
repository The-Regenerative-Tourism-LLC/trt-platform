import type { OnboardingData } from "@/store/onboarding-store";
import { Save, X, Clock, Shield } from "lucide-react";

export function RoadmapScreen({
  onStart,
  data,
  totalSteps,
  onSaveClose,
}: {
  onStart: () => void;
  data: OnboardingData;
  totalSteps: number;
  onSaveClose: () => void;
}) {
  const sections = [
    {
      num: "01",
      label: "Your operation",
      desc: "Basic info about your business",
      done: !!(data.legalName?.trim()),
    },
    {
      num: "02",
      label: "Pillar 1 — Operational Footprint (40%)",
      desc: "Energy, water, waste, carbon & land use",
      done: data.totalElectricityKwh != null || data.totalGasKwh != null,
    },
    {
      num: "03",
      label: "Pillar 2 — Local Integration (30%)",
      desc: "Employment, procurement, revenue retention & community",
      done: data.totalFte != null || data.soloOperator === true,
    },
    {
      num: "04",
      label: "Pillar 3 — Regenerative Contribution (30%)",
      desc: "How you actively improve the place you depend on",
      done: !!data.p3Status,
    },
  ];

  // Roadmap is screen 1; total includes roadmap + question steps
  const displayTotal = totalSteps + 1;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border/50">
        <div className="flex items-center h-14 px-6 max-w-[768px] mx-auto">
          {/* Left: empty (first screen — no back) */}
          <div className="w-16" />

          <span className="flex-1 text-center text-sm font-mono font-medium tabular-nums">
            01 / {String(displayTotal).padStart(2, "0")}
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

          {/* Heading */}
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
              Let&apos;s get your Green Passport set up
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed">
              We&apos;ll walk you through a few sections about your operation.
              It takes about 20 minutes — you can save and come back anytime.
            </p>
          </div>

          {/* Section cards */}
          <div className="space-y-3">
            {sections.map((s) => (
              <div
                key={s.num}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border/60 bg-card"
              >
                {/* Icon box */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-sm font-semibold ${
                    s.done
                      ? "bg-foreground text-background"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-5 h-5"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold leading-snug">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {s.desc}
                  </p>
                </div>

                {/* Started badge */}
                {s.done && (
                  <span className="text-xs font-medium text-foreground/70 border border-border rounded-full px-3 py-1 shrink-0">
                    Started
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Info boxes */}
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your progress is saved automatically. You can leave and pick up where you left off.
              </p>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 border border-border/40">
              <Shield className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is protected under our NDA. Only aggregated, anonymised scores are ever shared publicly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar — Next only (first screen, no Back) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-sm border-t border-border/50">
        <div className="flex items-center justify-end h-16 px-6 max-w-[768px] mx-auto">
          <button
            onClick={onStart}
            className="bg-foreground text-background font-semibold px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
