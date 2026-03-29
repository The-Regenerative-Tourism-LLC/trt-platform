"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import {
  Upload,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Paperclip,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

interface PillarIndicator {
  id: string;
  label: string;
  tier: EvidenceTier;
}

interface PillarGroup {
  pillar: string;
  name: string;
  weight: string;
  colorClass: string;
  indicators: PillarIndicator[];
}

const PILLAR_GROUPS: PillarGroup[] = [
  {
    pillar: "P1",
    name: "Operational Footprint",
    weight: "40%",
    colorClass: "bg-emerald-500",
    indicators: [
      { id: "p1_1a_energy_intensity", label: "1A Energy Intensity", tier: "T1" },
      { id: "p1_1a_renewable_pct", label: "1A Renewable Share", tier: "T1" },
      { id: "p1_1b_water_intensity", label: "1B Water Intensity", tier: "T1" },
      { id: "p1_1b_recirculation_score", label: "1B Water Recirculation", tier: "T2" },
      { id: "p1_1c_waste_diversion_pct", label: "1C Waste Diversion", tier: "T1" },
      { id: "p1_1d_carbon_intensity", label: "1D Carbon Intensity", tier: "T1" },
      { id: "p1_1e_site_score", label: "1E Site & Land Use", tier: "T2" },
    ],
  },
  {
    pillar: "P2",
    name: "Local Integration",
    weight: "30%",
    colorClass: "bg-amber-500",
    indicators: [
      { id: "p2_2a_local_employment_rate", label: "2A Local Employment", tier: "T1" },
      { id: "p2_2a_employment_quality", label: "2A Employment Quality", tier: "T2" },
      { id: "p2_2b_local_fb_rate", label: "2B Local F&B Procurement", tier: "T1" },
      { id: "p2_2b_local_nonfb_rate", label: "2B Non-F&B Procurement", tier: "T1" },
      { id: "p2_2c_direct_booking_rate", label: "2C Direct Booking Rate", tier: "T1" },
      { id: "p2_2c_local_ownership_pct", label: "2C Local Ownership", tier: "T1" },
      { id: "p2_2d_community_score", label: "2D Community Integration", tier: "T2" },
    ],
  },
  {
    pillar: "P3",
    name: "Regenerative Contribution",
    weight: "30%",
    colorClass: "bg-teal-500",
    indicators: [
      { id: "p3_3a_category_scope", label: "3A Category & Scope", tier: "T3" },
      { id: "p3_3b_traceability", label: "3B Institutional Traceability", tier: "T3" },
      { id: "p3_3c_additionality", label: "3C Additionality", tier: "T3" },
      { id: "p3_3d_continuity", label: "3D Continuity & Commitment", tier: "T3" },
    ],
  },
];

const TIER_INFO: Record<EvidenceTier, { label: string; color: string }> = {
  T1: { label: "T1 Primary", color: "bg-emerald-100 text-emerald-800" },
  T2: { label: "T2 Secondary", color: "bg-blue-100 text-blue-800" },
  T3: { label: "T3 Institutional", color: "bg-teal-100 text-teal-800" },
  Proxy: { label: "Proxy", color: "bg-purple-100 text-purple-800" },
};

const STATE_ICON: Record<VerificationState, { icon: typeof CheckCircle2; color: string }> = {
  pending: { icon: Clock, color: "text-amber-500" },
  verified: { icon: CheckCircle2, color: "text-emerald-500" },
  rejected: { icon: XCircle, color: "text-red-500" },
  lapsed: { icon: AlertTriangle, color: "text-zinc-400" },
};

function fetchEvidence(): Promise<EvidenceApiResponse> {
  return fetch("/api/v1/operator/evidence").then((r) => {
    if (!r.ok) throw new Error("Failed to fetch evidence");
    return r.json();
  });
}

