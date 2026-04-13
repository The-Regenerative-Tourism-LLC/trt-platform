"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";
import {
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  ArrowLeft,
  HelpCircle,
  Paperclip,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

type EvidenceTier = "T1" | "T2" | "T3" | "Proxy";
type VerificationState = "pending" | "verified" | "rejected" | "lapsed";

interface EvidenceRef {
  id: string;
  indicatorId: string;
  tier: EvidenceTier;
  fileName: string;
  checksum: string;
  verificationState: VerificationState;
  submittedAt: string;
  verifiedAt: string | null;
  assessmentSnapshotId: string;
}

interface EvidenceApiResponse {
  operatorId: string;
  latestAssessmentSnapshotId: string | null;
  evidence: EvidenceRef[];
}

interface IndicatorDef {
  id: string;
  label: string;
  hint: string;
  tier: EvidenceTier;
}

interface PillarGroup {
  pillar: string;
  name: string;
  indicators: IndicatorDef[];
}

const PILLAR_GROUPS: PillarGroup[] = [
  {
    pillar: "P1",
    name: "Operational Footprint",
    indicators: [
      {
        id: "p1_1a_energy_intensity",
        label: "Energy Intensity",
        hint: "kWh per guest-night from utility bills or meter readings",
        tier: "T1",
      },
      {
        id: "p1_1a_renewable_pct",
        label: "Renewable Energy %",
        hint: "Certificate from energy supplier or solar installation invoice",
        tier: "T1",
      },
      {
        id: "p1_1b_water_intensity",
        label: "Water Intensity",
        hint: "Litres per guest-night from water bills or meter readings",
        tier: "T1",
      },
      {
        id: "p1_1c_waste_diversion_pct",
        label: "Waste Diversion",
        hint: "Waste audit report or recycling service contract",
        tier: "T1",
      },
      {
        id: "p1_1d_carbon_intensity",
        label: "Carbon Intensity",
        hint: "Carbon footprint report or emissions calculation",
        tier: "T1",
      },
      {
        id: "p1_1e_site_score",
        label: "Site & Land Use",
        hint: "Site management plan or ecological assessment",
        tier: "T2",
      },
    ],
  },
  {
    pillar: "P2",
    name: "Local Integration",
    indicators: [
      {
        id: "p2_2a_local_employment_rate",
        label: "Local Employment",
        hint: "Payroll records showing employee residency",
        tier: "T1",
      },
      {
        id: "p2_2a_employment_quality",
        label: "Employment Quality",
        hint: "Contracts, benefits documentation, training records",
        tier: "T2",
      },
      {
        id: "p2_2b_local_fb_rate",
        label: "Local F&B Sourcing",
        hint: "Supplier invoices showing local food & beverage purchases",
        tier: "T1",
      },
      {
        id: "p2_2b_local_nonfb_rate",
        label: "Local Non-F&B Sourcing",
        hint: "Supplier invoices for local services and materials",
        tier: "T1",
      },
      {
        id: "p2_2c_direct_booking_rate",
        label: "Direct Booking Rate",
        hint: "Booking channel report from PMS or OTA dashboard",
        tier: "T1",
      },
      {
        id: "p2_2d_community_score",
        label: "Community Engagement",
        hint: "Community programme documentation or meeting minutes",
        tier: "T2",
      },
    ],
  },
  {
    pillar: "P3",
    name: "Regenerative Contribution",
    indicators: [
      {
        id: "p3_3a_contribution_programme",
        label: "Contribution Programme",
        hint: "Programme description, budget, and impact measurement",
        tier: "T3",
      },
    ],
  },
];

const ALL_INDICATORS = PILLAR_GROUPS.flatMap((g) => g.indicators);

async function fetchEvidence(): Promise<EvidenceApiResponse> {
  const r = await apiFetch("/api/v1/operator/evidence");
  if (!r.ok) throw Object.assign(new Error("Failed to fetch evidence"), { status: r.status });
  return r.json();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function UploadButton({
  indicatorId,
  tier,
  assessmentSnapshotId,
  onUploaded,
}: {
  indicatorId: string;
  tier: EvidenceTier;
  assessmentSnapshotId: string | null;
  onUploaded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!assessmentSnapshotId) {
      toast.error("No assessment snapshot found. Complete an assessment first.");
      return;
    }

    setUploading(true);
    try {
      const fileBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest("SHA-256", fileBuffer);
      const checksumHex = Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const presignRes = await fetch("/api/v1/storage/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceType: "evidence",
          contentType: file.type,
          sizeBytes: file.size,
          checksum: checksumHex,
        }),
      });
      if (!presignRes.ok) {
        const body = await presignRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to get upload URL");
      }
      const { key, signedUrl } = await presignRes.json();

      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: new Blob([fileBuffer], { type: file.type }),
      });
      if (!uploadRes.ok) throw new Error("File upload failed");

      const confirmRes = await fetch("/api/v1/evidence/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          checksum: checksumHex,
          assessmentSnapshotId,
          indicatorId,
          tier,
        }),
      });
      if (!confirmRes.ok) {
        const body = await confirmRes.json().catch(() => ({}));
        throw new Error(body?.error ?? "Failed to register evidence");
      }

      toast.success("Evidence uploaded successfully");
      onUploaded();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={uploading || !assessmentSnapshotId}
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a1a] text-white text-sm font-medium hover:bg-[#333] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {uploading ? (
          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </>
  );
}

