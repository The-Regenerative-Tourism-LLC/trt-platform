import type { NormBounds } from "../types";

/**
 * Normalise a continuous metric value to a 0-100 rubric score.
 * Returns 0 | 25 | 50 | 75 | 100.
 */
export function normalizeValue(
  value: number | null | undefined,
  bounds: NormBounds
): number {
  if (value == null) return 0;

  if (bounds.dir === "lower_is_better") {
    if (value <= bounds.b100) return 100;
    if (value <= bounds.b75) return 75;
    if (value <= bounds.b50) return 50;
    if (value <= bounds.b25) return 25;
    return 0;
  } else {
    if (value >= bounds.b100) return 100;
    if (value >= bounds.b75) return 75;
    if (value >= bounds.b50) return 50;
    if (value >= bounds.b25) return 25;
    return 0;
  }
}

/**
 * Normalise a discrete integer score (e.g. 0-4) to 0-100.
 */
export function normalizeDiscreteScore(
  value: number | null | undefined,
  max: number
): number {
  if (value == null) return 0;
  return Math.round((value / max) * 100);
}

export function getRubricBandLabel(score: number): string {
  if (score >= 100) return "Excellent";
  if (score >= 75) return "Above average";
  if (score >= 50) return "Average";
  if (score >= 25) return "Below average";
  return "Poor";
}
