/**
 * Onboarding Payload Contract Tests
 *
 * Proves:
 *   1. No frontend scoring derivation in buildPreviewPayload or buildScorePayload
 *      - contributionCategories sent as raw array, NOT a computed categoryScope number
 *      - No computeCategoryScope, no P3_CATEGORY_SCOPE_SCORES usage
 *   2. EvidenceTierSelector values match the backend contract (T1/T2/T3/Proxy)
 *   3. EvidenceTier type aligns with backend evidence ref contract
 */

import { describe, it, expect } from "vitest";
import { buildPreviewPayload } from "@/hooks/usePreviewScore";
import { buildScorePayload } from "../app/[locale]/operator/onboarding/OperatorOnboardingClient";
import type { OnboardingData, EvidenceTier } from "@/lib/onboarding/onboarding-steps";
import { EVIDENCE_TIERS } from "../app/[locale]/operator/onboarding/_components/primitives";

// ── Fixture: complete Type A data ─────────────────────────────────────────────

function completeData(): OnboardingData {
  return {
    operatorType: "A",
    territoryId: "ter-1",
    guestNights: 3000,
    photoRefs: [{ id: "p1", storageKey: "https://x.example/img.jpg", url: "https://x.example/img.jpg", isCover: true }],
    totalElectricityKwh: 20000,
    totalGasKwh: 5000,
    officeElectricityKwh: 0,
    gridExportKwh: 100,
    totalWaterLitres: 100000,
    waterGreywater: true,
    waterRainwater: true,
    waterWastewaterTreatment: false,
    totalWasteKg: 2000,
    wasteRecycledKg: 800,
    wasteCompostedKg: 200,
    wasteOtherDivertedKg: 100,
    renewableOnsitePct: 30,
    renewableTariffPct: 20,
    scope3TransportKgCo2e: 500,
    p1SiteScore: 3,
    totalFte: 6,
    localFte: 5,
    permanentContractPct: 80,
    averageMonthlyWage: 1000,
    seasonalOperator: false,
    totalFbSpend: 20000,
    localFbSpend: 14000,
    totalNonFbSpend: 8000,
    localNonFbSpend: 5000,
    totalBookingsCount: 500,
    directBookingPct: 65,
    localEquityPct: 100,
    communityScore: 3,
    p3Status: "A",
    p3ContributionCategories: ["Cat2", "Cat5"],
    p3Traceability: 75,
    p3Additionality: 50,
    p3Continuity: 75,
    soloOperator: false,
    legalName: "Test Lodge",
    country: "Portugal",
    primaryContactName: "Ana",
    primaryContactEmail: "ana@test.pt",
  };
}

// ── 1. No frontend scoring derivation ─────────────────────────────────────────

