import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { StepShell } from "../shell";
import { TrendingUp, Award, Info, Shield, AlertTriangle } from "lucide-react";

// ── GPS Preview ───────────────────────────────────────────────────────────────

interface GpsPreviewProps {
  data: OnboardingData;
  shell: StepShellBaseProps;
  preview: PreviewScores | null;
  previewLoading: boolean;
  floatingGps?: ReactNode;
}

export function GpsPreviewStep({
  shell,
  preview,
  previewLoading,
  floatingGps,
}: GpsPreviewProps) {
  const topIcon = (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <TrendingUp className="w-6 h-6 text-muted-foreground" />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title="Your Green Passport Score"
      subtitle="Cycle 1 score. Your Progress Modifier unlocks in Cycle 2 — up to +10 points for improvement."
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Score Summary · V{preview.methodologyVersion}
              </p>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">P1 Operational Footprint (40%)</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar1Score.toFixed(1)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">P2 Local Integration (30%)</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar2Score.toFixed(1)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">P3 Regenerative Contribution (30%)</span>
              <span className="text-sm tabular-nums font-medium">{preview.pillar3Score.toFixed(0)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm font-semibold">Performance Score</span>
              <span className="text-sm tabular-nums font-bold">{Math.round(preview.gpsScore)}</span>
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Progress Modifier (Cycle 1)</span>
              <span className="text-sm tabular-nums text-muted-foreground">+0</span>
            </div>
            <div className="px-5 py-4 flex items-center justify-between">
              <span className="text-base font-bold">Final GPS</span>
              <span className="text-base tabular-nums font-bold">{Math.round(preview.gpsScore)}</span>
            </div>
          </div>

          {/* DPS explanation card */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <div>
              <p className="text-sm font-semibold">How the Progress Modifier works (from Cycle 2)</p>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                The Progress Modifier rewards year-over-year improvement, ranging from −5 to +10 points applied to your Performance Score. It&apos;s computed from three DPS components:
              </p>
            </div>
            <div className="space-y-2">
              {([
                { label: "DPS-1: Indicator trajectory",       range: "±10 pts" },
                { label: "DPS-2: Improvement breadth",        range: "0-10 pts" },
                { label: "DPS-3: Contribution activation bonus", range: "+5 pts" },
              ] as const).map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-lg border border-border/60 px-4 py-2.5">
                  <span className="text-sm">{item.label}</span>
                  <span className="text-sm tabular-nums text-muted-foreground">{item.range}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              The raw DPS total is converted to a bounded modifier: DPS × 0.4, clamped to [−5, +10].
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
}

export function ReviewSubmitStep({
  shell,
  preview,
  declarationChecked,
  onDeclarationChange,
  onSubmit,
  floatingGps,
}: ReviewSubmitProps) {
  const canSubmit = declarationChecked;

  const topIcon = (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <Award className="w-6 h-6 text-muted-foreground" />
    </div>
  );

  const p1 = preview?.pillar1Score ?? 0;
  const p2 = preview?.pillar2Score ?? 0;
  const p3 = preview?.pillar3Score ?? 0;
  const gps = Math.round(preview?.gpsScore ?? 0);

  return (
    <StepShell
      {...shell}
      title="Review & submit"
      subtitle="Your preliminary Green Passport Score based on the data you provided."
      topIcon={topIcon}
      isLast
      canSubmit={canSubmit}
      onSubmit={onSubmit}
    >
      {floatingGps}

      {/* Green Passport Score card */}
      <div className="rounded-xl border bg-card px-5 py-6 space-y-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center">
          Green Passport Score
        </p>
        <div className="text-center space-y-1">
          <p className="text-6xl font-bold tabular-nums">{gps}</p>
          <p className="text-xs text-muted-foreground">Not Yet Published</p>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center pt-2">
          <div>
            <p className="text-xs text-muted-foreground">P1 Footprint</p>
            <p className="text-lg font-bold tabular-nums">{p1.toFixed(1)}/100</p>
            <p className="text-xs text-muted-foreground">weight 40%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P2 Integration</p>
            <p className="text-lg font-bold tabular-nums">{p2.toFixed(1)}/100</p>
            <p className="text-xs text-muted-foreground">weight 30%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P3 Contribution</p>
            <p className="text-lg font-bold tabular-nums">{p3.toFixed(0)}/100</p>
            <p className="text-xs text-muted-foreground">weight 30%</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          How your GPS is calculated: ({p1.toFixed(1)}×0.40) + ({p2.toFixed(1)}×0.30) + ({p3.toFixed(0)}×0.30) = <strong>{gps}</strong>
        </p>
      </div>

      {/* What happens next */}
      <div className="rounded-xl border bg-card px-5 py-4 space-y-3">
        <p className="text-sm font-semibold">What happens next?</p>
        <div className="space-y-2">
          {[
            { n: "1", text: "Your data is saved and a preliminary score is calculated." },
            { n: "2", text: "Upload supporting evidence from your operator dashboard." },
            { n: "3", text: "Our team reviews and verifies your submission — typically within 5–7 business days." },
            { n: "4", text: "Once verified, your score is published on your public profile." },
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
        <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">Want to review your scores before publishing?</p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            After submitting, you'll receive a personalised action plan. You can also request a review call with our sustainability team — your score won't be published until you approve it.
          </p>
        </div>
      </div>

      {/* Cycle 1 baseline warning */}
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          This is your baseline assessment (Cycle 1). Future assessment cycles will measure your improvement trajectory through the Direction of Performance Score (DPS).
        </p>
      </div>

      {/* Privacy */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-1">
        <Shield className="w-3.5 h-3.5 shrink-0" />
        <span>How we protect your data</span>
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
            I confirm that the information provided is accurate and verifiable. I understand my score won't be published until evidence is reviewed.
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
  const nextSteps = [
    {
      icon: "📁",
      title: "Upload your evidence",
      desc: "Head to your operator dashboard and upload supporting documents — utility bills, payroll records, supplier invoices. Evidence strengthens your score.",
    },
    {
      icon: "🔍",
      title: "Our team reviews your submission",
      desc: "A TRT reviewer will verify your data and evidence. You'll receive an email when review is complete.",
    },
    {
      icon: "🌿",
      title: "Your Green Passport goes live",
      desc: "Once verified, your score is published on your public Green Passport profile — visible to travellers who care.",
    },
  ];

  const recommendations = [
    "Consider switching to a renewable energy tariff — this can significantly boost your P1 score.",
    "Local procurement is one of the highest-impact P2 improvements you can make.",
    "Formalising your community engagement programme can unlock P3 Status A.",
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex flex-col justify-center px-4 py-16">
        <div className="max-w-2xl mx-auto w-full space-y-8">

          {/* Success hero */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-secondary text-primary flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-secondary text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30">
                Assessment submitted
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Your Green Passport is on its way
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-lg mx-auto">
                Your assessment has been received. Here&apos;s what happens next and how to make the most of your score.
              </p>
            </div>
          </div>

          {/* What happens next */}
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              What happens next
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
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-sm font-semibold">Recommendations to improve your score</p>
            <div className="space-y-2">
              {recommendations.map((r, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-primary mt-0.5 shrink-0 text-sm">→</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-10 py-3 rounded-xl transition-colors text-base"
          >
            Go to my dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
