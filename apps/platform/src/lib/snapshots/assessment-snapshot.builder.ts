/**
 * Assessment Snapshot Builder
 *
 * Constructs an immutable AssessmentSnapshot from operator onboarding data.
 * Called by the scoring orchestrator before engine invocation.
 * Computes the snapshot hash for integrity verification.
 */

import { createHash } from "crypto";
import type {
  AssessmentSnapshot,
  P1Responses,
  P2Responses,
  P3Responses,
  DeltaBlock,
  EvidenceRef,
} from "../engine/trt-scoring-engine/types";

export interface AssessmentSnapshotInput {
  operatorId: string;
  operatorType: "A" | "B" | "C";
  activityUnit: { guestNights?: number; visitorDays?: number };
  revenueSplit?: { accommodationPct?: number; experiencePct?: number };
  assessmentCycle: number;
  assessmentPeriodEnd: string; // ISO8601 date

  // Pillar responses
  pillar1: P1Responses;
  pillar2: P2Responses;
  pillar3: P3Responses;
  p3Status: "A" | "B" | "C" | "D" | "E";

  // Delta (null on Cycle 1)
  delta: DeltaBlock | null;

  // Evidence refs (checksums only, no bytes)
  evidence: EvidenceRef[];
}

/**
 * Build an immutable AssessmentSnapshot with a computed SHA-256 hash.
 * The hash is over the canonical JSON of all input fields.
 * createdAt is injected by the caller (usually the orchestrator), not by the builder.
 */
export function buildAssessmentSnapshot(
  input: AssessmentSnapshotInput,
  createdAt: string
): AssessmentSnapshot {
  const partial: Omit<AssessmentSnapshot, "snapshotHash"> = {
    operatorId: input.operatorId,
    operatorType: input.operatorType,
    activityUnit: input.activityUnit,
    revenueSplit: input.revenueSplit,
    assessmentCycle: input.assessmentCycle,
    assessmentPeriodEnd: input.assessmentPeriodEnd,
    pillar1: input.pillar1,
    pillar2: input.pillar2,
    pillar3: input.pillar3,
    p3Status: input.p3Status,
    delta: input.delta,
    evidence: input.evidence,
    createdAt,
  };

  const canonical = JSON.stringify(partial, Object.keys(partial).sort());
  const snapshotHash = createHash("sha256").update(canonical).digest("hex");

  return { ...partial, snapshotHash };
}

/**
 * Build a DeltaBlock for Cycle 2+ assessments.
 * Requires the locked baseline ScoreSnapshot from Cycle 1.
 */
export function buildDeltaBlock(params: {
  priorCycle: number;
  baselineScores: Record<string, number>;
  priorScores: Record<string, number>;
}): DeltaBlock {
  return {
    priorCycle: params.priorCycle,
    baselineScores: params.baselineScores,
    priorScores: params.priorScores,
    currentScores: {},
  };
}
