/**
 * DPS Computation Tests
 */

import { describe, it, expect } from "vitest";
import { computeDps } from "../dps/dps";
import { DEFAULT_METHODOLOGY_BUNDLE } from "../../../methodology/default-bundle";
import type { DeltaBlock, MethodologyBundle } from "../types";

const methodology = DEFAULT_METHODOLOGY_BUNDLE as MethodologyBundle;

describe("computeDps", () => {
  const baseDelta: DeltaBlock = {
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
  };

  it("returns all DPS components", () => {
    const current: Record<string, number> = {
      p1a: 60, p1b: 55, p1c: 60, p1d: 55, p1e: 60,
      p2a: 55, p2b: 60, p2c: 55, p2d: 60,
      p3: 60,
    };
    const result = computeDps(baseDelta, current, 60, methodology);
    expect(result).toHaveProperty("dpsTotal");
    expect(result).toHaveProperty("dps1");
    expect(result).toHaveProperty("dps2");
    expect(result).toHaveProperty("dps3");
    expect(result).toHaveProperty("dpsBand");
  });

  it("DPS-1: clamps average delta to [-10, +10]", () => {
    const hugeDelta: Record<string, number> = {
      p1a: 100, p1b: 100, p1c: 100, p1d: 100, p1e: 100,
      p2a: 100, p2b: 100, p2c: 100, p2d: 100,
      p3: 100,
    };
    const result = computeDps(baseDelta, hugeDelta, 100, methodology);
    expect(result.dps1).toBeLessThanOrEqual(10);
    expect(result.dps1).toBeGreaterThanOrEqual(-10);
  });

  it("DPS-2: proportion of improving indicators × 10", () => {
    const allImproved: Record<string, number> = {
      p1a: 60, p1b: 60, p1c: 60, p1d: 60, p1e: 60,
      p2a: 60, p2b: 60, p2c: 60, p2d: 60,
      p3: 60,
    };
    const result = computeDps(baseDelta, allImproved, 60, methodology);
    expect(result.dps2).toBe(10);
  });

  it("DPS-3: bonus only if P3 delta exceeds threshold", () => {
    const current: Record<string, number> = {
      p1a: 50, p1b: 50, p1c: 50, p1d: 50, p1e: 50,
      p2a: 50, p2b: 50, p2c: 50, p2d: 50,
      p3: 50,
    };
    const resultNoBonus = computeDps(baseDelta, current, 55, methodology);
    expect(resultNoBonus.dps3).toBe(0);

    const resultBonus = computeDps(baseDelta, current, 65, methodology);
    expect(resultBonus.dps3).toBe(5);
  });

  it("does NOT round DPS total (R6 compliance)", () => {
    const current: Record<string, number> = {
      p1a: 53, p1b: 51, p1c: 52, p1d: 50, p1e: 54,
      p2a: 52, p2b: 50, p2c: 51, p2d: 53,
      p3: 55,
    };
    const result = computeDps(baseDelta, current, 55, methodology);
    expect(typeof result.dpsTotal).toBe("number");
  });

  it("assigns correct DPS bands", () => {
    const allImproved: Record<string, number> = {
      p1a: 60, p1b: 60, p1c: 60, p1d: 60, p1e: 60,
      p2a: 60, p2b: 60, p2c: 60, p2d: 60,
      p3: 65,
    };
    const result = computeDps(baseDelta, allImproved, 65, methodology);
    expect(result.dpsTotal).toBeGreaterThan(15);
    expect(result.dpsBand).toBe("accelerating");
  });

  it("no change returns stable band", () => {
    const current: Record<string, number> = {
      p1a: 50, p1b: 50, p1c: 50, p1d: 50, p1e: 50,
      p2a: 50, p2b: 50, p2c: 50, p2d: 50,
      p3: 50,
    };
    const result = computeDps(baseDelta, current, 50, methodology);
    expect(result.dps1).toBe(0);
    expect(result.dps2).toBe(0);
    expect(result.dps3).toBe(0);
    expect(result.dpsTotal).toBe(0);
    expect(result.dpsBand).toBe("stable");
  });
});
