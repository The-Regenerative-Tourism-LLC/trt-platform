/**
 * Assessment Snapshot Repository
 *
 * Persistence of immutable AssessmentSnapshot records.
 * After creation, no update operations are permitted.
 */

import { prisma } from "../prisma";
import type { AssessmentSnapshot, Prisma } from "@prisma/client";

export async function createAssessmentSnapshot(
  data: Prisma.AssessmentSnapshotCreateInput
): Promise<AssessmentSnapshot> {
  return prisma.assessmentSnapshot.create({ data });
}

export async function findAssessmentSnapshotById(
  id: string
): Promise<AssessmentSnapshot | null> {
  return prisma.assessmentSnapshot.findUnique({ where: { id } });
}

export async function findLatestAssessmentByOperator(
  operatorId: string
): Promise<AssessmentSnapshot | null> {
  return prisma.assessmentSnapshot.findFirst({
    where: { operatorId },
    orderBy: { assessmentCycle: "desc" },
  });
}

export async function findAssessmentsByOperator(
  operatorId: string
): Promise<AssessmentSnapshot[]> {
  return prisma.assessmentSnapshot.findMany({
    where: { operatorId },
    orderBy: { assessmentCycle: "asc" },
  });
}

/**
 * Find the Cycle 1 (baseline) assessment for an operator.
 * Baseline scores must be locked from this snapshot.
 */
export async function findBaselineAssessment(
  operatorId: string
): Promise<AssessmentSnapshot | null> {
  return prisma.assessmentSnapshot.findFirst({
    where: { operatorId, assessmentCycle: 1 },
  });
}
