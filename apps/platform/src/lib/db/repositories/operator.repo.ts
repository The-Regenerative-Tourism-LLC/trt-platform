/**
 * Operator Repository
 *
 * Persistence operations for Operator entities.
 * Repositories only read/write data — they never compute scores.
 */

import { prisma } from "../prisma";
import type { Operator, Prisma } from "@prisma/client";

export async function findOperatorById(id: string): Promise<Operator | null> {
  return prisma.operator.findUnique({ where: { id } });
}

export async function findOperatorByUserId(userId: string): Promise<Operator | null> {
  return prisma.operator.findFirst({ where: { userId } });
}

export async function findOperatorsByTerritoryId(territoryId: string): Promise<Operator[]> {
  return prisma.operator.findMany({ where: { territoryId } });
}

export async function createOperator(
  data: Prisma.OperatorCreateInput
): Promise<Operator> {
  return prisma.operator.create({ data });
}

export async function updateOperator(
  id: string,
  data: Prisma.OperatorUpdateInput
): Promise<Operator> {
  return prisma.operator.update({ where: { id }, data });
}

export async function incrementAssessmentCycle(operatorId: string): Promise<Operator> {
  return prisma.operator.update({
    where: { id: operatorId },
    data: { assessmentCycleCount: { increment: 1 } },
  });
}

export async function markOnboardingCompleted(operatorId: string): Promise<Operator> {
  return prisma.operator.update({
    where: { id: operatorId },
    data: { onboardingCompleted: true },
  });
}

/**
 * Load a single operator's public profile: identity, territory, latest published
 * ScoreSnapshot (with linked AssessmentSnapshot for delta/cycle data), and
 * verified evidence refs from that assessment (private fields excluded).
 *
 * Returns null if the operator has no published ScoreSnapshot.
 */
export async function findPublishedOperatorProfile(id: string) {
  const operator = await prisma.operator.findUnique({
    where: { id },
    select: {
      id: true,
      legalName: true,
      tradingName: true,
      country: true,
      destinationRegion: true,
      operatorType: true,
      tagline: true,
      website: true,
      territory: {
        select: {
          id: true,
          name: true,
          compositeDpi: true,
          pressureLevel: true,
        },
      },
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
        select: {
          id: true,
          methodologyVersion: true,
          computedAt: true,
          gpsTotal: true,
          gpsBand: true,
          p1Score: true,
          p2Score: true,
          p3Score: true,
          dpsTotal: true,
          dps1: true,
          dps2: true,
          dps3: true,
          dpsBand: true,
          assessmentSnapshot: {
            select: {
              id: true,
              assessmentCycle: true,
              assessmentPeriodEnd: true,
              deltaPriorCycle: true,
              deltaExplanation: true,
            },
          },
        },
      },
    },
  });

  if (!operator || operator.scoreSnapshots.length === 0) return null;

  const latestScore = operator.scoreSnapshots[0];

  // Load verified evidence for the assessment snapshot (no private file fields)
  const evidence = await prisma.evidenceRef.findMany({
    where: {
      assessmentSnapshotId: latestScore.assessmentSnapshot.id,
      verificationState: "verified",
    },
    select: {
      id: true,
      indicatorId: true,
      tier: true,
      verificationState: true,
      proxyMethod: true,
      proxyCorrectionFactor: true,
      verifiedAt: true,
    },
    orderBy: { indicatorId: "asc" },
  });

  return { operator, latestScore, evidence };
}

export async function findPublishedOperatorsWithScores(
  options?: { territoryId?: string; limit?: number }
) {
  return prisma.operator.findMany({
    where: {
      ...(options?.territoryId ? { territoryId: options.territoryId } : {}),
      scoreSnapshots: { some: { isPublished: true } },
    },
    include: {
      scoreSnapshots: {
        where: { isPublished: true },
        orderBy: { computedAt: "desc" },
        take: 1,
      },
      territory: true,
    },
    take: options?.limit,
  });
}
