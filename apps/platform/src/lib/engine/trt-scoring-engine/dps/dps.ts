import type { DeltaBlock, MethodologyBundle } from "../types";
import type { DpsBand } from "../types";

export interface DpsResult {
  readonly dpsTotal: number;
  readonly dps1: number;
  readonly dps2: number;
  readonly dps3: number;
  readonly dpsBand: DpsBand;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function getDpsBand(dps: number): DpsBand {
  if (dps >= 15) return "accelerating";
  if (dps >= 5) return "progressing";
  if (dps >= -4) return "stable";
  if (dps >= -14) return "regressing";
  return "critical";
}

/**
 * Compute DPS (Direction of Performance Score) — Cycle 2+ only.
 *
 * DPS-1: Average delta across all indicator sub-scores [-10, +10]
 * DPS-2: Proportion of improving indicators × 10 [0, +10]
 * DPS-3: +5 bonus if P3 delta > threshold, else 0 [0 or +5]
 */
export function computeDps(
  delta: DeltaBlock,
  currentIndicatorScores: Record<string, number>,
  p3Score: number,
  methodology: MethodologyBundle
): DpsResult {
  const cfg = methodology.dpsConfig;
  const priorScores = delta.priorScores;

  const keys = Object.keys(currentIndicatorScores);
  const deltas = keys.map(
    (k) => (currentIndicatorScores[k] ?? 0) - (priorScores[k] ?? 0)
  );

  const avgDelta =
    deltas.length > 0
      ? deltas.reduce((a, b) => a + b, 0) / deltas.length
      : 0;

  const dps1 = clamp(avgDelta, cfg.dps1Min, cfg.dps1Max);
  const improvingCount = deltas.filter((d) => d > 0).length;
  const dps2 = (improvingCount / deltas.length) * cfg.dps2Multiplier;
  const p3Delta = p3Score - (priorScores["p3"] ?? 0);
  const dps3 = p3Delta > cfg.dps3Threshold ? cfg.dps3Bonus : 0;

  const dpsTotal = Math.round((dps1 + dps2 + dps3) * 10) / 10;
  const dpsBand = getDpsBand(dpsTotal);

  return { dpsTotal, dps1, dps2, dps3, dpsBand };
}
