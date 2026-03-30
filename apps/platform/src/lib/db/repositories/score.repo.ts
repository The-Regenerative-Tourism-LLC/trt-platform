/**
 * Score Snapshot Repository
 *
 * Persistence of immutable ScoreSnapshot records.
 * ScoreSnapshots are append-only — no updates permitted after creation.
 */

import { prisma } from "../prisma";
import type { ScoreSnapshot, Prisma } from "@prisma/client";

export async function createScoreSnapshot(
  data: Prisma.ScoreSnapshotCreateInput
): Promise<ScoreSnapshot> {
  return prisma.scoreSnapshot.create({ data });
}

export async function findScoreSnapshotById(
  id: string
): Promise<ScoreSnapshot | null> {
  return prisma.scoreSnapshot.findUnique({ where: { id } });
}

export async function findLatestScoreByOperator(
  operatorId: string
): Promise<ScoreSnapshot | null> {
  return prisma.scoreSnapshot.findFirst({
    where: { operatorId },
    orderBy: { computedAt: "desc" },
  });
}

/**
 * Returns the second-most-recent ScoreSnapshot for an operator.
 * Used by the dashboard delta comparison section.
 */
export async function findPreviousScoreByOperator(
  operatorId: string
): Promise<ScoreSnapshot | null> {
  const results = await prisma.scoreSnapshot.findMany({
    where: { operatorId },
    orderBy: { computedAt: "desc" },
    take: 2,
  });
  return results[1] ?? null;
}

export async function findPublishedScoreByOperator(
  operatorId: string
): Promise<ScoreSnapshot | null> {
  return prisma.scoreSnapshot.findFirst({
    where: { operatorId, isPublished: true },
    orderBy: { computedAt: "desc" },
  });
}

export async function findScoresByOperator(
  operatorId: string
): Promise<ScoreSnapshot[]> {
  return prisma.scoreSnapshot.findMany({
    where: { operatorId },
    orderBy: { computedAt: "asc" },
  });
}

export async function findScoreByAssessmentSnapshot(
  assessmentSnapshotId: string
): Promise<ScoreSnapshot | null> {
  return prisma.scoreSnapshot.findFirst({
    where: { assessmentSnapshotId },
    orderBy: { computedAt: "desc" },
  });
}

/**
 * Publish a score snapshot (set isPublished = true).
 * This is the only permissible mutation of a ScoreSnapshot after creation.
 */
export async function publishScoreSnapshot(
  id: string
): Promise<ScoreSnapshot> {
  return prisma.scoreSnapshot.update({
    where: { id },
    data: {
      isPublished: true,
      publicationBlockedReason: null,
    },
  });
}

/**
 * Mark a score snapshot as publication-blocked (e.g. pending T1 verification).
 */
export async function blockScorePublication(
  id: string,
  reason: string
): Promise<ScoreSnapshot> {
  return prisma.scoreSnapshot.update({
    where: { id },
    data: {
      isPublished: false,
      publicationBlockedReason: reason,
    },
  });
}

/**
 * Find the Cycle 1 (baseline) ScoreSnapshot for an operator.
 * Used by the orchestrator to lock baselineScores into the DeltaBlock.
 */
export async function findCycle1ScoreByOperator(
  operatorId: string
): Promise<ScoreSnapshot | null> {
  return prisma.scoreSnapshot.findFirst({
    where: {
      operatorId,
      assessmentSnapshot: { assessmentCycle: 1 },
    },
    include: { assessmentSnapshot: true } as any,
    orderBy: { computedAt: "asc" },
  });
}

/**
 * Find all published scores for operators in a territory.
 * Used for DPI regenerative performance calculation.
 */
export async function findPublishedScoresByTerritory(
  territoryId: string
): Promise<{ operatorId: string; gpsTotal: number }[]> {
  const results = await prisma.scoreSnapshot.findMany({
    where: {
      isPublished: true,
      operator: { territoryId },
    },
    select: { operatorId: true, gpsTotal: true },
  });
  return results.map((r: { operatorId: string; gpsTotal: unknown }) => ({
    operatorId: r.operatorId,
    gpsTotal: Number(r.gpsTotal),
  }));
}
