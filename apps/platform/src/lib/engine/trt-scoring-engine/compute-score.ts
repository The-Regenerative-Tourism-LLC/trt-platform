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
  const pw = methodology.pillarWeights;
  const gpsBase =
    p1Result.score * pw.p1 +
    p2Result.score * pw.p2 +
    p3Result.score * pw.p3;

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
      p3: p3Result.score,
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
  const gpsTotal = clamp(Math.round(gpsBase + (dpsTotal ?? 0)), 0, 100);
  const gpsBand = getGpsBand(gpsTotal, methodology.bandThresholds);

  // ── Computation trace ─────────────────────────────────────────────────
  const computationTrace: ComputationTrace = {
    p1SubScores: p1Result.subScores,
    p2SubScores: p2Result.subScores,
    p3SubScores: p3Result.subScores,
    p1Weighted: Math.round(p1Result.score * pw.p1 * 10) / 10,
    p2Weighted: Math.round(p2Result.score * pw.p2 * 10) / 10,
    p3Weighted: Math.round(p3Result.score * pw.p3 * 10) / 10,
    gpsBase: Math.round(gpsBase * 10) / 10,
    ...(dpsComponents ? { dpsComponents } : {}),
  };

  return {
    methodologyVersion: methodology.version,
    gpsTotal,
    gpsBand,
    p1Score: p1Result.score,
    p2Score: p2Result.score,
    p3Score: p3Result.score,
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
