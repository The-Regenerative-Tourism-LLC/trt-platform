import { describe, it, expect } from "vitest";
import { computeP2Rates, type RawP2Inputs } from "./p2-derive";

function base(overrides: Partial<RawP2Inputs> = {}): RawP2Inputs {
  return {
    totalFte: 10,
    localFte: 7,
    permanentContractPct: 80,
    averageMonthlyWage: 1200,
    minimumWage: 800,
    totalFbSpend: 50000,
    localFbSpend: 35000,
    totalNonFbSpend: 20000,
    localNonFbSpend: 12000,
    directBookingPct: 60,
    localOwnershipPct: 100,
    communityScore: 70,
    soloOperator: false,
    tourNoFbSpend: false,
    tourNoNonFbSpend: false,
    ...overrides,
  };
}

// ── Local employment rate ─────────────────────────────────────────────────────

describe("localEmploymentRate", () => {
  it("computes localFte / totalFte * 100", () => {
    const r = computeP2Rates(base({ localFte: 7, totalFte: 10 }));
    expect(r.localEmploymentRate).toBe(70);
  });

  it("returns 0 when totalFte is 0", () => {
    const r = computeP2Rates(base({ totalFte: 0, localFte: 0 }));
    expect(r.localEmploymentRate).toBe(0);
  });

  it("clamps to 100 if ratio exceeds 100", () => {
    const r = computeP2Rates(base({ localFte: 12, totalFte: 10 }));
    expect(r.localEmploymentRate).toBe(100);
  });

  it("returns 100 for soloOperator regardless of FTE values", () => {
    const r = computeP2Rates(base({ soloOperator: true, localFte: 0, totalFte: 0 }));
    expect(r.localEmploymentRate).toBe(100);
  });
});

// ── Employment quality ────────────────────────────────────────────────────────

describe("employmentQuality", () => {
  it("computes (permanentPct * 0.5) + (wageRatio * 100 * 0.5)", () => {
    // (80 * 0.5) + (1200/800 * 100 * 0.5) = 40 + 75 = 115 → clamped to 100
    const r = computeP2Rates(base());
    expect(r.employmentQuality).toBe(100);
  });

  it("computes correctly when wage is exactly at minimum", () => {
    // (60 * 0.5) + (800/800 * 100 * 0.5) = 30 + 50 = 80
    const r = computeP2Rates(base({ permanentContractPct: 60, averageMonthlyWage: 800, minimumWage: 800 }));
    expect(r.employmentQuality).toBe(80);
  });

  it("computes correctly when wage is below minimum", () => {
    // (50 * 0.5) + (600/800 * 100 * 0.5) = 25 + 37.5 = 62.5
    const r = computeP2Rates(base({ permanentContractPct: 50, averageMonthlyWage: 600, minimumWage: 800 }));
    expect(r.employmentQuality).toBe(62.5);
  });

  it("returns 0 when minimumWage is 0", () => {
    const r = computeP2Rates(base({ minimumWage: 0, permanentContractPct: 0 }));
    expect(r.employmentQuality).toBe(0);
  });

  it("returns 100 for soloOperator", () => {
    const r = computeP2Rates(base({ soloOperator: true, permanentContractPct: 0, averageMonthlyWage: 0, minimumWage: 800 }));
    expect(r.employmentQuality).toBe(100);
  });
});

// ── Local F&B rate ────────────────────────────────────────────────────────────

describe("localFbRate", () => {
  it("computes localFbSpend / totalFbSpend * 100", () => {
    const r = computeP2Rates(base({ localFbSpend: 35000, totalFbSpend: 50000 }));
    expect(r.localFbRate).toBe(70);
  });

  it("returns 0 when totalFbSpend is 0", () => {
    const r = computeP2Rates(base({ totalFbSpend: 0, localFbSpend: 0 }));
    expect(r.localFbRate).toBe(0);
  });

  it("returns 100 when tourNoFbSpend is true", () => {
    const r = computeP2Rates(base({ tourNoFbSpend: true, localFbSpend: 0, totalFbSpend: 0 }));
    expect(r.localFbRate).toBe(100);
  });

  it("clamps to 100 if ratio exceeds 100", () => {
    const r = computeP2Rates(base({ localFbSpend: 60000, totalFbSpend: 50000 }));
    expect(r.localFbRate).toBe(100);
  });
});

// ── Local non-F&B rate ────────────────────────────────────────────────────────

