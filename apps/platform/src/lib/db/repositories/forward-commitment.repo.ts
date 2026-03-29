/**
 * Forward Commitment Record Repository
 *
 * A ForwardCommitmentRecord is created when an operator submits P3 Status D.
 * It signals a declared intention to establish regenerative contribution
 * in a future assessment cycle.
 */

import { prisma } from "../prisma";
import type { ForwardCommitmentRecord } from "@prisma/client";

export async function createForwardCommitmentRecord(params: {
  operatorId: string;
  assessmentCycle: number;
}): Promise<ForwardCommitmentRecord> {
  return prisma.forwardCommitmentRecord.create({
    data: {
      operator: { connect: { id: params.operatorId } },
      assessmentCycle: params.assessmentCycle,
    },
  });
}

export async function findForwardCommitmentByOperatorCycle(
  operatorId: string,
  assessmentCycle: number
): Promise<ForwardCommitmentRecord | null> {
  return prisma.forwardCommitmentRecord.findFirst({
    where: { operatorId, assessmentCycle },
  });
}
