/**
 * Golden Test Vectors — TRT Scoring Engine
 *
 * These tests define known-good input/output pairs.
 * CI MUST fail if any golden test changes output.
 * Protect scoring integrity across all refactors.
 */

import { describe, it, expect } from "vitest";
import { computeScore } from "../compute-score";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../../../methodology/default-bundle";
import type { AssessmentSnapshot, DpiSnapshot } from "../types";

const MOCK_DPI: DpiSnapshot = {
  territoryId: "territory-madeira",
  touristIntensity: 65,
  ecologicalSensitivity: 55,
  economicLeakageRate: 40,
  regenerativePerf: 45,
  compositeDpi: 56,
  pressureLevel: "moderate",
  snapshotHash: "dpi-hash-001",
  createdAt: "2026-03-01T00:00:00Z",
};

const BASELINE_SNAPSHOT: AssessmentSnapshot = {
  operatorId: "op-001",
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
  snapshotHash: "snap-hash-001",
  createdAt: "2026-01-15T00:00:00Z",
};

describe("TRT Scoring Engine — Golden Vectors", () => {
  it("GV-001: Baseline cycle (Cycle 1) — no DPS", () => {
    const result = computeScore(BASELINE_SNAPSHOT, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);

    // DPS must be null on Cycle 1
    expect(result.dpsTotal).toBeNull();
    expect(result.dps1).toBeNull();
    expect(result.dps2).toBeNull();
    expect(result.dps3).toBeNull();
    expect(result.dpsBand).toBeNull();

    // GPS must be in valid range
    expect(result.gpsTotal).toBeGreaterThanOrEqual(0);
    expect(result.gpsTotal).toBeLessThanOrEqual(100);

    // DPI context must be passed through unchanged
    expect(result.dpiScore).toBe(56);
    expect(result.dpiPressureLevel).toBe("moderate");

    // Computation trace must have all pillars
    expect(result.computationTrace.p1SubScores).toBeDefined();
    expect(result.computationTrace.p2SubScores).toBeDefined();
    expect(result.computationTrace.p3SubScores).toBeDefined();

    // Freeze expected output for regression protection
    // These values are the authoritative golden outputs — must not change
    // R6 fix: pillar sub-scores are full-precision floats; only gpsTotal is rounded
    expect(result.p1Score).toBe(76.65);
    expect(result.p2Score).toBe(70.55);
    expect(result.p3Score).toBe(70);
    expect(result.gpsTotal).toBe(73);
    expect(result.gpsBand).toBe("regenerative_practice");
  });

  it("GV-002: Type B operator uses tour-specific normalisation bounds", () => {
    const tourSnapshot: AssessmentSnapshot = {
      ...BASELINE_SNAPSHOT,
      operatorId: "op-002",
      operatorType: "B",
      activityUnit: { visitorDays: 2000 },
      pillar1: {
        ...BASELINE_SNAPSHOT.pillar1,
        energyIntensity: 8, // moderate for tours
        carbonIntensity: 5,
      },
    };

    const typeAResult = computeScore(BASELINE_SNAPSHOT, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);
    const typeBResult = computeScore(tourSnapshot, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);

    // Type B uses different bounds so scores will differ
    expect(typeAResult.p1Score).not.toEqual(typeBResult.p1Score);
  });

  it("GV-003: Status D operator — P3 = 0 (forward commitment)", () => {
    const snapshot: AssessmentSnapshot = {
      ...BASELINE_SNAPSHOT,
      p3Status: "D",
    };

    const result = computeScore(snapshot, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);
    expect(result.p3Score).toBe(0);
  });

  it("GV-004: GPS is clamped to [0, 100]", () => {
    // Perfect operator
    const perfectSnapshot: AssessmentSnapshot = {
      ...BASELINE_SNAPSHOT,
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

    const result = computeScore(perfectSnapshot, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);
    expect(result.gpsTotal).toBeLessThanOrEqual(100);
    expect(result.gpsTotal).toBeGreaterThanOrEqual(0);
  });

  it("GV-005: Cycle 2 — DPS computed from delta block", () => {
    const cycle2Snapshot: AssessmentSnapshot = {
      ...BASELINE_SNAPSHOT,
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

    const result = computeScore(cycle2Snapshot, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);

    // DPS must be computed on Cycle 2
    expect(result.dpsTotal).not.toBeNull();
    expect(result.dps1).not.toBeNull();
    expect(result.dps2).not.toBeNull();
    expect(result.dps3).not.toBeNull();
    expect(result.dpsBand).not.toBeNull();
  });

  it("GV-006: Engine is deterministic — same inputs produce same output", () => {
    const result1 = computeScore(BASELINE_SNAPSHOT, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);
    const result2 = computeScore(BASELINE_SNAPSHOT, MOCK_DPI, DEFAULT_METHODOLOGY_BUNDLE);

    expect(result1.gpsTotal).toBe(result2.gpsTotal);
    expect(result1.gpsBand).toBe(result2.gpsBand);
    expect(result1.p1Score).toBe(result2.p1Score);
    expect(result1.p2Score).toBe(result2.p2Score);
    expect(result1.p3Score).toBe(result2.p3Score);
    expect(JSON.stringify(result1.computationTrace)).toBe(
      JSON.stringify(result2.computationTrace)
    );
  });
});
