/**
 * P1 Derivation Tests
 *
 * Tests for computeP1Intensities and computeTypeCDualP1Intensities.
 */

import { describe, it, expect } from "vitest";
import {
  computeP1Intensities,
  computeTypeCDualP1Intensities,
} from "../p1-derive";

const BASE_RAW = {
  totalElectricityKwh: 10000,
  totalWaterLitres: 50000,
  totalWasteKg: 1000,
  wasteRecycledKg: 600,
  siteScore: 2,
};

describe("computeP1Intensities — Type A", () => {
  it("divides energy by guestNights", () => {
    const result = computeP1Intensities({
      ...BASE_RAW,
      operatorType: "A",
      guestNights: 1000,
    });
    // 10000 kWh / 1000 guestNights = 10
    expect(result.energyIntensity).toBe(10);
  });

  it("divides water by guestNights", () => {
    const result = computeP1Intensities({
      ...BASE_RAW,
      operatorType: "A",
      guestNights: 500,
    });
    expect(result.waterIntensity).toBe(100); // 50000 / 500
  });
});

describe("computeP1Intensities — Type B", () => {
  it("divides energy by visitorDays", () => {
    const result = computeP1Intensities({
      ...BASE_RAW,
      operatorType: "B",
      visitorDays: 2000,
    });
    expect(result.energyIntensity).toBe(5); // 10000 / 2000
  });
});

describe("computeTypeCDualP1Intensities — Type C dual AoU", () => {
  const RAW_C = {
    ...BASE_RAW,
    operatorType: "C" as const,
    guestNights: 1000,
    visitorDays: 5000,
    revenueSplitAccommodationPct: 60,
    revenueSplitExperiencePct: 40,
  };

  it("returns two indicator sets", () => {
    const dual = computeTypeCDualP1Intensities(RAW_C);
    expect(dual.acc).toBeDefined();
    expect(dual.exp).toBeDefined();
  });

  it("acc indicators use guest_nights as AoU", () => {
    const dual = computeTypeCDualP1Intensities(RAW_C);
    // 10000 / 1000 = 10
    expect(dual.acc.energyIntensity).toBe(10);
  });

  it("exp indicators use visitor_days as AoU", () => {
    const dual = computeTypeCDualP1Intensities(RAW_C);
    // 10000 / 5000 = 2
    expect(dual.exp.energyIntensity).toBe(2);
  });

  it("acc and exp energy intensities differ when guestNights ≠ visitorDays", () => {
    const dual = computeTypeCDualP1Intensities(RAW_C);
    expect(dual.acc.energyIntensity).not.toBe(dual.exp.energyIntensity);
  });

  it("renewable % is AoU-independent and equals in both sides", () => {
    const raw = {
      ...RAW_C,
      renewableOnsitePct: 30,
      renewableTariffPct: 20,
    };
    const dual = computeTypeCDualP1Intensities(raw);
    expect(dual.acc.renewablePct).toBe(50);
    expect(dual.exp.renewablePct).toBe(50);
  });

  it("waste diversion % is AoU-independent and equals in both sides", () => {
    // 600 / 1000 = 60%
    const dual = computeTypeCDualP1Intensities(RAW_C);
    expect(dual.acc.wasteDiversionPct).toBe(60);
    expect(dual.exp.wasteDiversionPct).toBe(60);
  });

  it("does NOT use the old blended AoU formula", () => {
    const dual = computeTypeCDualP1Intensities(RAW_C);
    // Old blended AoU: (1000*60 + 5000*40) / 100 = (60000+200000)/100 = 2600
    // Old energy intensity: 10000 / 2600 ≈ 3.85
    const oldBlendedAoU = (1000 * 60 + 5000 * 40) / 100;
    const oldEnergyIntensity = Math.round((10000 / oldBlendedAoU) * 100) / 100;
    // Neither acc (10) nor exp (2) equals the old blended value (≈3.85)
    expect(dual.acc.energyIntensity).not.toBe(oldEnergyIntensity);
    expect(dual.exp.energyIntensity).not.toBe(oldEnergyIntensity);
  });
});
