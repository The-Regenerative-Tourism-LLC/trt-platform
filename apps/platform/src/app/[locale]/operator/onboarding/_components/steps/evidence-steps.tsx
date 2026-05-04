"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import type { PreviewScores } from "@/hooks/usePreviewScore";
import { StepShell } from "../shell";
import { FieldGroup, NumberInput, inputCls, PrivacyBadge } from "../primitives";
import { INDICATOR_LABELS } from "@/lib/constants";
import { toast } from "sonner";
import { FileText, AlertTriangle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
  preview?: PreviewScores | null;
  previewLoading?: boolean;
  floatingGps?: ReactNode;
}

// ── Evidence checklist (redesigned) ──────────────────────────────────────────

type ChecklistField =
  | "evidenceChecklistElectricity"
  | "evidenceChecklistGasFuel"
  | "evidenceChecklistWater"
  | "evidenceChecklistWaste"
  | "evidenceChecklistEmployment"
  | "evidenceChecklistSupplier"
  | "evidenceChecklistBooking"
  | "evidenceChecklistOwnership"
  | "evidenceChecklistP3";

function CheckRow({
  label,
  checked,
  onChange,
  indicator,
  impact,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  indicator?: string;
  impact?: string;
}) {
  return (
    <label className="flex items-center gap-3 px-4 py-3 border-b border-border/40 last:border-b-0 cursor-pointer hover:bg-muted/20 transition-colors">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="shrink-0 accent-primary w-4 h-4"
      />
      <span className="flex-1 text-sm">{label}</span>
      {impact && (
        <span className="text-xs text-orange-500 tabular-nums shrink-0">{impact}</span>
      )}
      {indicator && (
        <span className="text-xs text-black tabular-nums shrink-0 w-5 text-right">{indicator}</span>
      )}
    </label>
  );
}

function SectionCard({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-black">{title}</span>
        <span className="text-[10px] text-black">{badge}</span>
      </div>
      {children}
    </div>
  );
}

