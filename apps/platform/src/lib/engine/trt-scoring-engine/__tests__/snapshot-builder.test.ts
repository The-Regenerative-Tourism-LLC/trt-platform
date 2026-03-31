/**
 * Snapshot Builder Tests — AssessmentSnapshot + DeltaBlock + DpiSnapshot
 */

import { describe, it, expect } from "vitest";
import {
  buildAssessmentSnapshot,
  buildDeltaBlock,
} from "../../../snapshots/assessment-snapshot.builder";
import {
  computeDpiComposite,
  buildDpiSnapshot,
} from "../../../snapshots/dpi-snapshot.builder";
import { canonicalize } from "../canonical";
import type { AssessmentSnapshot } from "../types";

describe("buildAssessmentSnapshot", () => {
  const input = {
    operatorId: "op-001",
    operatorType: "A" as const,
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
    p3Status: "B" as const,
    delta: null,
    evidence: [],
  };

  it("creates a snapshot with a SHA-256 hash", () => {
    const snapshot = buildAssessmentSnapshot(input, "2026-01-01T00:00:00Z");
    expect(snapshot.snapshotHash).toBeDefined();
    expect(snapshot.snapshotHash.length).toBe(64);
  });

  it("is deterministic — same input produces same hash", () => {
    const ts = "2026-01-01T00:00:00Z";
    const snap1 = buildAssessmentSnapshot(input, ts);
    const snap2 = buildAssessmentSnapshot(input, ts);
    expect(snap1.snapshotHash).toBe(snap2.snapshotHash);
  });

  it("different inputs produce different hashes", () => {
    const ts = "2026-01-01T00:00:00Z";
    const snap1 = buildAssessmentSnapshot(input, ts);
    const snap2 = buildAssessmentSnapshot(
      { ...input, operatorId: "op-002" },
      ts
    );
    expect(snap1.snapshotHash).not.toBe(snap2.snapshotHash);
  });

  it("preserves all input fields", () => {
    const snapshot = buildAssessmentSnapshot(input, "2026-01-01T00:00:00Z");
    expect(snapshot.operatorId).toBe(input.operatorId);
    expect(snapshot.operatorType).toBe(input.operatorType);
    expect(snapshot.assessmentCycle).toBe(input.assessmentCycle);
    expect(snapshot.pillar1).toEqual(input.pillar1);
    expect(snapshot.pillar2).toEqual(input.pillar2);
    expect(snapshot.pillar3).toEqual(input.pillar3);
    expect(snapshot.p3Status).toBe(input.p3Status);
    expect(snapshot.delta).toBeNull();
  });

  it("pillar1Exp is included in the hash — two snapshots differing only in pillar1Exp produce different hashes", () => {
    const ts = "2026-01-01T00:00:00Z";
    const p1Exp = {
      energyIntensity: 5,
      renewablePct: 80,
      waterIntensity: 20,
      recirculationScore: 3,
      wasteDiversionPct: 90,
      carbonIntensity: 2,
      siteScore: 4,
    };
    const withExp = buildAssessmentSnapshot({ ...input, pillar1Exp: p1Exp }, ts);
    const withoutExp = buildAssessmentSnapshot(input, ts);
    expect(withExp.snapshotHash).not.toBe(withoutExp.snapshotHash);
  });

  it("pillar1Exp is preserved in the returned snapshot", () => {
    const p1Exp = {
      energyIntensity: 5,
      renewablePct: 80,
      waterIntensity: 20,
      recirculationScore: 3,
      wasteDiversionPct: 90,
      carbonIntensity: 2,
      siteScore: 4,
    };
    const snapshot = buildAssessmentSnapshot({ ...input, pillar1Exp: p1Exp }, "2026-01-01T00:00:00Z");
    expect(snapshot.pillar1Exp).toEqual(p1Exp);
  });

  it("two snapshots with different pillar1Exp values produce different hashes", () => {
    const ts = "2026-01-01T00:00:00Z";
    const p1ExpA = { energyIntensity: 5, renewablePct: 80, waterIntensity: 20, recirculationScore: 3, wasteDiversionPct: 90, carbonIntensity: 2, siteScore: 4 };
    const p1ExpB = { energyIntensity: 15, renewablePct: 30, waterIntensity: 80, recirculationScore: 1, wasteDiversionPct: 20, carbonIntensity: 8, siteScore: 1 };
    const snapA = buildAssessmentSnapshot({ ...input, pillar1Exp: p1ExpA }, ts);
    const snapB = buildAssessmentSnapshot({ ...input, pillar1Exp: p1ExpB }, ts);
    expect(snapA.snapshotHash).not.toBe(snapB.snapshotHash);
  });
});

describe("buildDeltaBlock", () => {
  it("creates a DeltaBlock with provided scores", () => {
    const baseline = { p1a: 70, p2a: 55, p3: 50 };
    const prior = { p1a: 72, p2a: 58, p3: 55 };
    const delta = buildDeltaBlock({
      priorCycle: 1,
      baselineScores: baseline,
      priorScores: prior,
    });
    expect(delta.priorCycle).toBe(1);
    expect(delta.baselineScores).toEqual(baseline);
    expect(delta.priorScores).toEqual(prior);
    expect(delta.currentScores).toEqual({});
  });
});

describe("computeDpiComposite", () => {
  it("computes weighted composite", () => {
    const result = computeDpiComposite({
      touristIntensity: 65,
      ecologicalSensitivity: 55,
      economicLeakageRate: 40,
      regenerativePerf: 45,
    });
    expect(result.composite).toBeGreaterThanOrEqual(0);
    expect(result.composite).toBeLessThanOrEqual(100);
    expect(["low", "moderate", "high"]).toContain(result.pressureLevel);
  });

  it("assigns high pressure for composite >= 66", () => {
    const result = computeDpiComposite({
      touristIntensity: 90,
      ecologicalSensitivity: 80,
      economicLeakageRate: 70,
      regenerativePerf: 10,
    });
    expect(result.pressureLevel).toBe("high");
  });

  it("assigns low pressure for composite < 33", () => {
    const result = computeDpiComposite({
      touristIntensity: 10,
      ecologicalSensitivity: 10,
      economicLeakageRate: 10,
      regenerativePerf: 95,
    });
    expect(result.pressureLevel).toBe("low");
  });
});

describe("buildDpiSnapshot", () => {
  it("creates a DPI snapshot with hash", () => {
    const dpi = buildDpiSnapshot(
      {
        territoryId: "terr-001",
        touristIntensity: 65,
        ecologicalSensitivity: 55,
        economicLeakageRate: 40,
        regenerativePerf: 45,
        operatorCohortSize: 10,
      },
      "2026-01-01T00:00:00Z"
    );
    expect(dpi.snapshotHash).toBeDefined();
    expect(dpi.snapshotHash.length).toBe(64);
    expect(dpi.compositeDpi).toBeDefined();
    expect(dpi.pressureLevel).toBeDefined();
  });
});

describe("Canonical hashing — recursive stability", () => {
  it("produces identical hashes regardless of key insertion order", () => {
    const obj1 = { z: 1, a: 2, m: { c: 3, b: 4 } };
    const obj2 = { m: { b: 4, c: 3 }, a: 2, z: 1 };
    expect(canonicalize(obj1)).toBe(canonicalize(obj2));
  });
});
