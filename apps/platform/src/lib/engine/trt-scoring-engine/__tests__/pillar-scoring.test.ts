/**
 * Pillar Scoring — P1, P2, P3 Unit Tests
 */

import { describe, it, expect } from "vitest";
import { computeP1 } from "../pillars/p1";
import { computeP2 } from "../pillars/p2";
import { computeP3 } from "../pillars/p3";
import { normalizeValue, normalizeDiscreteScore } from "../pillars/normalise";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../../../methodology/default-bundle";
import type { MethodologyBundle, P1Responses, P2Responses, P3Responses } from "../types";

const methodology = DEFAULT_METHODOLOGY_BUNDLE as MethodologyBundle;

describe("normalizeValue", () => {
  it("returns 100 for best-case lower_is_better", () => {
    const bounds = methodology.normalizationBounds["p1_energy_intensity"];
    expect(normalizeValue(10, bounds)).toBe(100);
  });

  it("returns 0 for worst-case lower_is_better", () => {
    const bounds = methodology.normalizationBounds["p1_energy_intensity"];
    expect(normalizeValue(200, bounds)).toBe(0);
  });

  it("returns 0 for null input", () => {
    const bounds = methodology.normalizationBounds["p1_energy_intensity"];
    expect(normalizeValue(null, bounds)).toBe(0);
  });

  it("returns correct band for higher_is_better", () => {
    // p1_renewable_pct bounds: b100=100, b75=75, b50=50, b25=25
    const bounds = methodology.normalizationBounds["p1_renewable_pct"];
    expect(normalizeValue(100, bounds)).toBe(100);
    expect(normalizeValue(80, bounds)).toBe(75); // 80 >= 75 but < 100
    expect(normalizeValue(75, bounds)).toBe(75);
    expect(normalizeValue(60, bounds)).toBe(50);
    expect(normalizeValue(30, bounds)).toBe(25);
    expect(normalizeValue(10, bounds)).toBe(0);
  });

  it("uses stepped bands, not interpolation", () => {
    // b100=100, b75=75: value of 76 >= b75 but < b100 → 75
    const bounds = methodology.normalizationBounds["p1_renewable_pct"];
    expect(normalizeValue(76, bounds)).toBe(75);
    expect(normalizeValue(74, bounds)).toBe(50);
  });
});

describe("normalizeDiscreteScore", () => {
  it("converts 0-4 scale to 0-100", () => {
    expect(normalizeDiscreteScore(0, 4)).toBe(0);
    expect(normalizeDiscreteScore(2, 4)).toBe(50);
    expect(normalizeDiscreteScore(4, 4)).toBe(100);
  });

  it("returns 0 for null input", () => {
    expect(normalizeDiscreteScore(null, 4)).toBe(0);
  });
});

describe("computeP1 — Operational Footprint", () => {
  const fullP1: P1Responses = {
    energyIntensity: 20,
    renewablePct: 75,
    waterIntensity: 150,
    recirculationScore: 2,
    wasteDiversionPct: 60,
    carbonIntensity: 12,
    siteScore: 3,
  };

  it("returns a score between 0 and 100", () => {
    const result = computeP1(fullP1, "A", methodology);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns all sub-scores", () => {
    const result = computeP1(fullP1, "A", methodology);
    expect(result.subScores).toHaveProperty("p1a");
    expect(result.subScores).toHaveProperty("p1b");
    expect(result.subScores).toHaveProperty("p1c");
    expect(result.subScores).toHaveProperty("p1d");
    expect(result.subScores).toHaveProperty("p1e");
  });

  it("Type B uses tour-specific bounds", () => {
    const resultA = computeP1(fullP1, "A", methodology);
    const resultB = computeP1(fullP1, "B", methodology);
    expect(resultA.score).not.toBe(resultB.score);
  });

  it("does NOT round pillar score (R6 compliance)", () => {
    const result = computeP1(fullP1, "A", methodology);
    expect(Number.isInteger(result.score)).toBe(false);
  });

  it("handles all-null inputs gracefully", () => {
    const nullP1: P1Responses = {
      energyIntensity: null,
      renewablePct: null,
      waterIntensity: null,
      recirculationScore: null,
      wasteDiversionPct: null,
      carbonIntensity: null,
      siteScore: null,
    };
    const result = computeP1(nullP1, "A", methodology);
    expect(result.score).toBe(0);
  });
});

describe("computeP2 — Local Integration", () => {
  const fullP2: P2Responses = {
    localEmploymentRate: 60,
    employmentQuality: 70,
    localFbRate: 50,
    localNonfbRate: 45,
    directBookingRate: 55,
    localOwnershipPct: 60,
    communityScore: 3,
  };

  it("returns a score between 0 and 100", () => {
    const result = computeP2(fullP2, "A", methodology);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("returns sub-scores for all components", () => {
    const result = computeP2(fullP2, "A", methodology);
    expect(result.subScores).toHaveProperty("p2a");
    expect(result.subScores).toHaveProperty("p2b");
    expect(result.subScores).toHaveProperty("p2c");
    expect(result.subScores).toHaveProperty("p2d");
  });

  it("does NOT round pillar score (R6 compliance)", () => {
    const result = computeP2(fullP2, "A", methodology);
    expect(Number.isInteger(result.score)).toBe(false);
  });
});

describe("computeP3 — Regenerative Contribution", () => {
  const fullP3: P3Responses = {
    categoryScope: 75,
    traceability: 75,
    additionality: 50,
    continuity: 75,
  };

  it("returns full score for Status A-C", () => {
    const result = computeP3(fullP3, "B", methodology);
    expect(result.score).toBeGreaterThan(0);
    expect(result.isForwardCommitment).toBe(false);
    expect(result.isNotApplicable).toBe(false);
  });

  it("Status D returns score 0 and isForwardCommitment", () => {
    const result = computeP3(fullP3, "D", methodology);
    expect(result.score).toBe(0);
    expect(result.isForwardCommitment).toBe(true);
    expect(result.isNotApplicable).toBe(false);
  });

  it("Status E returns score 0 and isNotApplicable", () => {
    const result = computeP3(fullP3, "E", methodology);
    expect(result.score).toBe(0);
    expect(result.isForwardCommitment).toBe(false);
    expect(result.isNotApplicable).toBe(true);
  });

  it("does NOT round pillar score (R6 compliance)", () => {
    const result = computeP3(fullP3, "A", methodology);
    expect(result.score).toBe(70);
  });
});