export function EvidenceChecklistStep({ data, updateField, shell, preview, previewLoading, floatingGps }: StepProps) {
  const t = useTranslations("onboarding.evidence.checklist");
  const p1Rows: Array<{ label: string; field: ChecklistField; indicator: string }> = [
    { label: t("electricityBills"), field: "evidenceChecklistElectricity", indicator: "1A" },
    { label: t("gasFuelRecords"), field: "evidenceChecklistGasFuel", indicator: "1B" },
    { label: t("waterBills"), field: "evidenceChecklistWater", indicator: "1B" },
    { label: t("wasteRecords"), field: "evidenceChecklistWaste", indicator: "1C" },
  ];
  const p2Rows: Array<{ label: string; field: ChecklistField; indicator: string }> = [
    { label: t("staffHeadcount"), field: "evidenceChecklistEmployment", indicator: "2A" },
    { label: t("suppliersList"), field: "evidenceChecklistSupplier", indicator: "2B" },
    { label: t("bookingChannel"), field: "evidenceChecklistBooking", indicator: "2C" },
    { label: t("ownershipStructure"), field: "evidenceChecklistOwnership", indicator: "2D" },
  ];
  const detailedRows = [
    t("monthlyEnergyLog"),
    t("wasteWeightRecords"),
    t("payrollSummary"),
    t("procurementInvoices"),
  ];
  const p3Rows: Array<{ label: string; indicator?: string }> = [
    { label: t("partnershipAgreement"), indicator: "3A" },
    { label: t("partnerVegetationReport"), indicator: "3B" },
    { label: t("programmeBudget") },
    { label: t("resultsEvidence") },
  ];
  const showP3 = data.p3Status === "A" || data.p3Status === "B" || data.p3Status === "C";
  const detailedChecked: boolean[] = data.evidenceDetailedChecked ?? detailedRows.map(() => false);
  const p3Checked: boolean[] = data.evidenceP3Checked ?? p3Rows.map(() => false);

  const coreCount =
    (data.evidenceChecklistElectricity ? 1 : 0) +
    (data.evidenceChecklistGasFuel ? 1 : 0) +
    (data.evidenceChecklistWater ? 1 : 0) +
    (data.evidenceChecklistWaste ? 1 : 0) +
    (data.evidenceChecklistEmployment ? 1 : 0) +
    (data.evidenceChecklistSupplier ? 1 : 0) +
    (data.evidenceChecklistBooking ? 1 : 0) +
    (data.evidenceChecklistOwnership ? 1 : 0);
  const detailedCount = detailedChecked.filter(Boolean).length;
  const p3Count = showP3 ? p3Checked.filter(Boolean).length : 0;
  const totalChecked = coreCount + detailedCount + p3Count;
  const totalDocs = 8 + 4 + (showP3 ? 4 : 0);

  const topIcon = (
    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
      <FileText className="w-6 h-6 text-black" />
    </div>
  );

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
      topIcon={topIcon}
    >
      {floatingGps}

      {/* Live GPS preview card */}
      {previewLoading ? (
        <div className="rounded-xl border bg-card px-5 py-4 space-y-3 animate-pulse">
          <div className="h-3 w-32 rounded bg-muted mx-auto" />
          <div className="h-10 w-16 rounded bg-muted mx-auto" />
          <div className="h-3 w-24 rounded bg-muted mx-auto" />
          <div className="flex justify-around">
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
            <div className="h-3 w-12 rounded bg-muted" />
          </div>
        </div>
      ) : preview ? (
        <div className="rounded-xl border bg-card px-5 py-4 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-black text-center">
            {t("liveGpsTitle")}
          </p>
          <div className="text-center">
            <p className="text-4xl font-bold tabular-nums">{Math.round(preview.gpsScore)}</p>
            <p className="text-xs text-black mt-0.5">{t("notYetPublished")}</p>
          </div>
          <div className="flex items-center justify-around text-sm tabular-nums">
            <span>P1 <strong>{preview.pillar1Score.toFixed(1)}</strong></span>
            <span>P2 <strong>{preview.pillar2Score.toFixed(1)}</strong></span>
            <span>P3 <strong>{preview.pillar3Score.toFixed(0)}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 justify-center text-xs text-orange-500">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{t("missingEvidenceWarning")}</span>
          </div>
        </div>
      ) : null}

      {/* Document count */}
      <div className="rounded-xl border bg-card px-4 py-4 flex items-center gap-4">
        <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center shrink-0">
          <span className="text-base font-bold tabular-nums">{totalChecked}</span>
        </div>
        <div>
          <p className="text-sm font-medium">{t("documentsReady", { count: totalChecked, total: totalDocs })}</p>
          <p className="text-xs text-black">{t("documentsNote")}</p>
        </div>
      </div>

      {/* Section 1: Operational Footprint */}
      <SectionCard title={t("p1SectionTitle")} badge={t("p1Badge")}>
        {p1Rows.map((row) => (
          <CheckRow
            key={row.field}
            label={row.label}
            checked={data[row.field] === true}
            onChange={(v) => updateField({ [row.field]: v })}
            impact="+0.25"
            indicator={row.indicator}
          />
        ))}
      </SectionCard>

      {/* Section 2: Local Integration */}
      <SectionCard title={t("p2SectionTitle")} badge={t("p2Badge")}>
        {p2Rows.map((row) => (
          <CheckRow
            key={row.field}
            label={row.label}
            checked={data[row.field] === true}
            onChange={(v) => updateField({ [row.field]: v })}
            impact="+0.25"
            indicator={row.indicator}
          />
        ))}
      </SectionCard>

      {/* Section 3: Detailed Verification */}
      <SectionCard title={t("detailedTitle")} badge={t("detailedBadge")}>
        {detailedRows.map((label, i) => (
          <CheckRow
            key={label}
            label={label}
            checked={detailedChecked[i] ?? false}
            onChange={(v) => {
              const next = detailedChecked.map((c, j) => j === i ? v : c);
              updateField({ evidenceDetailedChecked: next });
            }}
          />
        ))}
      </SectionCard>

      {/* Section 4: Contribution Programme (if applicable) */}
      {showP3 && (
        <SectionCard title={t("p3SectionTitle")} badge={t("p3Badge")}>
          {p3Rows.map((row, i) => (
            <CheckRow
              key={row.label}
              label={row.label}
              checked={p3Checked[i] ?? false}
              onChange={(v) => {
                const next = p3Checked.map((c, j) => j === i ? v : c);
                updateField({ evidenceP3Checked: next, evidenceChecklistP3: next.some(Boolean) });
              }}
              indicator={row.indicator}
            />
          ))}
        </SectionCard>
      )}

      {/* Info note */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 space-y-1.5">
        <p className="text-xs text-black leading-relaxed">
          <span className="text-foreground font-medium">{t("evidenceQualityNote")}</span>{" "}
          {t("evidenceQualityDetail")}
        </p>
        <p className="text-xs text-black leading-relaxed">
          {t("uncheckedNote")}
        </p>
      </div>

      <PrivacyBadge />
    </StepShell>
  );
}

