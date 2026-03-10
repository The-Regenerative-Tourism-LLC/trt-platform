/**
 * TRT Scoring Engine — Public API
 *
 * The only authorised scoring computation module in the platform.
 *
 * IMPORTANT: This module must ONLY be imported by:
 *   - lib/orchestration/scoring-orchestrator.ts
 *   - lib/orchestration/dpi-orchestrator.ts
 *   - engine test files
 *
 * It must NEVER be imported by:
 *   - React components
 *   - Next.js pages
 *   - API routes (use orchestrators instead)
 *   - Services
 *   - Repositories
 *   - Zustand stores
 *   - TanStack Query hooks
 */

export { computeScore } from "./compute-score";
export type {
  AssessmentSnapshot,
  DpiSnapshot,
  MethodologyBundle,
  ScoreSnapshot,
  DeltaBlock,
  P1Responses,
  P2Responses,
  P3Responses,
  EvidenceRef,
  NormBounds,
  GreenPassportBand,
  DpsBand,
  DpiPressureLevel,
  ComputationTrace,
  IndicatorId,
} from "./types";
export { normalizeValue, normalizeDiscreteScore, getRubricBandLabel } from "./pillars/normalise";
export { getGpsBand } from "./bands/bands";