interface UploadPayload {
  assessmentSnapshotId: string;
  indicatorId: string;
  tier: EvidenceTier;
  fileName: string;
  storagePath: string;
  checksum: string;
}

async function submitEvidence(
  payload: UploadPayload
): Promise<{ success: boolean; evidenceRefId: string }> {
  const res = await fetch("/api/v1/evidence", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Submission failed");
  }
  return res.json();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EvidenceClient() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [expandedPillars, setExpandedPillars] = useState<string[]>(["P1", "P2", "P3"]);
  const [uploadingIndicator, setUploadingIndicator] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["operator-evidence"],
    queryFn: fetchEvidence,
    enabled: !!user,
  });

  // Upload form state
  const [tier, setTier] = useState<EvidenceTier>("T1");
  const [fileName, setFileName] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [checksum, setChecksum] = useState("");

  const mutation = useMutation({
    mutationFn: submitEvidence,
    onSuccess: () => {
      toast.success("Evidence submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["operator-evidence"] });
      setUploadingIndicator(null);
      setFileName("");
      setStoragePath("");
      setChecksum("");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to submit evidence");
    },
  });

  function handleSubmit(indicatorId: string) {
    if (!data?.latestAssessmentSnapshotId) {
      toast.error("No assessment snapshot found.");
      return;
    }
    mutation.mutate({
      assessmentSnapshotId: data.latestAssessmentSnapshotId,
      indicatorId,
      tier,
      fileName: fileName.trim(),
      storagePath: storagePath.trim(),
      checksum: checksum.trim(),
    });
  }

  function togglePillar(pillar: string) {
    setExpandedPillars((prev) =>
      prev.includes(pillar) ? prev.filter((p) => p !== pillar) : [...prev, pillar]
    );
  }

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const evidence = data?.evidence ?? [];
  const evidenceByIndicator = new Map<string, EvidenceRef[]>();
  for (const e of evidence) {
    const existing = evidenceByIndicator.get(e.indicatorId) ?? [];
    existing.push(e);
    evidenceByIndicator.set(e.indicatorId, existing);
  }

  const allIndicators = PILLAR_GROUPS.flatMap((g) => g.indicators);
  const verified = allIndicators.filter((ind) =>
    evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "verified")
  ).length;
  const pending = allIndicators.filter((ind) =>
    evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "pending") &&
    !evidenceByIndicator.get(ind.id)?.some((e) => e.verificationState === "verified")
  ).length;
  const missing = allIndicators.length - verified - pending;
  const coveragePct = Math.round((verified / allIndicators.length) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Management</h1>
          <p className="text-muted-foreground mt-1">
            Submit and track supporting evidence for each assessment indicator.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/operator/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Coverage overview */}
      <Card>
        <CardContent className="py-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Evidence Coverage</p>
            <span className="text-sm tabular-nums font-bold">{coveragePct}%</span>
          </div>
          <Progress value={coveragePct} className="h-2" />
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {verified} verified
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {pending} pending
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-zinc-300" />
              {missing} missing
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Pillar-grouped indicators */}
      {PILLAR_GROUPS.map((group) => {
        const isExpanded = expandedPillars.includes(group.pillar);
        const groupEvidence = group.indicators.map((ind) => ({
          ...ind,
          evidence: evidenceByIndicator.get(ind.id) ?? [],
        }));
        const groupVerified = groupEvidence.filter((ind) =>
          ind.evidence.some((e) => e.verificationState === "verified")
        ).length;

        return (
          <Card key={group.pillar}>
            <button
              type="button"
              onClick={() => togglePillar(group.pillar)}
              className="w-full flex items-center justify-between p-5 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${group.colorClass}`} />
                <div>
                  <p className="font-semibold text-sm">
                    {group.pillar} — {group.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Weight: {group.weight} · {groupVerified}/{group.indicators.length} verified
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {isExpanded && (
              <div className="border-t">
                {groupEvidence.map((ind) => {
                  const latestEvidence = ind.evidence.sort(
                    (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
                  )[0];
                  const state = latestEvidence?.verificationState;
                  const StateInfo = state ? STATE_ICON[state] : null;
                  const isUploading = uploadingIndicator === ind.id;

                  return (
                    <div key={ind.id} className="border-b last:border-b-0">
                      <div className="flex items-center justify-between px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {StateInfo ? (
                            <StateInfo.icon className={`h-4 w-4 shrink-0 ${StateInfo.color}`} />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-dashed border-muted-foreground/30 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{ind.label}</p>
                            {latestEvidence && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Paperclip className="h-3 w-3" />
                                <span className="truncate max-w-[200px]">{latestEvidence.fileName}</span>
                                <span>· {formatDate(latestEvidence.submittedAt)}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className={`text-[10px] ${TIER_INFO[ind.tier].color}`}>
                            {TIER_INFO[ind.tier].label}
                          </Badge>
                          {state && (
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${
                                state === "verified"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : state === "pending"
                                    ? "bg-amber-50 text-amber-700"
                                    : state === "rejected"
                                      ? "bg-red-50 text-red-700"
                                      : "bg-zinc-50 text-zinc-500"
                              }`}
                            >
                              {state.charAt(0).toUpperCase() + state.slice(1)}
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            onClick={() =>
                              setUploadingIndicator(isUploading ? null : ind.id)
                            }
                          >
                            <Upload className="h-3 w-3 mr-1" />
                            {latestEvidence ? "Replace" : "Upload"}
                          </Button>
                        </div>
                      </div>

                      {/* Inline upload form */}
                      {isUploading && (
                        <div className="px-5 pb-4 bg-muted/30">
                          <div className="grid sm:grid-cols-2 gap-3 mb-3">
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">File Name</label>
                              <Input
                                value={fileName}
                                onChange={(e) => setFileName(e.target.value)}
                                placeholder="e.g. energy-bill-q1-2026.pdf"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Evidence Tier</label>
                              <select
                                value={tier}
                                onChange={(e) => setTier(e.target.value as EvidenceTier)}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                              >
                                <option value="T1">T1 — Primary verified data</option>
                                <option value="T2">T2 — Secondary data</option>
                                <option value="T3">T3 — Institutional evidence</option>
                                <option value="Proxy">Proxy — Estimated data</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">Storage Path</label>
                              <Input
                                value={storagePath}
                                onChange={(e) => setStoragePath(e.target.value)}
                                placeholder="evidence/operator/file.pdf"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-xs font-medium text-muted-foreground">SHA-256 Checksum</label>
                              <Input
                                value={checksum}
                                onChange={(e) => setChecksum(e.target.value)}
                                placeholder="a665a459..."
                                className="font-mono text-xs"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700"
                              disabled={mutation.isPending || !fileName.trim() || !checksum.trim() || !data?.latestAssessmentSnapshotId}
                              onClick={() => handleSubmit(ind.id)}
                            >
                              {mutation.isPending ? "Submitting..." : "Submit Evidence"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setUploadingIndicator(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        );
      })}

      {/* All evidence table */}
      {evidence.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wider text-muted-foreground font-medium">
              All Evidence Records
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {evidence.map((e) => {
                  const StateInfo = STATE_ICON[e.verificationState];
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-mono text-xs">{e.indicatorId}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${TIER_INFO[e.tier].color}`}>
                          {e.tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <StateInfo.icon className={`h-3.5 w-3.5 ${StateInfo.color}`} />
                          <span className="text-xs capitalize">{e.verificationState}</span>
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {e.fileName}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(e.submittedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {!data?.latestAssessmentSnapshotId && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="py-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-800">
              No assessment snapshot found. Complete an assessment before submitting evidence.
            </p>
            <Button size="sm" className="ml-auto bg-amber-600 hover:bg-amber-700" asChild>
              <Link href="/operator/onboarding">Start Assessment</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
