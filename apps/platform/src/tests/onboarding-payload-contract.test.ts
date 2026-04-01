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
import { buildScorePayload } from "@/app/operator/onboarding/OperatorOnboardingClient";
import type { OnboardingData, EvidenceTier } from "@/lib/onboarding/onboarding-steps";
import { EVIDENCE_TIERS } from "@/app/operator/onboarding/_components/primitives";

// ── Fixture: complete Type A data ─────────────────────────────────────────────

function completeData(): OnboardingData {
  return {
    operatorType: "A",
    territoryId: "ter-1",
    assessmentPeriodEnd: "2025-12-31",
    guestNights: 3000,
    totalElectricityKwh: 20000,
    totalGasKwh: 5000,
    totalWaterLitres: 100000,
    totalWasteKg: 2000,
    wasteRecycledKg: 800,
    wasteCompostedKg: 200,
    wasteOtherDivertedKg: 100,
    renewableOnsitePct: 30,
    renewableTariffPct: 20,
    scope3TransportKgCo2e: 500,
    p1SiteScore: 3,
    p1RecirculationScore: 2,
    totalFte: 6,
    localFte: 5,
    permanentContractPct: 80,
    averageMonthlyWage: 1000,
    minimumWage: 870,
    totalFbSpend: 20000,
    localFbSpend: 14000,
    totalNonFbSpend: 8000,
    localNonFbSpend: 5000,
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

// ── 4. buildScorePayload — pillar3 includes status ────────────────────────────

describe("buildScorePayload — pillar3 contract", () => {
  it("includes status inside pillar3 object", () => {
    const data = completeData();
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3.status).toBe("A");
  });

  it("does not have p3Status at the top level", () => {
    const data = completeData();
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect((payload as Record<string, unknown>).p3Status).toBeUndefined();
  });

  it("defaults status to 'E' when p3Status is undefined", () => {
    const data = completeData();
    data.p3Status = undefined;
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3.status).toBe("E");
  });

  it("sends contributionCategories as raw array alongside status", () => {
    const data = completeData();
    data.p3ContributionCategories = ["Cat1", "Cat3"];
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect(payload.pillar3).toEqual({
      status: "A",
      contributionCategories: ["Cat1", "Cat3"],
      traceability: 75,
      additionality: 50,
      continuity: 75,
    });
  });

  it("does not include categoryScope in pillar3", () => {
    const data = completeData();
    const payload = buildScorePayload(data, "op-1", "ter-1");

    expect((payload.pillar3 as Record<string, unknown>).categoryScope).toBeUndefined();
  });

  it("passes all P3 status values correctly (A through E)", () => {
    for (const status of ["A", "B", "C", "D", "E"] as const) {
      const data = completeData();
      data.p3Status = status;
      const payload = buildScorePayload(data, "op-1", "ter-1");
      expect(payload.pillar3.status).toBe(status);
    }
  });
});