// ── Evidence Upload ───────────────────────────────────────────────────────────

interface EvidenceUploadProps extends StepProps {
  evidenceData: {
    evidence?: Array<{
      id: string;
      indicatorId: string;
      tier: "T1" | "T2" | "T3" | "Proxy";
      fileName: string;
      checksum: string;
      verificationState: string;
    }>;
    latestAssessmentSnapshotId?: string | null;
  } | undefined;
}

export function EvidenceUploadStep({
  data,
  updateField,
  shell,
  evidenceData,
}: EvidenceUploadProps) {
  const t = useTranslations("onboarding.evidence.upload");
  const locale = useLocale();
  const withLocale = (path: string) => (locale === "en" ? path : `/${locale}${path}`);
  const queryClient = useQueryClient();
  const [evidenceForm, setEvidenceForm] = useState({
    indicatorId: "",
    tier: "T1" as "T1" | "T2" | "T3" | "Proxy",
    fileName: "",
    storagePath: "",
    checksum: "",
  });
  const [evidenceSubmitting, setEvidenceSubmitting] = useState(false);

  const uploadedEvidence = evidenceData?.evidence ?? [];
  const latestSnapshotId = evidenceData?.latestAssessmentSnapshotId ?? null;
  const selectedChecksums = new Set((data.evidenceRefs ?? []).map((r) => r.checksum));

  const toggleEvidence = (ev: (typeof uploadedEvidence)[0]) => {
    const current = data.evidenceRefs ?? [];
    if (selectedChecksums.has(ev.checksum)) {
      updateField({ evidenceRefs: current.filter((r) => r.checksum !== ev.checksum) });
    } else {
      updateField({
        evidenceRefs: [
          ...current,
          {
            indicatorId: ev.indicatorId,
            tier: ev.tier,
            checksum: ev.checksum,
            verificationState: "pending" as const,
          },
        ],
      });
    }
  };

  const handleEvidenceFileSubmit = async () => {
    if (!latestSnapshotId || !evidenceForm.indicatorId || !evidenceForm.fileName || !evidenceForm.storagePath || !evidenceForm.checksum) {
      toast.error(t("completeAllFields"));
      return;
    }
    setEvidenceSubmitting(true);
    try {
      const res = await fetch("/api/v1/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentSnapshotId: latestSnapshotId, ...evidenceForm }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? t("submissionFailed"));
        return;
      }
      toast.success(t("submissionSuccess"));
      setEvidenceForm({ indicatorId: "", tier: "T1", fileName: "", storagePath: "", checksum: "" });
      queryClient.invalidateQueries({ queryKey: ["operator-evidence"] });
    } catch {
      toast.error(t("submissionRequestFailed"));
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {uploadedEvidence.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
          <p className="text-sm font-medium">{t("noFilesTitle")}</p>
          <p className="text-xs text-black">
            {t("noFilesDescPrefix")}{" "}
            <Link
              href={withLocale("/operator/evidence")}
              className="text-primary underline"
              target="_blank"
            >
              {t("evidenceManagement")}
            </Link>{" "}
            {t("noFilesDescSuffix")}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {uploadedEvidence.map((ev) => {
            const selected = selectedChecksums.has(ev.checksum);
            const label = INDICATOR_LABELS[ev.indicatorId] ?? ev.indicatorId;
            return (
              <button
                key={ev.id}
                onClick={() => toggleEvidence(ev)}
                className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                  selected ? "border-foreground bg-secondary" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium truncate">{ev.fileName}</p>
                    <p className="text-sm text-black mt-0.5">{label}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                        ev.tier === "T1"
                          ? "border-primary/40 text-primary bg-secondary"
                          : ev.tier === "T2"
                          ? "border-amber-300 text-amber-700 bg-amber-50"
                          : ev.tier === "T3"
                          ? "border-blue-300 text-blue-700 bg-blue-50"
                          : "border-border text-black"
                      }`}
                    >
                      {ev.tier}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border ${
                        ev.verificationState === "verified"
                          ? "border-primary/40 text-primary"
                          : "border-border text-black"
                      }`}
                    >
                      {ev.verificationState}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <p className="text-xs text-black pt-1">
            {t("filesLinked", {
              selected: selectedChecksums.size,
              total: uploadedEvidence.length,
              plural: uploadedEvidence.length !== 1 ? "s" : "",
            })}
          </p>
        </div>
      )}

      {/* Inline evidence upload */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold">{t("addEvidenceTitle")}</p>
        {!latestSnapshotId ? (
          <p className="text-xs text-black">
            {t("noSnapshotDescPrefix")}{" "}
            <Link
              href={withLocale("/operator/evidence")}
              className="text-primary underline"
              target="_blank"
            >
              {t("evidenceManagement")}
            </Link>
            {t("noSnapshotDescSuffix")}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label={t("indicatorLabel")}>
                <select
                  value={evidenceForm.indicatorId}
                  onChange={(e) =>
                    setEvidenceForm((f) => ({ ...f, indicatorId: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">{t("selectIndicator")}</option>
                  {Object.entries(INDICATOR_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label={t("tierLabel")}>
                <select
                  value={evidenceForm.tier}
                  onChange={(e) =>
                    setEvidenceForm((f) => ({
                      ...f,
                      tier: e.target.value as "T1" | "T2" | "T3" | "Proxy",
                    }))
                  }
                  className={inputCls}
                >
                  <option value="T1">{t("t1Primary")}</option>
                  <option value="T2">{t("t2Secondary")}</option>
                  <option value="T3">{t("t3Institutional")}</option>
                  <option value="Proxy">{t("proxy")}</option>
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label={t("fileNameLabel")}>
              <input
                type="text"
                value={evidenceForm.fileName}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, fileName: e.target.value }))
                }
                className={inputCls}
                placeholder={t("fileNamePlaceholder")}
              />
            </FieldGroup>
            <FieldGroup label={t("storagePathLabel")} hint={t("storagePathHint")}>
              <input
                type="text"
                value={evidenceForm.storagePath}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, storagePath: e.target.value }))
                }
                className={inputCls}
                placeholder={t("storagePathPlaceholder")}
              />
            </FieldGroup>
            <FieldGroup label={t("checksumLabel")} hint={t("checksumHint")}>
              <input
                type="text"
                value={evidenceForm.checksum}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, checksum: e.target.value }))
                }
                className={inputCls}
                placeholder={t("checksumPlaceholder")}
              />
            </FieldGroup>
            <button
              onClick={handleEvidenceFileSubmit}
              disabled={evidenceSubmitting}
              className="w-full rounded-lg border-2 border-primary bg-secondary py-2 text-sm font-medium text-primary hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {evidenceSubmitting ? t("submitting") : t("submitButton")}
            </button>
          </div>
        )}
      </div>
    </StepShell>
  );
}

