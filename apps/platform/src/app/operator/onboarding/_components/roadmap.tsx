import type { OnboardingData } from "@/store/onboarding-store";
import { Tip, PrivacyBadge } from "./primitives";

export function RoadmapScreen({
  onStart,
  data,
}: {
  onStart: () => void;
  data: OnboardingData;
}) {
  const sections = [
    {
      icon: "🏢",
      label: "Your operation",
      desc: "Basic info about your business, location, and ownership.",
      done: !!(data.legalName?.trim()),
    },
    {
      icon: "🌱",
      label: "Pillar 1 — Operational Footprint (40%)",
      desc: "Energy, water, waste, carbon & land use.",
      done: data.totalElectricityKwh != null || data.totalGasKwh != null,
    },
    {
      icon: "🤝",
      label: "Pillar 2 — Local Integration (30%)",
      desc: "Employment, procurement, revenue retention & community.",
      done: data.totalFte != null || data.soloOperator === true,
    },
    {
      icon: "✨",
      label: "Pillar 3 — Regenerative Contribution (30%)",
      desc: "How you actively improve the place you depend on.",
      done: !!data.p3Status,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto w-full space-y-8">

          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
              Green Passport Assessment
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Let&apos;s get your Green Passport set up
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
              We&apos;ll walk you through a few sections about your operation. It takes
              about 20 minutes — you can save and come back anytime.
            </p>
          </div>

          <div className="grid gap-3">
            {sections.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:bg-muted/20 transition-colors"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    s.done
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.done ? (
                    <span className="text-lg">✓</span>
                  ) : (
                    <span className="text-lg select-none">{s.icon}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{s.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
                {s.done && (
                  <span className="text-[10px] font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-2 py-0.5 rounded-full shrink-0">
                    Started
                  </span>
                )}
              </div>
            ))}
          </div>

          <Tip icon="⏱">
            Your progress is saved automatically. You can leave and pick up where
            you left off.
          </Tip>

          <PrivacyBadge />

          <button
            onClick={onStart}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-3 rounded-xl transition-colors text-base"
          >
            Start assessment →
          </button>
        </div>
      </div>
    </div>
  );
}