export function EvidenceClient() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [expandedPillars, setExpandedPillars] = useState<string[]>(["P1", "P2", "P3"]);

  const { data, isLoading } = useQuery({
    queryKey: ["operator-evidence"],
    queryFn: fetchEvidence,
    enabled: !!user,
  });

  function togglePillar(pillar: string) {
    setExpandedPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  }

  function invalidateEvidence() {
    queryClient.invalidateQueries({ queryKey: ["operator-evidence"] });
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const evidence = data?.evidence ?? [];
  const assessmentSnapshotId = data?.latestAssessmentSnapshotId ?? null;

  const evidenceByIndicator = new Map<string, EvidenceRef[]>();
  for (const e of evidence) {
    const existing = evidenceByIndicator.get(e.indicatorId) ?? [];
    existing.push(e);
    evidenceByIndicator.set(e.indicatorId, existing);
  }

  const totalCount = ALL_INDICATORS.length;
  const verifiedCount = ALL_INDICATORS.filter((ind) =>
    evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "verified")
  ).length;
  const pendingCount = ALL_INDICATORS.filter(
    (ind) =>
      evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "pending") &&
      !evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "verified")
  ).length;
  const missingCount = totalCount - verifiedCount - pendingCount;
  const coveragePct = Math.round((verifiedCount / totalCount) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/operator/dashboard"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Evidence</h1>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
          Upload documents to verify your assessment data. Higher-tier evidence improves your score
          confidence.
        </p>
      </div>

      {/* Coverage card */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Evidence coverage</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {verifiedCount} of {totalCount} indicators
          </span>
        </div>
        <Progress value={coveragePct} className="h-1.5" />
        <div className="flex items-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-foreground" />
            {verifiedCount} verified
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            {pendingCount} pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-muted-foreground/40 bg-transparent" />
            {missingCount} missing
          </span>
        </div>
      </div>

      {/* Help box */}
      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold">Not sure what to upload?</span>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">📎 Upload any document you have</span> —
          utility invoices, supplier receipts, contracts, meter readings, screenshots, or even photos
          of paper records. We accept any format (PDF, images, spreadsheets).
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-medium text-foreground">😊 Prefer in-person verification?</span> —
          If you&apos;re not comfortable sharing documents online, we can arrange a visit to review
          your records on-site. Contact us after submission and we&apos;ll coordinate a time that
          works for you.
        </p>
      </div>

      {/* No snapshot warning */}
      {!assessmentSnapshotId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            No assessment snapshot found. Complete an assessment before uploading evidence.
          </p>
          <Link
            href="/operator/onboarding"
            className="ml-auto text-sm font-medium text-amber-800 underline underline-offset-2 hover:no-underline whitespace-nowrap"
          >
            Start Assessment
          </Link>
        </div>
      )}

      {/* Pillar sections */}
      {PILLAR_GROUPS.map((group) => {
        const isExpanded = expandedPillars.includes(group.pillar);
        const groupVerified = group.indicators.filter((ind) =>
          evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "verified")
        ).length;

        return (
          <div key={group.pillar} className="rounded-xl border bg-card overflow-hidden">
            {/* Pillar header */}
            <button
              type="button"
              onClick={() => togglePillar(group.pillar)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {group.pillar === "P1" ? "P1" : group.pillar === "P2" ? "👤" : "🌱"}
                </div>
                <div>
                  <p className="text-sm font-semibold">
                    {group.pillar} — {group.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {groupVerified} of {group.indicators.length} covered
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Indicator rows */}
            {isExpanded && (
              <div className="border-t divide-y">
                {group.indicators.map((ind) => {
                  const indEvidence = (evidenceByIndicator.get(ind.id) ?? []).sort(
                    (a, b) =>
                      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                  );
                  const latest = indEvidence[0];
                  const state = latest?.verificationState;

                  return (
                    <div
                      key={ind.id}
                      className="flex items-center justify-between px-5 py-4 gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold leading-snug">{ind.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                          {ind.hint}
                        </p>
                        {latest && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1.5">
                            {state === "verified" && (
                              <CheckCircle2 className="h-3 w-3 text-green-600 shrink-0" />
                            )}
                            {state === "pending" && (
                              <Clock className="h-3 w-3 text-amber-500 shrink-0" />
                            )}
                            {state === "rejected" && (
                              <XCircle className="h-3 w-3 text-destructive shrink-0" />
                            )}
                            {state === "lapsed" && (
                              <AlertTriangle className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                            )}
                            <Paperclip className="h-3 w-3 shrink-0" />
                            <span className="truncate max-w-[220px]">{latest.fileName}</span>
                            <span className="shrink-0">· {formatDate(latest.submittedAt)}</span>
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <UploadButton
                          indicatorId={ind.id}
                          tier={ind.tier}
                          assessmentSnapshotId={assessmentSnapshotId}
                          onUploaded={invalidateEvidence}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
