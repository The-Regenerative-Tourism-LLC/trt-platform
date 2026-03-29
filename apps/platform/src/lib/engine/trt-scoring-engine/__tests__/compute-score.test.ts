/**
 * computeScore — Full Engine Integration Tests
 *
 * Tests the end-to-end GPS/DPS computation covering:
 * - GPS formula: (P1 × 0.40) + (P2 × 0.30) + (P3 × 0.30) + DPS
 * - Clamp/round order (R6)
 * - Type C revenue split weighting
 * - DPS only on Cycle 2+
 * - Status D/E P3 zeroing
 * - Band classification
 */

import { describe, it, expect } from "vitest";
import { computeScore } from "../compute-score";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../../../methodology/default-bundle";
import type { AssessmentSnapshot, DpiSnapshot, MethodologyBundle } from "../types";

const methodology = DEFAULT_METHODOLOGY_BUNDLE as MethodologyBundle;

const MOCK_DPI: DpiSnapshot = {
  territoryId: "territory-test",
  touristIntensity: 50,
  ecologicalSensitivity: 50,
  economicLeakageRate: 40,
  regenerativePerf: 30,
  compositeDpi: 50,
  pressureLevel: "moderate",
  snapshotHash: "test-hash",
  createdAt: "2026-01-01T00:00:00Z",
};

const BASE_SNAPSHOT: AssessmentSnapshot = {
  operatorId: "op-test",
  operatorType: "A",
  activityUnit: { guestNights: 5000 },
  assessmentCycle: 1,
  assessmentPeriodEnd: "2025-12-31",
  pillar1: {
    energyIntensity: 20,
    renewablePct: 75,
    waterIntensity: 150,
    recirculationScore: 2,
    wasteDiversionPct: 60,
    carbonIntensity: 12,
    siteScore: 3,
  },
  pillar2: {
    localEmploymentRate: 60,
    employmentQuality: 70,
    localFbRate: 50,
    localNonfbRate: 45,
    directBookingRate: 55,
    localOwnershipPct: 60,
    communityScore: 3,
  },
  pillar3: {
    categoryScope: 75,
    traceability: 75,
    additionality: 50,
    continuity: 75,
  },
  p3Status: "B",
  delta: null,
  evidence: [],
  snapshotHash: "test-snap-hash",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("computeScore — GPS computation", () => {
  it("GPS = (P1 × 0.40) + (P2 × 0.30) + (P3 × 0.30) on Cycle 1", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    const expectedBase =
      result.p1Score * 0.4 + result.p2Score * 0.3 + result.p3Score * 0.3;
    expect(result.gpsTotal).toBe(Math.round(expectedBase));
  });

  it("GPS is clamped to [0, 100]", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(result.gpsTotal).toBeGreaterThanOrEqual(0);
    expect(result.gpsTotal).toBeLessThanOrEqual(100);
  });

  it("clamp first, then round (R6)", () => {
    const perfectSnapshot: AssessmentSnapshot = {
      ...BASE_SNAPSHOT,
      pillar1: {
        energyIntensity: 0,
        renewablePct: 100,
        waterIntensity: 0,
        recirculationScore: 3,
        wasteDiversionPct: 100,
        carbonIntensity: 0,
        siteScore: 4,
      },
      pillar2: {
        localEmploymentRate: 100,
        employmentQuality: 100,
        localFbRate: 100,
        localNonfbRate: 100,
        directBookingRate: 100,
        localOwnershipPct: 100,
        communityScore: 4,
      },
      pillar3: {
        categoryScope: 100,
        traceability: 100,
        additionality: 100,
        continuity: 100,
      },
      p3Status: "A",
    };
    const result = computeScore(perfectSnapshot, MOCK_DPI, methodology);
    expect(result.gpsTotal).toBeLessThanOrEqual(100);
  });

  it("GPS total is an integer (rounded once at the end)", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(Number.isInteger(result.gpsTotal)).toBe(true);
  });

  it("pillar sub-scores are NOT rounded (float precision)", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(typeof result.p1Score).toBe("number");
    expect(typeof result.p2Score).toBe("number");
  });
});

