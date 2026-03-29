/**
 * DPI Snapshot Builder
 *
 * Constructs an immutable DpiSnapshot from territory data and live operator scores.
 * Called by the DPI orchestrator before DPI computation.
 */

import { createHash } from "crypto";
import { canonicalize } from "../engine/trt-scoring-engine/canonical";
import type { DpiSnapshot } from "../engine/trt-scoring-engine/types";

export interface DpiSnapshotInput {
  territoryId: string;
  touristIntensity: number;
  ecologicalSensitivity: number;
  economicLeakageRate: number;
  regenerativePerf: number;
  operatorCohortSize: number;
}

/**
 * Compute the DPI composite score from the four weighted components.
 * Weights: Tourist Intensity 35%, Ecological Sensitivity 30%, Economic Leakage 20%, Regen Perf 15%
 * Regen Performance is inverted: high operator performance = lower DPI pressure.
 */
export function computeDpiComposite(components: {
  touristIntensity: number;
  ecologicalSensitivity: number;
  economicLeakageRate: number;
  regenerativePerf: number;
}): { composite: number; pressureLevel: "low" | "moderate" | "high" } {
  const composite = Math.round(
    components.touristIntensity * 0.35 +
    components.ecologicalSensitivity * 0.30 +
    components.economicLeakageRate * 0.20 +
    (100 - components.regenerativePerf) * 0.15
  );

  let pressureLevel: "low" | "moderate" | "high";
  if (composite >= 66) pressureLevel = "high";
  else if (composite >= 33) pressureLevel = "moderate";
  else pressureLevel = "low";

  return { composite, pressureLevel };
}

/**
 * Build an immutable DpiSnapshot with a computed SHA-256 hash.
 */
export function buildDpiSnapshot(
  input: DpiSnapshotInput,
  createdAt: string
): DpiSnapshot & { operatorCohortSize: number } {
  const { composite, pressureLevel } = computeDpiComposite({
    touristIntensity: input.touristIntensity,
    ecologicalSensitivity: input.ecologicalSensitivity,
    economicLeakageRate: input.economicLeakageRate,
    regenerativePerf: input.regenerativePerf,
  });

  const partial = {
    territoryId: input.territoryId,
    touristIntensity: input.touristIntensity,
    ecologicalSensitivity: input.ecologicalSensitivity,
    economicLeakageRate: input.economicLeakageRate,
    regenerativePerf: input.regenerativePerf,
    compositeDpi: composite,
    pressureLevel,
    createdAt,
  };

  const snapshotHash = createHash("sha256").update(canonicalize(partial)).digest("hex");

  return { ...partial, snapshotHash, operatorCohortSize: input.operatorCohortSize };
}
