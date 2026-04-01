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
}

export function ReviewSubmitStep({
  data,
  shell,
  preview,
  declarationChecked,
  onDeclarationChange,
  onSubmit,
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
  const dataComplete = !!(
    data.operatorType &&
    data.legalName &&
    data.country &&
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
    children,
  }: {
    title: string;
    children: ReactNode;
  }) => (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
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
        <ReviewSection title="Your Profile">
          <Row label="Type" value={OPERATOR_TYPES[data.operatorType ?? "A"]?.label} />
          <Row label="Name" value={data.tradingName || data.legalName} />
          <Row label="Country" value={data.country} />
          <Row label="Region" value={data.destinationRegion} />
          {data.operatorType !== "B" && data.guestNights != null && (
            <Row label="Guest-nights" value={data.guestNights.toLocaleString()} />
          )}
          {data.operatorType !== "A" && data.visitorDays != null && (
            <Row label="Visitor-days" value={data.visitorDays.toLocaleString()} />
          )}
        </ReviewSection>

        {/* P1 */}
        <ReviewSection title="Pillar 1 — Operational Footprint">
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
          <Row label="Site score" value={data.p1SiteScore != null ? `${data.p1SiteScore}/4` : null} />
        </ReviewSection>

        {/* P2 */}
        <ReviewSection title="Pillar 2 — Local Integration">
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
          <Row label="Direct booking" value={data.directBookingPct != null ? `${data.directBookingPct}%` : null} />
        </ReviewSection>

        {/* P3 */}
        <ReviewSection title="Pillar 3 — Regenerative Contribution">
          <Row label="Status" value={data.p3Status ? p3StatusLabel[data.p3Status] : null} />
          {(data.p3Status === "A" || data.p3Status === "B" || data.p3Status === "C") && (
            <Row label="Programme" value={data.p3ProgrammeDescription?.slice(0, 60) ?? null} />
          )}
          <Row label="Evidence files" value={evidenceCount > 0 ? `${evidenceCount} linked` : "None"} />
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
              { step: "1", text: "Your raw data is submitted to the TRT Scoring Engine." },
              { step: "2", text: "P1 intensities and P2 rates are derived server-side." },
              { step: "3", text: "An immutable ScoreSnapshot is created (isPublished = false)." },
              { step: "4", text: "You'll be prompted to upload evidence — T1 verification enables publication." },
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
          Your Cycle 1 GPS becomes the locked baseline for future Delta Performance
          Score (DPS) calculations. Evidence upload is encouraged before your passport
          is published to travellers.
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
