import type { P3Responses, MethodologyBundle } from "../types";

export interface P3Result {
  readonly score: number;
  readonly subScores: Record<string, number>;
  readonly isForwardCommitment: boolean; // Status D
  readonly isNotApplicable: boolean; // Status E
}

/**
 * Compute Pillar 3 — Regenerative Contribution.
 *
 * Status D: operator declared forward commitment — P3 = 0, ForwardCommitmentRecord required.
 * Status E: not applicable (operator type/context) — P3 = 0.
 * Statuses A-C: full P3 scoring based on sub-indicators.
 */
export function computeP3(
  responses: P3Responses,
  p3Status: "A" | "B" | "C" | "D" | "E",
  methodology: MethodologyBundle
): P3Result {
  const w = methodology.p3SubWeights;

  if (p3Status === "D") {
    return {
      score: 0,
      subScores: {},
      isForwardCommitment: true,
      isNotApplicable: false,
    };
  }

  if (p3Status === "E") {
    return {
      score: 0,
      subScores: {},
      isForwardCommitment: false,
      isNotApplicable: true,
    };
  }

  const p3a = responses.categoryScope ?? 0; // pre-normalised 0-100
  const p3b = responses.traceability ?? 0; // 0 | 25 | 50 | 75 | 100
  const p3c = responses.additionality ?? 0; // 0 | 25 | 50 | 75 | 100
  const p3d = responses.continuity ?? 0; // 0 | 25 | 50 | 75 | 100

  const score = Math.round(
    p3a * w.categoryScope +
    p3b * w.traceability +
    p3c * w.additionality +
    p3d * w.continuity
  );

  return {
    score,
    subScores: {
      categoryScope: p3a,
      traceability: p3b,
      additionality: p3c,
      continuity: p3d,
    },
    isForwardCommitment: false,
    isNotApplicable: false,
  };
}
