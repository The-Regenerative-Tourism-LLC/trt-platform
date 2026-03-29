import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";
import { EvidenceQueueClient } from "./EvidenceQueueClient";

// Admin data is always request-scoped: live DB queries, auth-gated, never cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Evidence Queue" };

// Prisma returns Decimal and Date objects which are not serialisable across the
// server → client boundary. This helper converts them to plain primitives.
function serializeEvidence(
  items: Awaited<ReturnType<typeof fetchEvidence>>
) {
  return items.map((e) => ({
    id: e.id,
    assessmentSnapshotId: e.assessmentSnapshotId,
    operatorId: e.operatorId,
    indicatorId: e.indicatorId,
    tier: e.tier,
    fileName: e.fileName,
    checksum: e.checksum,
    verificationState: e.verificationState,
    proxyMethod: e.proxyMethod,
    proxyCorrectionFactor:
      e.proxyCorrectionFactor !== null && e.proxyCorrectionFactor !== undefined
        ? Number(e.proxyCorrectionFactor)
        : null,
    submittedAt: e.submittedAt.toISOString(),
    verifiedAt: e.verifiedAt ? e.verifiedAt.toISOString() : null,
    verifiedBy: e.verifiedBy,
    operator: e.operator,
    assessmentSnapshot: e.assessmentSnapshot,
  }));
}

async function fetchEvidence() {
  return prisma.evidenceRef.findMany({
    where: { verificationState: "pending" },
    orderBy: { submittedAt: "asc" },
    include: {
      operator: { select: { id: true, legalName: true, tradingName: true } },
      assessmentSnapshot: { select: { id: true, assessmentCycle: true } },
    },
  });
}

async function fetchAllEvidence() {
  return prisma.evidenceRef.findMany({
    orderBy: { submittedAt: "desc" },
    take: 50,
    include: {
      operator: { select: { id: true, legalName: true, tradingName: true } },
      assessmentSnapshot: { select: { id: true, assessmentCycle: true } },
    },
  });
}

export default async function EvidenceQueuePage() {
  const [pending, all] = await Promise.all([fetchEvidence(), fetchAllEvidence()]);

  const pendingEvidence = serializeEvidence(pending);
  const allEvidence = serializeEvidence(all);

  return <EvidenceQueueClient pendingEvidence={pendingEvidence} allEvidence={allEvidence} />;
}