describe("buildPreviewPayload — no frontend scoring derivation", () => {
  it("sends p3.contributionCategories as a raw array, not a computed number", () => {
    const data = completeData();
    const payload = buildPreviewPayload(data);

    expect(payload.p3).toBeDefined();
    expect(payload.p3.contributionCategories).toEqual(["Cat2", "Cat5"]);
    expect(typeof payload.p3.contributionCategories).toBe("object");
    expect(Array.isArray(payload.p3.contributionCategories)).toBe(true);

    // Must NOT have a categoryScope number — that's backend derivation
    expect((payload.p3 as Record<string, unknown>).categoryScope).toBeUndefined();
  });

  it("sends empty array when no categories selected", () => {
    const data = completeData();
    data.p3ContributionCategories = [];
    const payload = buildPreviewPayload(data);

    expect(payload.p3.contributionCategories).toEqual([]);
    expect((payload.p3 as Record<string, unknown>).categoryScope).toBeUndefined();
  });

  it("sends empty array when categories field is undefined", () => {
    const data = completeData();
    data.p3ContributionCategories = undefined;
    const payload = buildPreviewPayload(data);

    expect(payload.p3.contributionCategories).toEqual([]);
  });

  it("does not transform, derive, or aggregate any P3 category data", () => {
    const data = completeData();
    data.p3ContributionCategories = ["Cat1", "Cat3", "Cat7"];
    const payload = buildPreviewPayload(data);

    // Raw categories pass through unchanged
    expect(payload.p3.contributionCategories).toEqual(["Cat1", "Cat3", "Cat7"]);
    expect(payload.p3.contributionCategories).toHaveLength(3);
  });

  it("sends raw traceability / additionality / continuity as numbers", () => {
    const data = completeData();
    const payload = buildPreviewPayload(data);

    expect(payload.p3.traceability).toBe(75);
    expect(payload.p3.additionality).toBe(50);
    expect(payload.p3.continuity).toBe(75);
  });

  it("passes p1Raw values as raw user input without intensity derivation", () => {
    const data = completeData();
    const payload = buildPreviewPayload(data);

    expect(payload.p1Raw.totalElectricityKwh).toBe(20000);
    expect(payload.p1Raw.totalWaterLitres).toBe(100000);
    expect(payload.p1Raw.totalWasteKg).toBe(2000);
    // No derived intensity fields (kWh/guest-night, L/guest-night, etc.)
    expect((payload.p1Raw as Record<string, unknown>).energyIntensity).toBeUndefined();
    expect((payload.p1Raw as Record<string, unknown>).waterIntensity).toBeUndefined();
    expect((payload.p1Raw as Record<string, unknown>).wasteDiversionRate).toBeUndefined();
  });

  it("passes p2Raw values as raw user input without rate derivation", () => {
    const data = completeData();
    const payload = buildPreviewPayload(data);

    expect(payload.p2Raw.totalFte).toBe(6);
    expect(payload.p2Raw.localFte).toBe(5);
    // No derived rates (localEmploymentRate, wageRatio, etc.)
    expect((payload.p2Raw as Record<string, unknown>).localEmploymentRate).toBeUndefined();
    expect((payload.p2Raw as Record<string, unknown>).wageRatio).toBeUndefined();
    expect((payload.p2Raw as Record<string, unknown>).localFbRate).toBeUndefined();
  });
});

// ── 2. Evidence tier values match backend contract ────────────────────────────

describe("EVIDENCE_TIERS — values match backend contract", () => {
  const EXPECTED_TIERS: EvidenceTier[] = ["T1", "T2", "T3", "Proxy"];

  it("exports exactly 4 tier options", () => {
    expect(EVIDENCE_TIERS).toHaveLength(4);
  });

  it("each tier value is one of T1/T2/T3/Proxy", () => {
    const values = EVIDENCE_TIERS.map((t) => t.value);
    expect(values).toEqual(EXPECTED_TIERS);
  });

  it("tier values are correctly ordered (T1, T2, T3, Proxy)", () => {
    expect(EVIDENCE_TIERS[0].value).toBe("T1");
    expect(EVIDENCE_TIERS[1].value).toBe("T2");
    expect(EVIDENCE_TIERS[2].value).toBe("T3");
    expect(EVIDENCE_TIERS[3].value).toBe("Proxy");
  });

  it("no tier has empty or invalid value", () => {
    for (const tier of EVIDENCE_TIERS) {
      expect(tier.value).toBeTruthy();
      expect(tier.label).toBeTruthy();
      expect(EXPECTED_TIERS).toContain(tier.value);
    }
  });
});

// ── 3. EvidenceTier type aligns with evidence ref contract ────────────────────

