import { prisma } from "../prisma";
import type { EvidenceRef, Prisma, VerificationState } from "@prisma/client";

type PendingEvidenceItem = Prisma.EvidenceRefGetPayload<{
  include: {
    operator: { select: { legalName: true; tradingName: true } };
    assessmentSnapshot: { select: { assessmentCycle: true } };
  };
}>;

export async function createEvidenceRef(
  data: Prisma.EvidenceRefCreateInput
): Promise<EvidenceRef> {
  return prisma.evidenceRef.create({ data });
}

export async function findEvidenceBySnapshot(
  assessmentSnapshotId: string
): Promise<EvidenceRef[]> {
  return prisma.evidenceRef.findMany({ where: { assessmentSnapshotId } });
}

export async function findEvidenceByOperator(
  operatorId: string
): Promise<EvidenceRef[]> {
  return prisma.evidenceRef.findMany({
    where: { operatorId },
    orderBy: { submittedAt: "desc" },
  });
}

export async function updateVerificationState(
  id: string,
  state: VerificationState,
  verifiedBy?: string
): Promise<EvidenceRef> {
  return prisma.evidenceRef.update({
    where: { id },
    data: {
      verificationState: state,
      verifiedAt: state === "verified" ? new Date() : undefined,
      verifiedBy,
    },
  });
}

/**
 * Check whether a verified T3 evidence ref exists for an operator.
 * Used by the orchestrator to enforce T3 gate before P3 scoring.
 */
export async function findVerifiedT3Evidence(
  operatorId: string
): Promise<boolean> {
  const count = await prisma.evidenceRef.count({
    where: { operatorId, tier: "T3", verificationState: "verified" },
  });
  return count > 0;
}

export async function findPendingEvidenceQueue(): Promise<PendingEvidenceItem[]> {
  return prisma.evidenceRef.findMany({
    where: { verificationState: "pending" },
    orderBy: { submittedAt: "asc" },
    include: {
      operator: { select: { legalName: true, tradingName: true } },
      assessmentSnapshot: { select: { assessmentCycle: true } },
    },
  });
}