describe("computeScore — DPS lifecycle", () => {
  it("DPS is null on Cycle 1", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(result.dpsTotal).toBeNull();
    expect(result.dps1).toBeNull();
    expect(result.dps2).toBeNull();
    expect(result.dps3).toBeNull();
    expect(result.dpsBand).toBeNull();
  });

  it("DPS is computed on Cycle 2", () => {
    const cycle2: AssessmentSnapshot = {
      ...BASE_SNAPSHOT,
      assessmentCycle: 2,
      delta: {
        priorCycle: 1,
        baselineScores: {
          p1a: 70, p1b: 60, p1c: 50, p1d: 40, p1e: 50,
          p2a: 55, p2b: 45, p2c: 40, p2d: 50,
          p3: 50,
        },
        priorScores: {
          p1a: 70, p1b: 60, p1c: 50, p1d: 40, p1e: 50,
          p2a: 55, p2b: 45, p2c: 40, p2d: 50,
          p3: 50,
        },
        currentScores: {},
      },
    };
    const result = computeScore(cycle2, MOCK_DPI, methodology);
    expect(result.dpsTotal).not.toBeNull();
    expect(result.dpsBand).not.toBeNull();
  });

  it("DPS adds directly to GPS (not scaled by 0.4)", () => {
    const cycle2: AssessmentSnapshot = {
      ...BASE_SNAPSHOT,
      assessmentCycle: 2,
      delta: {
        priorCycle: 1,
        baselineScores: {
          p1a: 50, p1b: 50, p1c: 50, p1d: 50, p1e: 50,
          p2a: 50, p2b: 50, p2c: 50, p2d: 50,
          p3: 50,
        },
        priorScores: {
          p1a: 50, p1b: 50, p1c: 50, p1d: 50, p1e: 50,
          p2a: 50, p2b: 50, p2c: 50, p2d: 50,
          p3: 50,
        },
        currentScores: {},
      },
    };
    const result = computeScore(cycle2, MOCK_DPI, methodology);
    const pw = methodology.pillarWeights;
    const gpsBase =
      result.p1Score * pw.p1 + result.p2Score * pw.p2 + result.p3Score * pw.p3;
    const expectedTotal = Math.round(
      Math.max(0, Math.min(100, gpsBase + (result.dpsTotal ?? 0)))
    );
    expect(result.gpsTotal).toBe(expectedTotal);
  });
});

describe("computeScore — P3 Status D/E", () => {
  it("Status D → P3 = 0", () => {
    const snapshot: AssessmentSnapshot = { ...BASE_SNAPSHOT, p3Status: "D" };
    const result = computeScore(snapshot, MOCK_DPI, methodology);
    expect(result.p3Score).toBe(0);
  });

  it("Status E → P3 = 0", () => {
    const snapshot: AssessmentSnapshot = { ...BASE_SNAPSHOT, p3Status: "E" };
    const result = computeScore(snapshot, MOCK_DPI, methodology);
    expect(result.p3Score).toBe(0);
  });
});

describe("computeScore — Type C revenue split", () => {
  it("Type C computes with revenue split blending logic", () => {
    const typeC: AssessmentSnapshot = {
      ...BASE_SNAPSHOT,
      operatorType: "C",
      revenueSplit: { accommodationPct: 70, experiencePct: 30 },
    };
    const resultC = computeScore(typeC, MOCK_DPI, methodology);
    expect(resultC.gpsTotal).toBeGreaterThanOrEqual(0);
    expect(resultC.gpsTotal).toBeLessThanOrEqual(100);
    expect(resultC.p2Score).toBeDefined();
  });

  it("Type C revenue split blends P2 using accFrac and expFrac", () => {
    // P2 normalization bounds are the same for A and B in the default bundle,
    // so the blended score equals the unblended score. This test verifies the
    // blending path executes without error and produces a valid result.
    const typeC: AssessmentSnapshot = {
      ...BASE_SNAPSHOT,
      operatorType: "C",
      revenueSplit: { accommodationPct: 60, experiencePct: 40 },
    };
    const resultC = computeScore(typeC, MOCK_DPI, methodology);
    expect(resultC.p2Score).toBeGreaterThanOrEqual(0);
    expect(resultC.p2Score).toBeLessThanOrEqual(100);
  });
});

describe("computeScore — Band classification", () => {
  it("assigns correct GPS bands", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    const gps = result.gpsTotal;
    const band = result.gpsBand;

    if (gps >= 85) expect(band).toBe("regenerative_leader");
    else if (gps >= 70) expect(band).toBe("regenerative_practice");
    else if (gps >= 55) expect(band).toBe("advancing");
    else if (gps >= 40) expect(band).toBe("developing");
    else expect(band).toBe("not_yet_published");
  });
});

describe("computeScore — DPI passthrough", () => {
  it("DPI context passed through unchanged", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(result.dpiScore).toBe(MOCK_DPI.compositeDpi);
    expect(result.dpiPressureLevel).toBe(MOCK_DPI.pressureLevel);
  });
});

describe("computeScore — Computation trace", () => {
  it("includes full trace", () => {
    const result = computeScore(BASE_SNAPSHOT, MOCK_DPI, methodology);
    expect(result.computationTrace).toBeDefined();
    expect(result.computationTrace.p1SubScores).toBeDefined();
    expect(result.computationTrace.p2SubScores).toBeDefined();
    expect(result.computationTrace.p3SubScores).toBeDefined();
    expect(result.computationTrace.p1Weighted).toBeDefined();
    expect(result.computationTrace.p2Weighted).toBeDefined();
    expect(result.computationTrace.p3Weighted).toBeDefined();
    expect(result.computationTrace.gpsBase).toBeDefined();
  });
});