describe("EvidenceTier type — aligns with evidence ref contract", () => {
  it("OnboardingData.evidenceRefs tier values match EvidenceTier", () => {
    const data: OnboardingData = {
      evidenceRefs: [
        { indicatorId: "p1_energy_intensity", tier: "T1", checksum: "abc", verificationState: "pending" },
        { indicatorId: "p1_water_intensity", tier: "T2", checksum: "def", verificationState: "pending" },
        { indicatorId: "p1_waste_diversion_pct", tier: "T3", checksum: "ghi", verificationState: "verified" },
        { indicatorId: "p3_programme", tier: "Proxy", checksum: "jkl", verificationState: "pending" },
      ],
    };

    const tiers = data.evidenceRefs!.map((r) => r.tier);
    expect(tiers).toEqual(["T1", "T2", "T3", "Proxy"]);
  });

  it("evidence tier fields on OnboardingData accept valid tier values", () => {
    const data: OnboardingData = {
      evidenceTierEnergy: "T1",
      evidenceTierWater: "T2",
      evidenceTierWaste: "T3",
      evidenceTierCarbon: "Proxy",
      evidenceTierEmployment: "T1",
      evidenceTierProcurement: "T2",
      evidenceTierRevenue: "T3",
      evidenceTierCommunity: "Proxy",
    };

    expect(data.evidenceTierEnergy).toBe("T1");
    expect(data.evidenceTierWater).toBe("T2");
    expect(data.evidenceTierWaste).toBe("T3");
    expect(data.evidenceTierCarbon).toBe("Proxy");
    expect(data.evidenceTierEmployment).toBe("T1");
    expect(data.evidenceTierProcurement).toBe("T2");
    expect(data.evidenceTierRevenue).toBe("T3");
    expect(data.evidenceTierCommunity).toBe("Proxy");
  });

  it("EVIDENCE_TIERS values are a superset of the EvidenceTier type", () => {
    const selectorValues = EVIDENCE_TIERS.map((t) => t.value);
    const allBackendTiers: EvidenceTier[] = ["T1", "T2", "T3", "Proxy"];

    for (const tier of allBackendTiers) {
      expect(selectorValues).toContain(tier);
    }
  });
});

// ── 4. buildScorePayload — p3Status + pillar3 contract ────────────────────────

describe("buildScorePayload — p3Status / pillar3 contract", () => {
  it("sends p3Status at the top level", () => {
    const data = completeData();
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.p3Status).toBe("A");
  });

  it("defaults p3Status to 'E' when undefined", () => {
    const data = completeData();
    data.p3Status = undefined;
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.p3Status).toBe("E");
  });

  it("sends pillar3 object for status A/B/C with raw categories (no categoryScope)", () => {
    for (const status of ["A", "B", "C"] as const) {
      const data = completeData();
      data.p3Status = status;
      data.p3ContributionCategories = ["Cat1", "Cat3"];
      const payload = buildScorePayload(data, "op-1", "ter-1");

      expect(payload.pillar3).toEqual({
        contributionCategories: ["Cat1", "Cat3"],
        traceability: 75,
        additionality: 50,
        continuity: 75,
      });
      expect((payload.pillar3 as Record<string, unknown>).status).toBeUndefined();
      expect((payload.pillar3 as Record<string, unknown>).categoryScope).toBeUndefined();
    }
  });

  it("sends pillar3 as null for status D", () => {
    const data = completeData();
    data.p3Status = "D";
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3).toBeNull();
    expect(payload.p3Status).toBe("D");
  });

  it("sends pillar3 as null for status E", () => {
    const data = completeData();
    data.p3Status = "E";
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3).toBeNull();
    expect(payload.p3Status).toBe("E");
  });

  it("sends pillar3 as null when p3Status is undefined (defaults to E)", () => {
    const data = completeData();
    data.p3Status = undefined;
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3).toBeNull();
    expect(payload.p3Status).toBe("E");
  });

  it("does not include status inside pillar3 for A/B/C", () => {
    const data = completeData();
    data.p3Status = "A";
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3).not.toBeNull();
    expect((payload.pillar3 as Record<string, unknown>).status).toBeUndefined();
  });

  it("passes all P3 status values at top level (A through E)", () => {
    for (const status of ["A", "B", "C", "D", "E"] as const) {
      const data = completeData();
      data.p3Status = status;
      const payload = buildScorePayload(data, "op-1", "ter-1");
      expect(payload.p3Status).toBe(status);
    }
  });

  it("sends forwardCommitment for status D only", () => {
    const data = completeData();
    data.p3Status = "D";
    data.forwardCommitmentPreferredCategory = "Cat1";
    data.forwardCommitmentSignatory = "Jane Doe";
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.forwardCommitment).toBeDefined();
    expect(payload.forwardCommitment?.preferredCategory).toBe("Cat1");
  });

  it("does not send forwardCommitment for status A", () => {
    const data = completeData();
    data.p3Status = "A";
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.forwardCommitment).toBeUndefined();
  });
});

