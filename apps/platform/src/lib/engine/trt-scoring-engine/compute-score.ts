/**
 * TRT Scoring Engine — Primary Computation Interface
 *
 * computeScore(AssessmentSnapshot, DpiSnapshot, MethodologyBundle): ScoreSnapshot
 *
 * ENGINE GUARANTEES:
 *   - Deterministic: identical inputs → identical outputs
 *   - Stateless: no shared mutable state between calls
 *   - Side-effect free: no writes, network, or file I/O
 *   - Replayable: any historical score can be reproduced from its source inputs
 *   - Auditable: full computation trace in every ScoreSnapshot
 *   - Portable: no Node.js-specific APIs; can run in WASM (Phase 3)
 *
 * ENGINE PROHIBITIONS:
 *   - No database access
 *   - No environment variable access
 *   - No network calls
 *   - No filesystem I/O
 *   - No use of current time (Date.now())
 *   - No inference of values not present in provided snapshots
 */

import type {
  AssessmentSnapshot,
  DpiSnapshot,
  MethodologyBundle,
  ScoreSnapshot,
  ComputationTrace,
} from "./types";
import { computeP1 } from "./pillars/p1";
import { computeP2 } from "./pillars/p2";
import { computeP3 } from "./pillars/p3";
import { computeDps } from "./dps/dps";
import { getGpsBand } from "./bands/bands";

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Compute a complete ScoreSnapshot from immutable input snapshots.
 *
 * This is the ONLY authorised entry point for score computation in the
 * entire platform. No other module may perform GPS, DPS, or DPI calculations.
 */
export function computeScore(
  assessment: AssessmentSnapshot,
  dpi: DpiSnapshot,
  methodology: MethodologyBundle
): Omit<ScoreSnapshot, "assessmentSnapshotId" | "inputHash" | "methodologyHash" | "createdAt"> {
  // ── Pillar scores ──────────────────────────────────────────────────────
  const p1Result = computeP1(assessment.pillar1, assessment.operatorType, methodology);
  const p2Result = computeP2(assessment.pillar2, assessment.operatorType, methodology);
  const p3Result = computeP3(assessment.pillar3, assessment.p3Status, methodology);

  // ── GPS base (weighted pillar total) ──────────────────────────────────
  // Type C operators: P2 and P3 scored separately under accommodation (Type A)
  // and experience (Type B) normalization bounds, blended by revenue split.
  const pw = methodology.pillarWeights;

  let effectiveP2Score = p2Result.score;
  let effectiveP3Score = p3Result.score;

  if (
    assessment.operatorType === "C" &&
    assessment.revenueSplit?.accommodationPct !== undefined &&
    assessment.revenueSplit?.experiencePct !== undefined
  ) {
    const accFrac = assessment.revenueSplit.accommodationPct / 100;
    const expFrac = assessment.revenueSplit.experiencePct / 100;

    const p2Acc = computeP2(assessment.pillar2, "A", methodology).score;
    const p2Exp = computeP2(assessment.pillar2, "B", methodology).score;
    effectiveP2Score = p2Acc * accFrac + p2Exp * expFrac;

    const p3Acc = computeP3(assessment.pillar3, assessment.p3Status, methodology).score;
    const p3Exp = computeP3(assessment.pillar3, assessment.p3Status, methodology).score;
    effectiveP3Score = p3Acc * accFrac + p3Exp * expFrac;
  }

  const gpsBase =
    p1Result.score * pw.p1 +
    effectiveP2Score * pw.p2 +
    effectiveP3Score * pw.p3;

  // ── DPS (Cycle 2+ only) ───────────────────────────────────────────────
  let dpsTotal: number | null = null;
  let dps1: number | null = null;
  let dps2: number | null = null;
  let dps3: number | null = null;
  let dpsBand = null;
  let dpsComponents: ComputationTrace["dpsComponents"] | undefined;

  if (assessment.assessmentCycle > 1 && assessment.delta !== null) {
    const currentIndicatorScores: Record<string, number> = {
      ...p1Result.subScores,
      ...p2Result.subScores,
      p3: effectiveP3Score,
    };

    const dpsResult = computeDps(
      assessment.delta,
      currentIndicatorScores,
      p3Result.score,
      methodology
    );

    dpsTotal = dpsResult.dpsTotal;
    dps1 = dpsResult.dps1;
    dps2 = dpsResult.dps2;
    dps3 = dpsResult.dps3;
    dpsBand = dpsResult.dpsBand;
    dpsComponents = { dps1: dps1!, dps2: dps2!, dps3: dps3! };
  }

  // ── GPS total (clamped 0-100) ──────────────────────────────────────────
  // R6: clamp first, then round — rounding applied only once at the final step
  const gpsRaw = gpsBase + (dpsTotal ?? 0);
  const gpsClamped = clamp(gpsRaw, 0, 100);
  const gpsTotal = Math.round(gpsClamped);
  const gpsBand = getGpsBand(gpsTotal, methodology.bandThresholds);

  // ── Computation trace ─────────────────────────────────────────────────
  const computationTrace: ComputationTrace = {
    p1SubScores: p1Result.subScores,
    p2SubScores: p2Result.subScores,
    p3SubScores: p3Result.subScores,
    p1Weighted: p1Result.score * pw.p1,
    p2Weighted: effectiveP2Score * pw.p2,
    p3Weighted: effectiveP3Score * pw.p3,
    gpsBase,
    ...(dpsComponents ? { dpsComponents } : {}),
  };

  return {
    methodologyVersion: methodology.version,
    gpsTotal,
    gpsBand,
    p1Score: p1Result.score,
    p2Score: effectiveP2Score,
    p3Score: effectiveP3Score,
    dpsTotal,
    dps1,
    dps2,
    dps3,
    dpsBand,
    dpiScore: dpi.compositeDpi,
    dpiPressureLevel: dpi.pressureLevel,
    computationTrace,
  };
}
