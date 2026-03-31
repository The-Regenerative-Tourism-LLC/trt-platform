import { prisma } from "../prisma";
import type { EvidenceRef, Prisma, VerificationState } from "@prisma/client";

type PendingEvidenceItem = Prisma.EvidenceRefGetPayload<{
  include: {
    operator: { select: { legalName: true; tradingName: true } };
    assessmentSnapshot: { select: { assessmentCycle: true } };
  };
}>;

export type EvidenceRefWithDetails = Prisma.EvidenceRefGetPayload<{
  include: {
    operator: { select: { id: true; legalName: true; tradingName: true } };
    assessmentSnapshot: { select: { id: true; assessmentCycle: true; operatorId: true } };
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

/**
 * Check T1 evidence coverage per pillar for a given AssessmentSnapshot.
 * Returns whether each pillar has at least one active (not rejected/lapsed) T1 evidence ref.
 * Indicator IDs follow the p1_/p2_/p3_ prefix convention.
 * Used by the orchestrator and publication evaluator.
 */
export async function findT1EvidenceCoverageBySnapshot(
  assessmentSnapshotId: string
): Promise<{ p1: boolean; p2: boolean; p3: boolean }> {
  const t1Evidence = await prisma.evidenceRef.findMany({
    where: {
      assessmentSnapshotId,
      tier: "T1",
      verificationState: { notIn: ["rejected", "lapsed"] },
    },
    select: { indicatorId: true },
  });
  return {
    p1: t1Evidence.some((e) => e.indicatorId.startsWith("p1_")),
    p2: t1Evidence.some((e) => e.indicatorId.startsWith("p2_")),
    p3: t1Evidence.some((e) => e.indicatorId.startsWith("p3_")),
  };
}

/**
 * Load a single EvidenceRef with operator and snapshot details.
 * Used by admin routes to validate identity and trigger re-evaluation.
 */
export async function findEvidenceRefById(
  id: string
): Promise<EvidenceRefWithDetails | null> {
  return prisma.evidenceRef.findUnique({
    where: { id },
    include: {
      operator: { select: { id: true, legalName: true, tradingName: true } },
      assessmentSnapshot: { select: { id: true, assessmentCycle: true, operatorId: true } },
    },
  });
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
