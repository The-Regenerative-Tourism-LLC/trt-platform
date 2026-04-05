"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import type { OnboardingData } from "@/store/onboarding-store";
import type { StepShellBaseProps } from "../shell";
import { StepShell } from "../shell";
import { FieldGroup, NumberInput, inputCls } from "../primitives";
import { INDICATOR_LABELS } from "@/lib/constants";
import { toast } from "sonner";

interface StepProps {
  data: OnboardingData;
  updateField: (patch: Partial<OnboardingData>) => void;
  shell: StepShellBaseProps;
}

// ── Evidence checklist (confirmation only) ───────────────────────────────────

const CHECKLIST_ROWS: Array<{
  label: string;
  field:
    | "evidenceChecklistElectricity"
    | "evidenceChecklistGasFuel"
    | "evidenceChecklistWater"
    | "evidenceChecklistWaste"
    | "evidenceChecklistEmployment"
    | "evidenceChecklistSupplier"
    | "evidenceChecklistBooking"
    | "evidenceChecklistOwnership"
    | "evidenceChecklistP3";
}> = [
  { label: "Electricity bills (or equivalent)", field: "evidenceChecklistElectricity" },
  { label: "Gas / fuel records", field: "evidenceChecklistGasFuel" },
  { label: "Water bills / meter data", field: "evidenceChecklistWater" },
  { label: "Waste records", field: "evidenceChecklistWaste" },
  { label: "Employment documents (where applicable)", field: "evidenceChecklistEmployment" },
  { label: "Supplier invoices (procurement)", field: "evidenceChecklistSupplier" },
  { label: "Booking / revenue breakdown", field: "evidenceChecklistBooking" },
  { label: "Ownership documents", field: "evidenceChecklistOwnership" },
  { label: "P3 programme documentation (if applicable)", field: "evidenceChecklistP3" },
];

