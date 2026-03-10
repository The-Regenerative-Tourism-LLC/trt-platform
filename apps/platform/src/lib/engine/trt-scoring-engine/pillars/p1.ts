import type { P1Responses, MethodologyBundle } from "../types";
import { normalizeValue, normalizeDiscreteScore } from "./normalise";

export interface P1Result {
  readonly score: number;
  readonly subScores: {
    readonly p1a: number;
    readonly p1b: number;
    readonly p1c: number;
    readonly p1d: number;
    readonly p1e: number;
    readonly waterRecirc: number;
  };
}

/**
 * Compute Pillar 1 — Operational Footprint.
 * Uses operator-type-specific normalisation bounds for Type B (Experience).
 */
export function computeP1(
  responses: P1Responses,
  operatorType: "A" | "B" | "C",
  methodology: MethodologyBundle
): P1Result {
  const nb =
    operatorType === "B" && methodology.normalizationBoundsTours
      ? methodology.normalizationBoundsTours
      : methodology.normalizationBounds;

  const w = methodology.p1SubWeights;
  const cw = methodology.p1CompositeWeights;

  // 1A: Energy — composite of intensity + renewable %
  const energyIntensityScore = normalizeValue(
    responses.energyIntensity,
    nb["p1_energy_intensity"]
  );
  const renewableScore = normalizeValue(
    responses.renewablePct,
    nb["p1_renewable_pct"]
  );
  const p1a =
    energyIntensityScore * cw.energyIntensityIn1a +
    renewableScore * cw.renewablePctIn1a;

  // 1B: Water — base intensity + recirculation bonus
  const p1bBase = normalizeValue(responses.waterIntensity, nb["p1_water_intensity"]);
  const waterRecirc = responses.recirculationScore ?? 0;
  const p1b = Math.min(100, p1bBase + waterRecirc * 3.3);

  // 1C: Waste diversion
  const p1c = normalizeValue(responses.wasteDiversionPct, nb["p1_waste_diversion_pct"]);

  // 1D: Carbon & transport intensity
  const p1d = normalizeValue(responses.carbonIntensity, nb["p1_carbon_intensity"]);

  // 1E: Site & land use — discrete 0-4
  const p1e = normalizeDiscreteScore(responses.siteScore, 4);

  const score = Math.round(
    p1a * w.energy +
    p1b * w.water +
    p1c * w.waste +
    p1d * w.carbon +
    p1e * w.site
  );

  return {
    score,
    subScores: { p1a, p1b, p1c, p1d, p1e, waterRecirc },
  };
}
