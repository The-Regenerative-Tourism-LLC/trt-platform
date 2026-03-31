import { describe, it, expect } from "vitest";
import { computeP1Intensities, type RawP1Inputs } from "./p1-derive";

// ── Helpers ──────────────────────────────────────────────────────────────────

function baseTypeA(overrides: Partial<RawP1Inputs> = {}): RawP1Inputs {
  return {
    operatorType: "A",
    guestNights: 1000,
    totalElectricityKwh: 20000,
    totalGasKwh: 5000,
    totalWaterLitres: 500000,
    totalWasteKg: 2000,
    wasteRecycledKg: 600,
    wasteCompostedKg: 200,
    wasteOtherDivertedKg: 100,
    renewableOnsitePct: 30,
    renewableTariffPct: 20,
    scope3TransportKgCo2e: 500,
    siteScore: 75,
    ...overrides,
  };
}

// ── Type A (accommodation) ────────────────────────────────────────────────────

describe("Type A — guest-nights as AoU", () => {
  it("derives energy intensity correctly", () => {
    const result = computeP1Intensities(baseTypeA());
    // (20000 + 5000) / 1000 = 25
    expect(result.energyIntensity).toBe(25);
  });

  it("caps renewable pct at 100", () => {
    const result = computeP1Intensities(baseTypeA({ renewableOnsitePct: 70, renewableTariffPct: 60 }));
    expect(result.renewablePct).toBe(100);
  });

  it("sums onsite + tariff when below 100", () => {
    const result = computeP1Intensities(baseTypeA({ renewableOnsitePct: 30, renewableTariffPct: 20 }));
    expect(result.renewablePct).toBe(50);
  });

  it("derives water intensity correctly", () => {
    const result = computeP1Intensities(baseTypeA());
    // 500000 / 1000 = 500
    expect(result.waterIntensity).toBe(500);
  });

  it("derives waste diversion pct correctly", () => {
    const result = computeP1Intensities(baseTypeA());
    // (600 + 200 + 100) / 2000 * 100 = 45
    expect(result.wasteDiversionPct).toBe(45);
  });

  it("derives carbon intensity (electricity + scope3, no fuel)", () => {
    const result = computeP1Intensities(baseTypeA({ tourFuelLitresPerMonth: undefined }));
    // scope2 = 20000 * 0.149 = 2980
    // scope3 = 500
    // total = 3480 / 1000 = 3.48
    expect(result.carbonIntensity).toBe(3.48);
  });

  it("includes diesel fuel emissions in carbon intensity", () => {
    const result = computeP1Intensities(
      baseTypeA({
        tourFuelType: "diesel",
        tourFuelLitresPerMonth: 50,
        scope3TransportKgCo2e: 0,
      })
    );
    // scope2 = 20000 * 0.149 = 2980
    // fuel = 50 * 12 * 2.68 = 1608
    // total = 4588 / 1000 = 4.59 (rounded)
    expect(result.carbonIntensity).toBeCloseTo(4.59, 1);
  });

  it("includes petrol fuel emissions in carbon intensity", () => {
    const result = computeP1Intensities(
      baseTypeA({
        tourFuelType: "petrol",
        tourFuelLitresPerMonth: 50,
        scope3TransportKgCo2e: 0,
      })
    );
    // fuel = 50 * 12 * 2.31 = 1386
    // scope2 = 2980
    // total = 4366 / 1000 = 4.37 (rounded)
    expect(result.carbonIntensity).toBeCloseTo(4.37, 1);
  });

  it("includes EV kWh in carbon intensity at grid factor", () => {
    const result = computeP1Intensities(
      baseTypeA({
        tourFuelType: "electric",
        evKwhPerMonth: 100,
        scope3TransportKgCo2e: 0,
      })
    );
    // evScope2 = 100 * 12 * 0.149 = 178.8
    // scope2 = 2980
    // total = 3158.8 / 1000 = 3.16 (rounded)
    expect(result.carbonIntensity).toBeCloseTo(3.16, 1);
  });

  it("passes siteScore through unchanged", () => {
    const result = computeP1Intensities(baseTypeA({ siteScore: 82.5 }));
    expect(result.siteScore).toBe(82.5);
  });

  it("defaults siteScore to 0 when not provided", () => {
    const result = computeP1Intensities(baseTypeA({ siteScore: undefined }));
    expect(result.siteScore).toBe(0);
  });
});

// ── Type B (experience only) ──────────────────────────────────────────────────

