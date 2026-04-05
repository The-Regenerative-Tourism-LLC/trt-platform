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
          <div style={{ width: "80px" }} />
          <span
            className="flex-1 text-center tabular-nums"
            style={{
              fontFamily: "var(--font-mono, 'JetBrains Mono', monospace)",
              fontSize: "13px",
              fontWeight: 500,
              color: "rgba(41,38,35,0.6)",
            }}
          >
            01 / {String(displayTotal).padStart(2, "0")}
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

          {/* Heading */}
          <div style={{ marginBottom: "28px" }}>
            <h1
              style={{
                fontSize: "40px",
                lineHeight: "44px",
                fontWeight: 600,
                color: "#1F1C19",
                marginBottom: "8px",
                letterSpacing: "-0.5px",
              }}
            >
              Let&apos;s build your Green Passport
            </h1>
            <p
              style={{
                fontSize: "16px",
                lineHeight: "24px",
                color: "rgba(41,38,35,0.6)",
                maxWidth: "520px",
              }}
            >
              We&apos;ll walk you through 4 sections about your operation. It takes about 20 minutes — save anytime and come back where you left off.
            </p>
          </div>

          {/* Section cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px" }}>
            {sections.map((s) => (
              <div
                key={s.num}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  height: "64px",
                  padding: "16px 20px",
                  borderRadius: "16px",
                  backgroundColor: s.done ? "rgba(219,214,205,0.9)" : "rgba(219,214,205,0.6)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  boxSizing: "border-box",
                }}
              >
                {/* Number box */}
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    backgroundColor: s.done ? "#1F1C19" : "rgba(41,38,35,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    color: s.done ? "#E7E3D8" : "rgba(41,38,35,0.7)",
                    fontFamily: s.done ? "inherit" : "var(--font-hand, 'Caveat', cursive)",
                    fontSize: s.done ? "14px" : "18px",
                    fontWeight: s.done ? 400 : 400,
                    lineHeight: 1,
                  }}
                >
                  {s.done ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ width: "16px", height: "16px" }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    s.num
                  )}
                </div>

                {/* Text */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      lineHeight: "18px",
                      color: "#1F1C19",
                      margin: 0,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      fontSize: "13px",
                      lineHeight: "18px",
                      color: "rgba(41,38,35,0.6)",
                      marginTop: "2px",
                      marginBottom: 0,
                    }}
                  >
                    {s.desc}
                  </p>
                </div>

                {s.done && (
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: 500,
                      color: "rgba(41,38,35,0.5)",
                      border: "1px solid rgba(41,38,35,0.18)",
                      borderRadius: "999px",
                      padding: "3px 10px",
                      flexShrink: 0,
                    }}
                  >
                    Started
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Info cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "16px",
                backgroundColor: "rgba(219,214,205,0.45)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Clock style={{ width: "15px", height: "15px", flexShrink: 0, color: "rgba(41,38,35,0.5)" }} />
              <p style={{ fontSize: "13px", lineHeight: "18px", color: "rgba(41,38,35,0.6)", margin: 0 }}>
                Your progress is saved automatically. You can leave and pick up where you left off.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "16px",
                backgroundColor: "rgba(219,214,205,0.45)",
                border: "1px solid rgba(0,0,0,0.06)",
              }}
            >
              <Shield style={{ width: "15px", height: "15px", flexShrink: 0, color: "rgba(41,38,35,0.5)" }} />
              <p style={{ fontSize: "13px", lineHeight: "18px", color: "rgba(41,38,35,0.6)", margin: 0 }}>
                Your data is protected under our NDA. Only aggregated, anonymised scores are ever shared publicly.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
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
          <button
            onClick={onStart}
            className="flex items-center transition-opacity hover:opacity-80"
            style={{
              backgroundColor: "#1F1C19",
              color: "#ffffff",
              borderRadius: "12px",
              padding: "10px 20px",
              fontSize: "14px",
              fontWeight: 600,
              gap: "6px",
              border: "none",
              cursor: "pointer",
            }}
          >
            Next
            <ArrowRight style={{ width: "15px", height: "15px" }} />
          </button>
        </div>
      </div>
    </div>
  );
}