describe("localNonFbRate", () => {
  it("computes localNonFbSpend / totalNonFbSpend * 100", () => {
    const r = computeP2Rates(base({ localNonFbSpend: 12000, totalNonFbSpend: 20000 }));
    expect(r.localNonFbRate).toBe(60);
  });

  it("returns 0 when totalNonFbSpend is 0", () => {
    const r = computeP2Rates(base({ totalNonFbSpend: 0, localNonFbSpend: 0 }));
    expect(r.localNonFbRate).toBe(0);
  });

  it("returns 100 when tourNoNonFbSpend is true", () => {
    const r = computeP2Rates(base({ tourNoNonFbSpend: true, localNonFbSpend: 0, totalNonFbSpend: 0 }));
    expect(r.localNonFbRate).toBe(100);
  });

  it("clamps to 100 if ratio exceeds 100", () => {
    const r = computeP2Rates(base({ localNonFbSpend: 25000, totalNonFbSpend: 20000 }));
    expect(r.localNonFbRate).toBe(100);
  });
});

// ── Direct booking rate ───────────────────────────────────────────────────────

describe("directBookingRate", () => {
  it("passes through directBookingPct", () => {
    const r = computeP2Rates(base({ directBookingPct: 45 }));
    expect(r.directBookingRate).toBe(45);
  });

  it("clamps negative value to 0", () => {
    const r = computeP2Rates(base({ directBookingPct: -5 }));
    expect(r.directBookingRate).toBe(0);
  });

  it("clamps to 100 when above 100", () => {
    const r = computeP2Rates(base({ directBookingPct: 110 }));
    expect(r.directBookingRate).toBe(100);
  });

  it("defaults to 0 when not provided", () => {
    const r = computeP2Rates(base({ directBookingPct: undefined }));
    expect(r.directBookingRate).toBe(0);
  });
});

// ── Local ownership & community score ────────────────────────────────────────

describe("localOwnershipPct", () => {
  it("passes through localOwnershipPct", () => {
    const r = computeP2Rates(base({ localOwnershipPct: 75 }));
    expect(r.localOwnershipPct).toBe(75);
  });

  it("clamps to 0–100", () => {
    expect(computeP2Rates(base({ localOwnershipPct: -10 })).localOwnershipPct).toBe(0);
    expect(computeP2Rates(base({ localOwnershipPct: 120 })).localOwnershipPct).toBe(100);
  });

  it("defaults to 0 when not provided", () => {
    const r = computeP2Rates(base({ localOwnershipPct: undefined }));
    expect(r.localOwnershipPct).toBe(0);
  });
});

describe("communityScore", () => {
  it("passes through communityScore", () => {
    const r = computeP2Rates(base({ communityScore: 85 }));
    expect(r.communityScore).toBe(85);
  });

  it("clamps to 0–100", () => {
    expect(computeP2Rates(base({ communityScore: -1 })).communityScore).toBe(0);
    expect(computeP2Rates(base({ communityScore: 105 })).communityScore).toBe(100);
  });

  it("defaults to 0 when not provided", () => {
    const r = computeP2Rates(base({ communityScore: undefined }));
    expect(r.communityScore).toBe(0);
  });
});

// ── Rounding ──────────────────────────────────────────────────────────────────

describe("rounding to 2 decimal places", () => {
  it("rounds localEmploymentRate", () => {
    const r = computeP2Rates(base({ localFte: 1, totalFte: 3 }));
    // 1/3 * 100 = 33.333...
    expect(r.localEmploymentRate).toBe(33.33);
  });

  it("rounds localFbRate", () => {
    const r = computeP2Rates(base({ localFbSpend: 1, totalFbSpend: 3 }));
    // 1/3 * 100 = 33.333...
    expect(r.localFbRate).toBe(33.33);
  });

  it("rounds employmentQuality", () => {
    // (50 * 0.5) + (700/800 * 100 * 0.5) = 25 + 43.75 = 68.75
    const r = computeP2Rates(base({ permanentContractPct: 50, averageMonthlyWage: 700, minimumWage: 800 }));
    expect(r.employmentQuality).toBe(68.75);
  });
});

// ── All inputs undefined ──────────────────────────────────────────────────────

describe("all inputs undefined", () => {
  it("returns all zeros when only operatorType is provided", () => {
    const r = computeP2Rates({});
    expect(r.localEmploymentRate).toBe(0);
    expect(r.employmentQuality).toBe(0);
    expect(r.localFbRate).toBe(0);
    expect(r.localNonFbRate).toBe(0);
    expect(r.directBookingRate).toBe(0);
    expect(r.localOwnershipPct).toBe(0);
    expect(r.communityScore).toBe(0);
  });
});
