import type { OnboardingData } from "@/store/onboarding-store";
import { ArrowRight, Save, X, Clock, Shield } from "lucide-react";

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

  const displayTotal = totalSteps + 1;
  const progressPct = (1 / displayTotal) * 100;

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
      <div className="fixed left-0 right-0 z-40 flex items-center bg-background/90 backdrop-blur-sm border-b border-border/40"
        style={{ top: "2px", height: "56px" }}
      >
        <div className="flex items-center w-full max-w-onboarding mx-auto px-3 sm:px-6">
          <div className="w-16 sm:w-20" />
          <span className="flex-1 text-center text-xs sm:text-sm font-mono font-medium tabular-nums text-muted-foreground">
            01 / {String(displayTotal).padStart(2, "0")}
          </span>
          <div className="flex items-center justify-end w-16 sm:w-20">
            <button
              onClick={onSaveClose}
              className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Save</span>
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 pt-14 sm:pt-20 pb-24 sm:pb-28 px-3 sm:px-6">
        <div className="max-w-onboarding mx-auto space-y-5 sm:space-y-8">

          {/* Heading */}
          <div className="space-y-2 sm:space-y-3">
            <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">
              Let&apos;s build your Green Passport
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              We&apos;ll walk you through 4 sections about your operation. It takes about 20 minutes — save anytime and come back where you left off.
            </p>
          </div>

          {/* Section cards */}
          <div className="space-y-2 sm:space-y-3">
            {sections.map((s) => (
              <div
                key={s.num}
                className="flex items-center gap-3 sm:gap-4 rounded-xl sm:rounded-2xl border border-border/60 bg-surface/30 p-3.5 sm:p-5"
              >
                {/* Number box */}
                <div
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    s.done
                      ? "bg-foreground text-background"
                      : "bg-surface text-foreground/60"
                  }`}
                >
                  {s.done ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-4 h-4"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className="font-hand font-normal text-base sm:text-lg leading-none">
                      {s.num}
                    </span>
                  )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold leading-snug text-foreground">{s.label}</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-snug">{s.desc}</p>
                </div>

                {s.done && (
                  <span className="text-[10px] sm:text-xs font-medium text-foreground/60 border border-foreground/20 rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 shrink-0">
                    Started
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Info boxes */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/20 p-3 sm:p-4">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your progress is saved automatically. You can leave and pick up where you left off.
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border/40 bg-surface/20 p-3 sm:p-4">
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is protected under our NDA. Only aggregated, anonymised scores are ever shared publicly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center bg-background/95 backdrop-blur-md border-t border-border/40"
        style={{ height: "72px" }}
      >
        <div className="flex items-center justify-end w-full max-w-onboarding mx-auto px-3 sm:px-6">
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 bg-foreground text-background font-semibold rounded-xl h-10 sm:h-11 px-5 sm:px-8 text-sm sm:text-base hover:opacity-90 transition-opacity"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