describe("Water practices → recirculationScore (API wire mapping only)", () => {
  it("tallies true water checkboxes into recirculationScore for submit and preview", () => {
    const data = completeData();
    data.waterGreywater = true;
    data.waterRainwater = false;
    data.waterWastewaterTreatment = true;
    expect(buildScorePayload(data, "op-1", "ter-1").p1Raw.recirculationScore).toBe(2);
    expect(buildPreviewPayload(data).recirculationScore).toBe(2);
  });
});

describe("buildScorePayload — extended raw fields", () => {
  it("includes photoRefs, grid/office energy, and P2 booking fields as raw input", () => {
    const payload = buildScorePayload(completeData(), "op-1", "ter-1");
    expect(payload.photoRefs).toHaveLength(1);
    expect(payload.p1Raw.gridExportKwh).toBe(100);
    expect(payload.p1Raw.waterGreywater).toBe(true);
    expect(payload.p2Raw.totalBookingsCount).toBe(500);
  });
});

// ── operation-activity step — field saving and payload contract ───────────────

describe("buildScorePayload — operation-activity fields flow through correctly", () => {
  it("passes guestNights into activityUnit for type A", () => {
    const data = completeData();
    data.operatorType = "A";
    data.guestNights = 2400;
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.activityUnit.guestNights).toBe(2400);
    expect(payload.activityUnit.visitorDays).toBeUndefined();
  });

  it("passes visitorDays into activityUnit for type B", () => {
    const data = completeData();
    data.operatorType = "B";
    data.visitorDays = 900;
    data.guestNights = undefined;
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.activityUnit.visitorDays).toBe(900);
  });

  it("passes both activityUnit values and revenueSplit for type C", () => {
    const data = completeData();
    data.operatorType = "C";
    data.guestNights = 1500;
    data.visitorDays = 600;
    data.revenueSplitAccommodationPct = 65;
    data.revenueSplitExperiencePct = 35;
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.activityUnit.guestNights).toBe(1500);
    expect(payload.activityUnit.visitorDays).toBe(600);
    expect(payload.revenueSplit?.accommodationPct).toBe(65);
    expect(payload.revenueSplit?.experiencePct).toBe(35);
  });

  it("does not include revenueSplit for type A", () => {
    const payload = buildScorePayload(completeData(), "op-1", "ter-1");
    expect(payload.revenueSplit).toBeUndefined();
  });

  it("defaults assessmentPeriodEnd to today when not provided", () => {
    const data = completeData();
    const today = new Date().toISOString().slice(0, 10);
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.assessmentPeriodEnd).toBe(today);
  });

  it("uses provided assessmentPeriodEnd (legacy data) when present", () => {
    const data: OnboardingData = { ...completeData(), assessmentPeriodEnd: "2024-06-30" };
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.assessmentPeriodEnd).toBe("2024-06-30");
  });

  it("passes foodServiceType through p2Raw", () => {
    const data = completeData();
    data.foodServiceType = "full_restaurant";
    const payload = buildScorePayload(data, "op-1", "ter-1");
    expect(payload.p2Raw.foodServiceType).toBe("full_restaurant");
  });
});
