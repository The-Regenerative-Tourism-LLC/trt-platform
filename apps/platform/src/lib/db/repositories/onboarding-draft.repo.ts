/**
 * Onboarding Draft Repository
 *
 * Mutable persistence layer for operator onboarding drafts.
 * One draft per operator — upserted on every save.
 * Not related to scoring or AssessmentSnapshot.
 */

import { prisma } from "../prisma";
import type { OnboardingDraft } from "@prisma/client";

export async function findDraftByOperatorId(
  operatorId: string
): Promise<OnboardingDraft | null> {
  return prisma.onboardingDraft.findUnique({ where: { operatorId } });
}

export async function upsertDraft(
  operatorId: string,
  currentStep: number,
  dataJson: Record<string, unknown>
): Promise<OnboardingDraft> {
  return prisma.onboardingDraft.upsert({
    where: { operatorId },
    update: { currentStep, dataJson: dataJson as any },
    create: { operatorId, currentStep, dataJson: dataJson as any },
  });
}