describe("Type B — visitor-days as AoU", () => {
  it("uses visitorDays as denominator", () => {
    const raw: RawP1Inputs = {
      operatorType: "B",
      visitorDays: 2000,
      totalElectricityKwh: 10000,
      totalGasKwh: 0,
      scope3TransportKgCo2e: 0,
    };
    // 10000 / 2000 = 5
    expect(computeP1Intensities(raw).energyIntensity).toBe(5);
  });

  it("ignores guestNights for Type B", () => {
    const raw: RawP1Inputs = {
      operatorType: "B",
      guestNights: 999,
      visitorDays: 500,
      totalElectricityKwh: 5000,
    };
    // 5000 / 500 = 10
    expect(computeP1Intensities(raw).energyIntensity).toBe(10);
  });
});

// ── Type C (mixed) ────────────────────────────────────────────────────────────
//
// NOTE: Type C operators must use computeTypeCDualP1Intensities() to produce two
// separate indicator sets (acc + exp). computeP1Intensities() for Type C falls back
// to guestNights as the denominator and is only used in legacy/test paths.

describe("Type C — computeP1Intensities fallback (no blended AoU)", () => {
  it("falls back to guestNights when called directly (not blended AoU)", () => {
    // computeP1Intensities on Type C now falls back to guest_nights, not blended AoU.
    // For proper Type C computation, use computeTypeCDualP1Intensities().
    const raw: RawP1Inputs = {
      operatorType: "C",
      guestNights: 1000,
      visitorDays: 2000,
      revenueSplitAccommodationPct: 60,
      revenueSplitExperiencePct: 40,
      totalElectricityKwh: 10000,
    };
    // Uses guestNights=1000 (fallback), NOT the blended AoU (1400)
    // energyIntensity = 10000 / 1000 = 10
    expect(computeP1Intensities(raw).energyIntensity).toBe(10);
  });

  it("falls back to guestNights when revenue split not provided", () => {
    const raw: RawP1Inputs = {
      operatorType: "C",
      guestNights: 800,
      visitorDays: 200,
      totalElectricityKwh: 8000,
    };
    // fallback: guestNights=800
    // 8000 / 800 = 10
    expect(computeP1Intensities(raw).energyIntensity).toBe(10);
  });

  it("falls back to visitorDays when guestNights is 0 and no split", () => {
    const raw: RawP1Inputs = {
      operatorType: "C",
      guestNights: 0,
      visitorDays: 500,
      totalElectricityKwh: 5000,
    };
    // fallback: guestNights=0, use visitorDays=500
    // 5000 / 500 = 10
    expect(computeP1Intensities(raw).energyIntensity).toBe(10);
  });
});

// ── Divide-by-zero safety ─────────────────────────────────────────────────────

describe("divide-by-zero safety", () => {
  it("returns 0 energyIntensity when AoU is 0", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 0,
      totalElectricityKwh: 10000,
    };
    expect(computeP1Intensities(raw).energyIntensity).toBe(0);
  });

  it("returns 0 waterIntensity when AoU is 0", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 0,
      totalWaterLitres: 50000,
    };
    expect(computeP1Intensities(raw).waterIntensity).toBe(0);
  });

  it("returns 0 wasteDiversionPct when totalWasteKg is 0", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 1000,
      totalWasteKg: 0,
      wasteRecycledKg: 100,
    };
    expect(computeP1Intensities(raw).wasteDiversionPct).toBe(0);
  });

  it("returns 0 carbonIntensity when AoU is 0", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 0,
      totalElectricityKwh: 10000,
    };
    expect(computeP1Intensities(raw).carbonIntensity).toBe(0);
  });

  it("handles all inputs undefined — returns all zeros", () => {
    const raw: RawP1Inputs = { operatorType: "A" };
    const result = computeP1Intensities(raw);
    expect(result.energyIntensity).toBe(0);
    expect(result.renewablePct).toBe(0);
    expect(result.waterIntensity).toBe(0);
    expect(result.wasteDiversionPct).toBe(0);
    expect(result.carbonIntensity).toBe(0);
    expect(result.siteScore).toBe(0);
  });
});

// ── Rounding ──────────────────────────────────────────────────────────────────

describe("rounding to 2 decimal places", () => {
  it("rounds energyIntensity to 2 decimals", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 3,
      totalElectricityKwh: 10,
    };
    // 10 / 3 = 3.3333...
    expect(computeP1Intensities(raw).energyIntensity).toBe(3.33);
  });

  it("rounds waterIntensity to 2 decimals", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 7,
      totalWaterLitres: 100,
    };
    // 100 / 7 = 14.2857...
    expect(computeP1Intensities(raw).waterIntensity).toBe(14.29);
  });

  it("rounds wasteDiversionPct to 2 decimals", () => {
    const raw: RawP1Inputs = {
      operatorType: "A",
      guestNights: 1000,
      totalWasteKg: 3,
      wasteRecycledKg: 1,
    };
    // 1 / 3 * 100 = 33.333...
    expect(computeP1Intensities(raw).wasteDiversionPct).toBe(33.33);
  });
});
