import type { ReactNode } from "react";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { StepShell } from "../shell";
import { Tip, PrivacyBadge, ScoreBar } from "../primitives";
import { OPERATOR_TYPES } from "@/lib/constants";

// ── GPS Preview ───────────────────────────────────────────────────────────────

interface GpsPreviewProps {
  data: OnboardingData;
  shell: StepShellBaseProps;
  preview: PreviewScores | null;
  previewLoading: boolean;
}

export function GpsPreviewStep({
  shell,
  preview,
  previewLoading,
}: GpsPreviewProps) {
  const bandLabel = preview?.gpsBand?.replace(/_/g, " ") ?? "—";
  const bandColor: Record<string, string> = {
    regenerative_leader: "text-emerald-600",
    regenerative_practice: "text-teal-600",
    advancing: "text-sky-600",
    developing: "text-amber-600",
    not_yet_published: "text-muted-foreground",
  };
  const activeBandColor = preview?.gpsBand
    ? bandColor[preview.gpsBand] ?? "text-foreground"
    : "text-foreground";

  return (
    <StepShell
      {...shell}
      title="Your Green Passport Score"
      subtitle="Estimated score based on your current data. Final scores are computed server-side after submission and evidence verification."
    >
      {previewLoading || !preview ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
          <div className="h-20 rounded-xl bg-muted" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* GPS hero */}
          <div className="rounded-xl border bg-card p-6 text-center space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Green Passport Score
            </p>
            <p className={`text-6xl font-bold tabular-nums ${activeBandColor}`}>
              {Math.round(preview.gpsScore)}
            </p>
            <p className={`text-sm font-medium capitalize ${activeBandColor}`}>{bandLabel}</p>
          </div>

          {/* Pillar breakdown */}
          <div className="rounded-xl border bg-card p-5 space-y-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Pillar scores
            </p>
            <ScoreBar
              label="P1 — Operational Footprint"
              score={preview.pillar1Score}
              meta="weight 40%"
              colorClass="bg-emerald-500"
            />
            <ScoreBar
              label="P2 — Local Integration"
              score={preview.pillar2Score}
              meta="weight 30%"
              colorClass="bg-teal-500"
            />
            <ScoreBar
              label="P3 — Regenerative Contribution"
              score={preview.pillar3Score}
              meta="weight 30%"
              colorClass="bg-sky-500"
            />
            <div className="border-t pt-3 flex items-center justify-between">
              <span className="text-sm font-semibold">GPS = P1×0.4 + P2×0.3 + P3×0.3</span>
              <span className="text-sm font-bold tabular-nums">{Math.round(preview.gpsScore)}</span>
            </div>
          </div>

          <Tip icon="📈">
            From Cycle 2 onwards, a <strong>Delta Performance Score (DPS)</strong> is
            computed from your locked Cycle 1 baseline. The DPS has three components —
            DPS-1 (intensity improvement), DPS-2 (structural improvement), DPS-3
            (programme advancement) — and applies a ×0.4 modifier clamped to ±10 GPS
            points. This is not relevant for your first assessment.
          </Tip>

          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              This is an estimate only. Publication of your score requires T1 evidence
              verification. Methodology version: {preview.methodologyVersion}.
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
}

export function ReviewSubmitStep({
  data,
  shell,
  preview,
  declarationChecked,
  onDeclarationChange,
  onSubmit,
  onEditSection,
}: ReviewSubmitProps) {
  const hasP1 = data.totalElectricityKwh != null || data.totalGasKwh != null;
  const hasP2 = data.totalFte != null || data.soloOperator === true;
  const hasP3 = !!data.p3Status;
  const splitValid =
    data.operatorType !== "C" ||
    (data.revenueSplitAccommodationPct != null &&
      data.revenueSplitExperiencePct != null &&
      Math.abs(
        (data.revenueSplitAccommodationPct ?? 0) +
          (data.revenueSplitExperiencePct ?? 0) -
          100
      ) < 1);
  const hasPhotos = (data.photoRefs?.length ?? 0) >= 1;

  const dataComplete = !!(
    data.operatorType &&
    data.legalName &&
    data.country &&
    hasPhotos &&
    hasP1 &&
    hasP2 &&
    hasP3 &&
    splitValid
  );

  const canSubmit = dataComplete && declarationChecked;
  const evidenceCount = data.evidenceRefs?.length ?? 0;

  const p3StatusLabel: Record<string, string> = {
    A: "Status A — Active, verified institutional partner",
    B: "Status B — Active, verification in progress",
    C: "Status C — Internal programme",
    D: "Status D — Forward commitment",
    E: "Status E — No programme",
  };

  const ReviewSection = ({
    title,
    editStepId,
    children,
  }: {
    title: string;
    editStepId?: string;
    children: ReactNode;
  }) => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
        {editStepId && onEditSection && (
          <button
            onClick={() => onEditSection(editStepId)}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            Edit →
          </button>
        )}
      </div>
      <div className="px-4 py-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">{children}</div>
    </div>
  );

  const Row = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value ?? "—"}</span>
    </>
  );

  return (
    <StepShell
      {...shell}
      title="Review & submit"
      subtitle="Check your information before submitting your assessment."
      isLast
      canSubmit={canSubmit}
      onSubmit={onSubmit}
    >
      <div className="space-y-4">

        {/* GPS preview card */}
        {preview && (
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Estimated GPS Score
            </p>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold tabular-nums">{Math.round(preview.gpsScore)}</span>
              <span className="text-sm text-muted-foreground capitalize">
                {preview.gpsBand?.replace(/_/g, " ")}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              {([
                { label: "P1 Footprint", score: preview.pillar1Score },
                { label: "P2 Integration", score: preview.pillar2Score },
                { label: "P3 Regenerative", score: preview.pillar3Score },
              ] as const).map((p) => (
                <div key={p.label} className="rounded-lg border bg-muted/30 p-3 space-y-0.5">
                  <div className="text-xl font-bold tabular-nums">{Math.round(p.score)}</div>
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile */}
        <ReviewSection title="Your Profile" editStepId="operator-type">
          <Row label="Type" value={OPERATOR_TYPES[data.operatorType ?? "A"]?.label} />
          <Row label="Name" value={data.tradingName || data.legalName} />
          <Row label="Country" value={data.country} />
          <Row label="Region" value={data.destinationRegion} />
        </ReviewSection>

        {/* Activity */}
        <ReviewSection title="Activity Data" editStepId="operation-activity">
          {data.operatorType !== "B" && data.guestNights != null && (
            <Row label="Guest-nights" value={data.guestNights.toLocaleString()} />
          )}
          {data.operatorType !== "A" && data.visitorDays != null && (
            <Row label="Visitor-days" value={data.visitorDays.toLocaleString()} />
          )}
          {data.operatorType === "C" && (
            <>
              <Row label="Accommodation %" value={data.revenueSplitAccommodationPct != null ? `${data.revenueSplitAccommodationPct}%` : null} />
              <Row label="Experience %" value={data.revenueSplitExperiencePct != null ? `${data.revenueSplitExperiencePct}%` : null} />
            </>
          )}
          <Row label="Assessment period end" value={data.assessmentPeriodEnd} />
        </ReviewSection>

        {/* Photos */}
        <ReviewSection title="Photos" editStepId="photos">
          <Row
            label="Images (cover first)"
            value={
              (data.photoRefs?.length ?? 0) > 0
                ? `${data.photoRefs!.length} reference${data.photoRefs!.length !== 1 ? "s" : ""}`
                : "None"
            }
          />
        </ReviewSection>

        {/* P1 */}
        <ReviewSection title="Pillar 1 — Operational Footprint" editStepId="p1-energy">
          <Row
            label="Electricity"
            value={
              data.totalElectricityKwh != null
                ? `${data.totalElectricityKwh.toLocaleString()} kWh`
                : null
            }
          />
          <Row
            label="Renewables"
            value={
              (data.renewableOnsitePct ?? 0) + (data.renewableTariffPct ?? 0) > 0
                ? `${(data.renewableOnsitePct ?? 0) + (data.renewableTariffPct ?? 0)}%`
                : "0%"
            }
          />
          <Row
            label="Water"
            value={
              data.totalWaterLitres != null
                ? `${data.totalWaterLitres.toLocaleString()} L`
                : null
            }
          />
          <Row
            label="Water practices"
            value={[
              data.waterGreywater ? "Greywater" : null,
              data.waterRainwater ? "Rainwater" : null,
              data.waterWastewaterTreatment ? "Wastewater treatment" : null,
            ]
              .filter(Boolean)
              .join(", ") || "—"}
          />
          <Row label="Site score" value={data.p1SiteScore != null ? `${data.p1SiteScore}/4` : null} />
        </ReviewSection>

        {/* P2 */}
        <ReviewSection title="Pillar 2 — Local Integration" editStepId="p2-employment">
          {data.soloOperator ? (
            <>
              <span className="text-muted-foreground col-span-2 text-xs italic">Solo operator — employment defaults to 100%</span>
            </>
          ) : (
            <>
              <Row label="Total FTE" value={data.totalFte} />
              <Row label="Local FTE" value={data.localFte} />
            </>
          )}
          <Row
            label="Local F&B"
            value={
              data.tourNoFbSpend
                ? "No F&B"
                : data.totalFbSpend && data.localFbSpend
                ? `${Math.round((data.localFbSpend / data.totalFbSpend) * 100)}% local`
                : null
            }
          />
          <Row label="Bookings (count)" value={data.totalBookingsCount?.toLocaleString() ?? null} />
          <Row
            label="Direct booking"
            value={
              data.allDirectBookings
                ? "100% (all direct)"
                : data.directBookingPct != null
                ? `${data.directBookingPct}%`
                : null
            }
          />
          <Row label="Seasonal operator" value={data.seasonalOperator === true ? "Yes" : data.seasonalOperator === false ? "No" : null} />
        </ReviewSection>

        {/* P3 */}
        <ReviewSection title="Pillar 3 — Regenerative Contribution" editStepId="p3-status">
          <Row label="Status" value={data.p3Status ? p3StatusLabel[data.p3Status] : null} />
          {(data.p3Status === "A" || data.p3Status === "B" || data.p3Status === "C") && (
            <Row label="Programme" value={data.p3ProgrammeDescription?.slice(0, 60) ?? null} />
          )}
          <Row label="Evidence files" value={evidenceCount > 0 ? `${evidenceCount} linked` : "None"} />
        </ReviewSection>

        {/* Evidence */}
        <ReviewSection title="Evidence" editStepId="evidence-checklist">
          <Row label="Files linked" value={evidenceCount > 0 ? `${evidenceCount} file${evidenceCount !== 1 ? "s" : ""}` : "None"} />
          {evidenceCount === 0 && (
            <span className="text-xs text-amber-600 col-span-2">
              Evidence upload is optional but recommended for score publication.
            </span>
          )}
        </ReviewSection>

        {/* Readiness checklist */}
        <div className="rounded-xl border bg-card p-5 space-y-2">
          <p className="text-sm font-semibold">Readiness check</p>
          <div className="space-y-1.5 text-sm">
            {[
              {
                label: "Operator profile complete",
                ok: !!(data.operatorType && data.legalName && data.country),
              },
              { label: "At least one photo reference", ok: hasPhotos },
              { label: "Pillar 1 — energy data provided", ok: hasP1 },
              { label: "Pillar 2 — employment data provided", ok: hasP2 },
              { label: "Pillar 3 — status selected", ok: hasP3 },
              ...(data.operatorType === "C"
                ? [{ label: "Revenue split sums to 100%", ok: splitValid }]
                : []),
              {
                label: "Evidence linked (optional)",
                ok: evidenceCount > 0,
                warn: true,
              },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2">
                <span
                  className={`text-sm ${
                    c.ok
                      ? "text-emerald-600"
                      : "warn" in c && c.warn
                      ? "text-amber-500"
                      : "text-destructive"
                  }`}
                >
                  {c.ok ? "✓" : "warn" in c && c.warn ? "⚠" : "✗"}
                </span>
                <span
                  className={
                    c.ok
                      ? ""
                      : "warn" in c && c.warn
                      ? "text-amber-700"
                      : "text-destructive"
                  }
                >
                  {c.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Declaration */}
        <div
          className={`rounded-xl border p-4 transition-colors ${
            declarationChecked
              ? "border-emerald-400 bg-emerald-50"
              : "border-border bg-card"
          }`}
        >
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={declarationChecked}
              onChange={(e) => onDeclarationChange(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
            />
            <span className="text-sm leading-relaxed">
              I confirm that the information submitted is accurate and verifiable. I understand that
              final publication of my score depends on evidence verification.
            </span>
          </label>
        </div>

        {/* What happens next */}
        <div className="rounded-xl border bg-card p-5 space-y-3">
          <p className="text-sm font-semibold">What happens next?</p>
          <div className="space-y-2.5">
            {[
              { step: "1", text: "Your data is saved and a preliminary score is calculated." },
              { step: "2", text: "Upload supporting evidence from your operator dashboard." },
              { step: "3", text: "Our team reviews and verifies your data." },
              { step: "4", text: "Once verified, your score is published on your public Green Passport profile." },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {item.step}
                </span>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <Tip icon="🔒">
          Your Green Passport score is your baseline for future assessments. Adding
          evidence strengthens your score and unlocks your public profile.
        </Tip>

        <PrivacyBadge />

        {!dataComplete && (
          <p className="text-sm text-amber-600">
            Please complete all required steps before submitting.
          </p>
        )}
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
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
              ✓
            </div>
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-200">
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
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-xl shrink-0">
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{s.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
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
                  <span className="text-emerald-500 mt-0.5 shrink-0 text-sm">→</span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={onGoToDashboard}
            className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-10 py-3 rounded-xl transition-colors text-base"
          >
            Go to my dashboard →
          </button>
        </div>
      </div>
    </div>
  );
}
