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
