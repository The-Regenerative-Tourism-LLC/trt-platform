/**
 * Publication Evaluator
 *
 * Re-evaluates publication eligibility for a ScoreSnapshot after an
 * evidence verification state change. Called by admin evidence action routes.
 *
 * Rules (identical to scoring orchestrator):
 *   1. T3 gate: if p3Status requires T3 evidence and none is verified → blocked
 *   2. T1 coverage: all three pillars must have at least one active T1 evidence → blocked if not
 *   3. Otherwise: published
 *
 * This module must NOT be called from the scoring engine or frontend components.
 */

import {
  findT1EvidenceCoverageBySnapshot,
  findVerifiedT3Evidence,
} from "../db/repositories/evidence.repo";
import {
  findScoreByAssessmentSnapshot,
  publishScoreSnapshot,
  blockScorePublication,
} from "../db/repositories/score.repo";
import { findAssessmentSnapshotById } from "../db/repositories/assessment.repo";

export interface PublicationEvaluationResult {
  scoreSnapshotId: string | null;
  isPublished: boolean;
  publicationBlockedReason: string | null;
}

/**
 * Re-evaluate and persist publication status for the ScoreSnapshot linked
 * to the given AssessmentSnapshot.
 *
 * Returns the new publication status (or a no-op result if no score exists).
 */
export async function reevaluateScorePublication(
  assessmentSnapshotId: string,
  operatorId: string
): Promise<PublicationEvaluationResult> {
  const score = await findScoreByAssessmentSnapshot(assessmentSnapshotId);
  if (!score) {
    return { scoreSnapshotId: null, isPublished: false, publicationBlockedReason: null };
  }

  const assessment = await findAssessmentSnapshotById(assessmentSnapshotId);
  let publicationBlockedReason: string | null = null;

  // T3 gate: only applies when p3Status indicates a real programme (A/B/C)
  const p3Status = assessment?.p3Status ?? null;
  if (p3Status !== null && p3Status !== "D" && p3Status !== "E") {
    const hasVerifiedT3 = await findVerifiedT3Evidence(operatorId);
    if (!hasVerifiedT3) {
      publicationBlockedReason = "T3 evidence required for P3 scoring";
    }
  }

  // T1 coverage: each pillar must have an active (not rejected/lapsed) T1 evidence item
  if (!publicationBlockedReason) {
    const t1Coverage = await findT1EvidenceCoverageBySnapshot(assessmentSnapshotId);
    if (!t1Coverage.p1 || !t1Coverage.p2 || !t1Coverage.p3) {
      publicationBlockedReason = "Insufficient Tier 1 evidence coverage";
    }
  }

  const isPublished = publicationBlockedReason === null;

  if (isPublished) {
    await publishScoreSnapshot(score.id);
  } else {
    await blockScorePublication(score.id, publicationBlockedReason!);
  }

  return { scoreSnapshotId: score.id, isPublished, publicationBlockedReason };
}
