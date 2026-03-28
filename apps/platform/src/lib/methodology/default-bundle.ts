/**
 * Default Methodology Bundle — Version 1.0.0
 *
 * This is the authoritative scoring configuration for the TRT Scoring Engine.
 * Weights, thresholds, and normalisation bounds defined here implement
 * the White Paper v2.0 and Operator Assessment Form v3.
 *
 * This bundle is injected into the engine at compute time.
 * It must never be accessed directly by frontend components.
 * Changes to this bundle must result in a new version — old bundles are never deleted.
 */

import type { MethodologyBundle } from "../engine/trt-scoring-engine/types";

export const DEFAULT_METHODOLOGY_BUNDLE: MethodologyBundle = {
  version: "1.0.0",
  publishedAt: "2026-03-01T00:00:00Z",

  pillarWeights: { p1: 0.40, p2: 0.30, p3: 0.30 },

  p1SubWeights: { energy: 0.30, water: 0.25, waste: 0.20, carbon: 0.15, site: 0.10 },
  p2SubWeights: { employment: 0.35, procurement: 0.30, revenueRetention: 0.20, community: 0.15 },
  p3SubWeights: { categoryScope: 0.40, traceability: 0.30, additionality: 0.20, continuity: 0.10 },

  p1CompositeWeights: {
    energyIntensityIn1a: 0.60,
    renewablePctIn1a: 0.40,
    localEmploymentRateIn2a: 0.60,
    employmentQualityIn2a: 0.40,
  },

  dpsConfig: {
    dps1Min: -10,
    dps1Max: 10,
    dps2Multiplier: 10,
    dps3Bonus: 5,
    dps3Threshold: 10,
  },

  bandThresholds: {
    regenerativeLeader: 85,
    regenerativePractice: 70,
    advancing: 55,
    developing: 40,
  },

  // Accommodation operators (Type A / Type C)
  normalizationBounds: {
    p1_energy_intensity:    { b100: 15, b75: 30, b50: 55, b25: 80, dir: "lower_is_better" },
    p1_renewable_pct:       { b100: 100, b75: 75, b50: 50, b25: 25, dir: "higher_is_better" },
    p1_water_intensity:     { b100: 80, b75: 150, b50: 250, b25: 400, dir: "lower_is_better" },
    p1_waste_diversion_pct: { b100: 80, b75: 60, b50: 40, b25: 20, dir: "higher_is_better" },
    p1_carbon_intensity:    { b100: 5, b75: 15, b50: 30, b25: 50, dir: "lower_is_better" },
    p2_local_employment:    { b100: 80, b75: 60, b50: 40, b25: 20, dir: "higher_is_better" },
    p2_local_fb_rate:       { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_local_nonfb_rate:    { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_direct_booking_rate: { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_local_ownership_pct: { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
  },

  // Experience operators (Type B) — different operational scale
  normalizationBoundsTours: {
    p1_energy_intensity:    { b100: 2, b75: 5, b50: 10, b25: 20, dir: "lower_is_better" },
    p1_renewable_pct:       { b100: 100, b75: 75, b50: 50, b25: 25, dir: "higher_is_better" },
    p1_water_intensity:     { b100: 1, b75: 3, b50: 5, b25: 10, dir: "lower_is_better" },
    p1_waste_diversion_pct: { b100: 80, b75: 60, b50: 40, b25: 20, dir: "higher_is_better" },
    p1_carbon_intensity:    { b100: 1, b75: 3, b50: 8, b25: 15, dir: "lower_is_better" },
    p2_local_employment:    { b100: 80, b75: 60, b50: 40, b25: 20, dir: "higher_is_better" },
    p2_local_fb_rate:       { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_local_nonfb_rate:    { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_direct_booking_rate: { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
    p2_local_ownership_pct: { b100: 70, b75: 50, b50: 30, b25: 10, dir: "higher_is_better" },
  },
} as const;