// ── Delta / Prior Cycle ───────────────────────────────────────────────────────

interface DeltaStepProps extends StepProps {
  priorScore: {
    gpsScore: number;
    pillar1Score: number;
    pillar2Score: number;
    pillar3Score: number;
    methodologyVersion: string;
    createdAt: string;
  } | null;
  priorLoading: boolean;
}

export function DeltaStep({
  data,
  updateField,
  shell,
  priorScore,
  priorLoading,
}: DeltaStepProps) {
  const t = useTranslations("onboarding.evidence.delta");
  return (
    <StepShell
      {...shell}
      title={t("stepTitle")}
      subtitle={t("stepSubtitle")}
    >
      {priorLoading ? (
        <div className="rounded-xl border bg-muted/30 p-5 animate-pulse">
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
      ) : !priorScore ? (
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="text-sm text-black">
            {t("noPriorCycle")}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">{t("previousAssessment")}</p>
              <p className="text-xs text-black">
                {new Date(priorScore.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-black">{t("gpsTotal")}</span>
              <span className="font-bold tabular-nums">{Math.round(priorScore.gpsScore)}</span>
              <span className="text-black">{t("p1Footprint")}</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar1Score)}</span>
              <span className="text-black">{t("p2Integration")}</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar2Score)}</span>
              <span className="text-black">{t("p3Regenerative")}</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar3Score)}</span>
              <span className="text-black">{t("methodology")}</span>
              <span className="font-mono text-xs">{priorScore.methodologyVersion}</span>
            </div>
          </div>
          <FieldGroup
            label={t("majorChanges")}
            hint={t("majorChangesHint")}
          >
            <textarea
              value={data.deltaExplanation ?? ""}
              onChange={(e) =>
                updateField({ deltaExplanation: e.target.value || undefined })
              }
              className={inputCls + " min-h-[120px] resize-y"}
              placeholder={t("majorChangesPlaceholder")}
            />
          </FieldGroup>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-black">
              {t("dpsNote")}
            </p>
          </div>
        </div>
      )}
    </StepShell>
  );
}
