"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  FileText,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export interface SerializedEvidence {
  id: string;
  assessmentSnapshotId: string;
  operatorId: string;
  indicatorId: string;
  tier: EvidenceTier | null;
  fileName: string | null;
  checksum: string | null;
  verificationState: VerificationState;
  proxyMethod: string | null;
  proxyCorrectionFactor: number | null;
  submittedAt: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
  operator: {
    id: string;
    legalName: string;
    tradingName: string | null;
  };
  assessmentSnapshot: {
    id: string;
    assessmentCycle: number;
  };
}

interface Props {
  pendingEvidence: SerializedEvidence[];
  allEvidence: SerializedEvidence[];
}

const TIER_STYLES: Record<string, string> = {
  T1: "bg-secondary text-primary border-primary/20",
  T2: "bg-blue-100 text-blue-800 border-blue-200",
  T3: "bg-teal-100 text-teal-800 border-teal-200",
  Proxy: "bg-purple-100 text-purple-800 border-purple-200",
};

const STATE_CONFIG: Record<VerificationState, { icon: typeof Clock; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: "text-amber-600", bgColor: "bg-card" },
  verified: { icon: CheckCircle2, color: "text-primary", bgColor: "bg-secondary text-primary" },
  rejected: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10 text-destructive" },
  lapsed: { icon: AlertCircle, color: "text-muted-foreground", bgColor: "bg-muted text-muted-foreground" },
};

function TierBadge({ tier }: { tier: EvidenceTier | null }) {
  if (!tier) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={`text-[10px] ${TIER_STYLES[tier] ?? ""}`}>
      {tier}
    </Badge>
  );
}

function StateBadge({ state }: { state: VerificationState }) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${config.bgColor}`}>
      <Icon className="h-3 w-3" />
      {state.charAt(0).toUpperCase() + state.slice(1)}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function EvidenceQueueClient({ pendingEvidence, allEvidence }: Props) {
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const visiblePending = pendingEvidence.filter((e) => !removedIds.has(e.id));
  const verifiedCount = allEvidence.filter((e) => e.verificationState === "verified").length;
  const rejectedCount = allEvidence.filter((e) => e.verificationState === "rejected").length;

  async function handleAction(id: string, action: "verify" | "reject") {
    setLoadingIds((prev) => new Set(prev).add(id));
    try {
      const endpoint = action === "verify"
        ? `/api/v1/admin/evidence/${id}/verify`
        : `/api/v1/admin/evidence/${id}/reject`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      setRemovedIds((prev) => new Set(prev).add(id));
      toast.success(action === "verify" ? "Evidence verified successfully." : "Evidence rejected.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      toast.error(`Action failed: ${msg}`);
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Evidence Review</h1>
          <p className="text-muted-foreground mt-1">
            Verify or reject operator evidence before GPS scores are published.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/dashboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Pending",
            value: visiblePending.length,
            alert: visiblePending.length > 0,
            icon: Clock,
          },
          { label: "Total", value: allEvidence.length, alert: false, icon: FileText },
          { label: "Verified", value: verifiedCount, alert: false, icon: CheckCircle2 },
          { label: "Rejected", value: rejectedCount, alert: false, icon: XCircle },
        ].map((s) => (
          <Card key={s.label} className={s.alert ? "border-amber-300 bg-amber-50" : ""}>
            <CardContent className="py-4 text-center">
              <s.icon className={`h-4 w-4 mx-auto mb-1 ${s.alert ? "text-amber-600" : "text-muted-foreground"}`} />
              <div className="text-3xl font-black tabular-nums">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Review
            {visiblePending.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-amber-100 text-[10px] px-1.5">
                {visiblePending.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Evidence</TabsTrigger>
        </TabsList>

        {/* Pending tab */}
        <TabsContent value="pending" className="space-y-4">
          {visiblePending.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <CheckCircle2 className="h-10 w-10 text-primary/40 mx-auto" />
                <p className="text-sm text-muted-foreground">
                  No evidence pending review. All clear!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visiblePending.map((e) => {
                const isLoading = loadingIds.has(e.id);
                const operatorName = e.operator.tradingName ?? e.operator.legalName;

                return (
                  <Card key={e.id}>
                    <CardContent className="py-4 space-y-3 flex flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" title={operatorName}>
                            {operatorName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cycle {e.assessmentSnapshot.assessmentCycle}
                          </p>
                        </div>
                        <TierBadge tier={e.tier} />
                      </div>

                      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
                        <dt className="text-muted-foreground font-medium">Indicator</dt>
                        <dd className="font-mono truncate">{e.indicatorId}</dd>
                        <dt className="text-muted-foreground font-medium">File</dt>
                        <dd className="truncate" title={e.fileName ?? "—"}>
                          {e.fileName ?? "—"}
                        </dd>
                        <dt className="text-muted-foreground font-medium">Checksum</dt>
                        <dd className="font-mono truncate text-muted-foreground" title={e.checksum ?? undefined}>
                          {e.checksum ? `${e.checksum.slice(0, 16)}…` : "—"}
                        </dd>
                        <dt className="text-muted-foreground font-medium">Submitted</dt>
                        <dd>{formatDate(e.submittedAt)}</dd>
                      </dl>

                      {e.proxyMethod && (
                        <div className="rounded-lg bg-purple-50 border border-purple-200 px-3 py-2 text-xs text-purple-800">
                          <span className="font-medium">Proxy method:</span> {e.proxyMethod}
                          {e.proxyCorrectionFactor != null && (
                            <span> (correction: {e.proxyCorrectionFactor})</span>
                          )}
                        </div>
                      )}

                      <div className="flex gap-2 pt-1 mt-auto">
                        <Button
                          size="sm"
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                          disabled={isLoading}
                          onClick={() => handleAction(e.id, "verify")}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          Verify
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                          disabled={isLoading}
                          onClick={() => handleAction(e.id, "reject")}
                        >
                          {isLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* All evidence tab */}
        <TabsContent value="all">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Indicator</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Cycle</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allEvidence.map((e) => {
                  const operatorName = e.operator.tradingName ?? e.operator.legalName;
                  return (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium max-w-[160px] truncate" title={operatorName}>
                        {operatorName}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {e.indicatorId}
                      </TableCell>
                      <TableCell>
                        <TierBadge tier={e.tier} />
                      </TableCell>
                      <TableCell className="tabular-nums text-center">
                        {e.assessmentSnapshot.assessmentCycle}
                      </TableCell>
                      <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground" title={e.fileName ?? undefined}>
                        {e.fileName ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StateBadge state={e.verificationState} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(e.submittedAt)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {allEvidence.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No evidence records found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
