/**
 * UI-only normalisation helper for onboarding form preview bars.
 *
 * This is NOT the TRT Scoring Engine. It mirrors the engine's
 * normalizeValue formula for UI feedback only — no scoring decisions
 * are made here and this output is never persisted.
 *
 * The authoritative computation lives in:
 *   lib/engine/trt-scoring-engine/pillars/normalise.ts
 * and is only invoked server-side via the scoring orchestrator.
 */

export interface PreviewBounds {
  readonly b100: number;
  readonly b75: number;
  readonly b50: number;
  readonly b25: number;
  readonly dir: "lower_is_better" | "higher_is_better";
}

/**
 * Normalise a continuous metric to a 0 | 25 | 50 | 75 | 100 rubric score.
 * Used solely to render per-indicator preview bars in the onboarding form.
 */
export function previewNormalise(
  value: number | null | undefined,
  bounds: PreviewBounds
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