export function EvidenceChecklistStep({ data, updateField, shell }: StepProps) {
  const showP3 = data.p3Status === "A" || data.p3Status === "B" || data.p3Status === "C";

  return (
    <StepShell
      {...shell}
      title="Evidence checklist"
      subtitle="Tick the documents you have ready to support your assessment. You can upload them to your dashboard after submission."
    >
      <div className="space-y-3">
        {CHECKLIST_ROWS.filter((row) => row.field !== "evidenceChecklistP3" || showP3).map(
          (row) => (
            <label
              key={row.field}
              className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:bg-muted/30 transition-colors"
            >
              <input
                type="checkbox"
                checked={data[row.field] === true}
                onChange={(e) => updateField({ [row.field]: e.target.checked })}
                className="mt-0.5 accent-primary shrink-0"
              />
              <span className="text-sm leading-snug">{row.label}</span>
            </label>
          )
        )}
      </div>
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
      toast.error("Please complete all evidence fields");
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
        toast.error(json.error ?? "Evidence submission failed");
        return;
      }
      toast.success("Evidence file added");
      setEvidenceForm({ indicatorId: "", tier: "T1", fileName: "", storagePath: "", checksum: "" });
      queryClient.invalidateQueries({ queryKey: ["operator-evidence"] });
    } catch {
      toast.error("Failed to submit evidence");
    } finally {
      setEvidenceSubmitting(false);
    }
  };

  return (
    <StepShell
      {...shell}
      title="Evidence"
      subtitle="Link supporting documents to this assessment. Evidence is optional — T3 files must be verified before P3 scores are published."
    >
      {uploadedEvidence.length === 0 ? (
        <div className="rounded-xl border bg-muted/30 p-5 space-y-2">
          <p className="text-sm font-medium">No evidence files available yet</p>
          <p className="text-xs text-muted-foreground">
            Use{" "}
            <Link
              href="/operator/evidence"
              className="text-primary underline"
              target="_blank"
            >
              Evidence Management
            </Link>{" "}
            to upload files, then return here to link them to this assessment.
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
                    <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
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
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {ev.tier}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded border ${
                        ev.verificationState === "verified"
                          ? "border-primary/40 text-primary"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {ev.verificationState}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
          <p className="text-xs text-muted-foreground pt-1">
            {selectedChecksums.size} of {uploadedEvidence.length} file
            {uploadedEvidence.length !== 1 ? "s" : ""} linked
          </p>
        </div>
      )}

      {/* Inline evidence upload */}
      <div className="rounded-xl border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold">Add evidence file</p>
        {!latestSnapshotId ? (
          <p className="text-xs text-muted-foreground">
            Evidence files can be added after your first submission. You may also pre-register them
            in{" "}
            <Link
              href="/operator/evidence"
              className="text-primary underline"
              target="_blank"
            >
              Evidence Management
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Indicator">
                <select
                  value={evidenceForm.indicatorId}
                  onChange={(e) =>
                    setEvidenceForm((f) => ({ ...f, indicatorId: e.target.value }))
                  }
                  className={inputCls}
                >
                  <option value="">— Select indicator —</option>
                  {Object.entries(INDICATOR_LABELS).map(([id, label]) => (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Tier">
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
                  <option value="T1">T1 — Primary</option>
                  <option value="T2">T2 — Secondary</option>
                  <option value="T3">T3 — Institutional</option>
                  <option value="Proxy">Proxy</option>
                </select>
              </FieldGroup>
            </div>
            <FieldGroup label="File name">
              <input
                type="text"
                value={evidenceForm.fileName}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, fileName: e.target.value }))
                }
                className={inputCls}
                placeholder="e.g. energy_bill_jan_2024.pdf"
              />
            </FieldGroup>
            <FieldGroup label="Storage path" hint="Path or URL in your document storage.">
              <input
                type="text"
                value={evidenceForm.storagePath}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, storagePath: e.target.value }))
                }
                className={inputCls}
                placeholder="documents/energy/bill_jan_2024.pdf"
              />
            </FieldGroup>
            <FieldGroup label="Checksum (SHA-256)" hint="File integrity hash for audit trail.">
              <input
                type="text"
                value={evidenceForm.checksum}
                onChange={(e) =>
                  setEvidenceForm((f) => ({ ...f, checksum: e.target.value }))
                }
                className={inputCls}
                placeholder="abc123…"
              />
            </FieldGroup>
            <button
              onClick={handleEvidenceFileSubmit}
              disabled={evidenceSubmitting}
              className="w-full rounded-lg border-2 border-primary bg-secondary py-2 text-sm font-medium text-primary hover:bg-secondary/80 disabled:opacity-50 transition-colors"
            >
              {evidenceSubmitting ? "Submitting…" : "Add evidence file"}
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
  return (
    <StepShell
      {...shell}
      title="Directional change"
      subtitle="Compare this cycle's performance to your prior assessment."
    >
      {priorLoading ? (
        <div className="rounded-xl border bg-muted/30 p-5 animate-pulse">
          <div className="h-4 w-40 rounded bg-muted" />
        </div>
      ) : !priorScore ? (
        <div className="rounded-xl border bg-muted/30 p-5">
          <p className="text-sm text-muted-foreground">
            No prior cycle found. Delta comparison will be available from Cycle 2 onwards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5 space-y-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">Previous assessment</p>
              <p className="text-xs text-muted-foreground">
                {new Date(priorScore.createdAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <span className="text-muted-foreground">GPS total</span>
              <span className="font-bold tabular-nums">{Math.round(priorScore.gpsScore)}</span>
              <span className="text-muted-foreground">P1 — Footprint</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar1Score)}</span>
              <span className="text-muted-foreground">P2 — Integration</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar2Score)}</span>
              <span className="text-muted-foreground">P3 — Regenerative</span>
              <span className="tabular-nums">{Math.round(priorScore.pillar3Score)}</span>
              <span className="text-muted-foreground">Methodology</span>
              <span className="font-mono text-xs">{priorScore.methodologyVersion}</span>
            </div>
          </div>
          <FieldGroup
            label="Major changes since last cycle"
            hint="Optional. Describe significant changes to operations, programmes, or infrastructure."
          >
            <textarea
              value={data.deltaExplanation ?? ""}
              onChange={(e) =>
                updateField({ deltaExplanation: e.target.value || undefined })
              }
              className={inputCls + " min-h-[120px] resize-y"}
              placeholder="e.g. Installed a 40 kW solar array, reducing energy intensity by ~30%. Added two new local F&B suppliers…"
            />
          </FieldGroup>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">
              The Delta Performance Score (DPS) is computed automatically from your locked Cycle 1
              baseline. You do not need to calculate it manually.
            </p>
          </div>
        </div>
      )}
    </StepShell>
  );
}
