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
  preferredCategory?: string;
  territoryContext?: string;
  preferredInstitutionType?: string;
  targetActivationCycle?: number;
  authorisedSignatory?: string;
  signedAt?: Date;
}): Promise<ForwardCommitmentRecord> {
  return prisma.forwardCommitmentRecord.create({
    data: {
      operator: { connect: { id: params.operatorId } },
      assessmentCycle: params.assessmentCycle,
      preferredCategory: params.preferredCategory,
      territoryContext: params.territoryContext,
      preferredInstitutionType: params.preferredInstitutionType,
      targetActivationCycle: params.targetActivationCycle,
      authorisedSignatory: params.authorisedSignatory,
      signedAt: params.signedAt,
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
