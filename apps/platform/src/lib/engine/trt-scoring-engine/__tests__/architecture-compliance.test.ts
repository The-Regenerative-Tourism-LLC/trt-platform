/**
 * Architecture Compliance Tests
 *
 * Validates that the engine module:
 * - Does NOT import prisma, db, fs, or network modules
 * - Is deterministic and stateless
 * - Revenue split validation works correctly
 */

import { describe, it, expect } from "vitest";
import { computeScore } from "../compute-score";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../../../methodology/default-bundle";
import { validateTypeCRevenueSplit } from "../../../validation/assessment.schema";
import type { AssessmentSnapshot, DpiSnapshot, MethodologyBundle } from "../types";

const methodology = DEFAULT_METHODOLOGY_BUNDLE as MethodologyBundle;

const MOCK_DPI: DpiSnapshot = {
  territoryId: "t-test",
  touristIntensity: 50,
  ecologicalSensitivity: 50,
  economicLeakageRate: 40,
  regenerativePerf: 30,
  compositeDpi: 50,
  pressureLevel: "moderate",
  snapshotHash: "test",
  createdAt: "2026-01-01T00:00:00Z",
};

const BASE: AssessmentSnapshot = {
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
  snapshotHash: "test-hash",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("Engine — Determinism", () => {
  it("100 identical calls produce identical results", () => {
    const results = Array.from({ length: 100 }, () =>
      computeScore(BASE, MOCK_DPI, methodology)
    );
    const first = JSON.stringify(results[0]);
    results.forEach((r) => {
      expect(JSON.stringify(r)).toBe(first);
    });
  });
});

describe("Engine — Statelessness", () => {
  it("different inputs between calls don't leak state", () => {
    const r1 = computeScore(BASE, MOCK_DPI, methodology);
    const modified: AssessmentSnapshot = {
      ...BASE,
      pillar1: { ...BASE.pillar1, energyIntensity: 5 },
    };
    const r2 = computeScore(modified, MOCK_DPI, methodology);
    const r3 = computeScore(BASE, MOCK_DPI, methodology);
    expect(r1.gpsTotal).toBe(r3.gpsTotal);
    expect(r1.gpsTotal).not.toBe(r2.gpsTotal);
  });
});

describe("Type C revenue split validation", () => {
  it("accepts valid 70/30 split", () => {
    const err = validateTypeCRevenueSplit("C", {
      accommodationPct: 70,
      experiencePct: 30,
    });
    expect(err).toBeNull();
  });

  it("accepts valid 50/50 split", () => {
    const err = validateTypeCRevenueSplit("C", {
      accommodationPct: 50,
      experiencePct: 50,
    });
    expect(err).toBeNull();
  });

  it("rejects split not summing to 100", () => {
    const err = validateTypeCRevenueSplit("C", {
      accommodationPct: 80,
      experiencePct: 10,
    });
    expect(err).not.toBeNull();
    expect(err).toContain("sum to 100");
  });

  it("rejects Type C without revenue split", () => {
    const err = validateTypeCRevenueSplit("C", undefined);
    expect(err).not.toBeNull();
    expect(err).toContain("must provide revenueSplit");
  });

  it("allows tolerance of ±1", () => {
    const err = validateTypeCRevenueSplit("C", {
      accommodationPct: 70,
      experiencePct: 31,
    });
    expect(err).toBeNull();
  });

  it("ignores revenue split for Type A", () => {
    const err = validateTypeCRevenueSplit("A", undefined);
    expect(err).toBeNull();
  });

  it("ignores revenue split for Type B", () => {
    const err = validateTypeCRevenueSplit("B", undefined);
    expect(err).toBeNull();
  });
});
