/**
 * Onboarding Flow Tests
 *
 * Tests for the onboarding navigation engine and step validation logic
 * defined in onboarding-steps.ts.
 *
 * Verifies:
 *   - New operators start at the first visible step
 *   - Returning operators resume at the saved step
 *   - Back navigation never validates and always moves back
 *   - Conditional steps are skipped correctly
 *   - Step validators only check the current step's fields
 *   - Delta step is only visible for cycle 2+ operators
 *   - operation-activity merges accommodation + experience + ownership + activity
 */

import { describe, it, expect } from "vitest";
import {
  ONBOARDING_STEPS,
  getNextStep,
  getPreviousStep,
  getVisibleSteps,
  getVisibleStepNumber,
  isLastStep,
  validateStep,
  getStepById,
  getStepIndex,
  type OnboardingData,
} from "@/lib/onboarding/onboarding-steps";

// ── Fixtures ──────────────────────────────────────────────────────────────────

function typeAData(): Partial<OnboardingData> {
  return {
    operatorType: "A",
    legalName: "Quinta das Levadas Lda.",
    country: "Portugal",
    primaryContactName: "Ana Costa",
    primaryContactEmail: "ana@levadas.pt",
    territoryId: "ter-1",
    accommodationCategory: "guesthouse",
    rooms: 6,
    ownershipType: "sole-proprietor",
    localEquityPct: 100,
    guestNights: 1200,
    photoRefs: [{ id: "ph-1", storageKey: "https://storage.example.com/cover.jpg", url: "https://storage.example.com/cover.jpg", isCover: true }],
    totalElectricityKwh: 8000,
    officeElectricityKwh: 0,
    gridExportKwh: 0,
    totalWaterLitres: 50000,
    waterGreywater: false,
    waterRainwater: true,
    waterWastewaterTreatment: false,
    totalWasteKg: 1200,
    wasteRecycledKg: 400,
    wasteCompostedKg: 200,
    wasteOtherDivertedKg: 100,
    p1SiteScore: 2,
    evidenceTierEnergy: "T2",
    evidenceTierWater: "T2",
    evidenceTierWaste: "T2",
    evidenceTierCarbon: "T2",
    evidenceTierSite: "T2",
    soloOperator: false,
    totalFte: 4,
    localFte: 4,
    permanentContractPct: 80,
    averageMonthlyWage: 900,
    totalFbSpend: 12000,
    localFbSpend: 9000,
    totalNonFbSpend: 5000,
    localNonFbSpend: 3000,
    totalBookingsCount: 400,
    directBookingPct: 60,
    evidenceTierRevenue: "T2",
    communityScore: 3,
    evidenceTierCommunity: "T2",
    p3Status: "E",
    evidenceChecklistElectricity: true,
    evidenceChecklistGasFuel: true,
    evidenceChecklistWater: true,
    evidenceChecklistWaste: true,
    evidenceChecklistEmployment: true,
    evidenceChecklistSupplier: true,
    evidenceChecklistBooking: true,
    evidenceChecklistOwnership: true,
  };
}

function typeBData(): Partial<OnboardingData> {
  return {
    operatorType: "B",
    legalName: "Trail Co Lda.",
    country: "Portugal",
    primaryContactName: "João Silva",
    primaryContactEmail: "joao@trail.pt",
    territoryId: "ter-1",
    experienceTypes: ["hiking_trekking", "nature_wildlife"],
    ownershipType: "independent",
    localEquityPct: 100,
    visitorDays: 800,
    photoRefs: [{ id: "ph-b1", storageKey: "https://storage.example.com/tour.jpg", url: "https://storage.example.com/tour.jpg", isCover: false }],
    tourNoTransport: true,
    tourNoFixedBase: false,
    officeElectricityKwh: 2000,
    totalElectricityKwh: 0,
    gridExportKwh: 0,
    totalWaterLitres: 10000,
    waterGreywater: true,
    waterRainwater: false,
    waterWastewaterTreatment: false,
    totalWasteKg: 300,
    wasteRecycledKg: 100,
    wasteCompostedKg: 50,
    wasteOtherDivertedKg: 0,
    p1SiteScore: 1,
    evidenceTierEnergy: "T2",
    evidenceTierWater: "T2",
    evidenceTierWaste: "T2",
    evidenceTierCarbon: "T2",
    evidenceTierSite: "T2",
    soloOperator: true,
    tourNoFbSpend: true,
    tourNoNonFbSpend: true,
    totalBookingsCount: 200,
    directBookingPct: 75,
    evidenceTierRevenue: "T2",
    communityScore: 2,
    evidenceTierCommunity: "T2",
    p3Status: "A",
    p3ContributionCategories: ["Cat1"],
    p3ProgrammeDescription: "Reforestation programme.",
    p3AnnualBudget: 5000,
    p3Traceability: 75,
    p3Additionality: 50,
    p3Continuity: 75,
    evidenceChecklistElectricity: true,
    evidenceChecklistGasFuel: true,
    evidenceChecklistWater: true,
    evidenceChecklistWaste: true,
    evidenceChecklistEmployment: true,
    evidenceChecklistSupplier: true,
    evidenceChecklistBooking: true,
    evidenceChecklistOwnership: true,
    evidenceChecklistP3: true,
  };
}

// ── Step definitions ──────────────────────────────────────────────────────────

describe("ONBOARDING_STEPS", () => {
  it("has 20 steps defined (merged operation-activity, p3-evidence-quality merged into p3-programme)", () => {
    expect(ONBOARDING_STEPS).toHaveLength(20);
  });

  it("first step is operator-type", () => {
    expect(ONBOARDING_STEPS[0].id).toBe("operator-type");
  });

  it("last step is review-submit", () => {
    expect(ONBOARDING_STEPS[ONBOARDING_STEPS.length - 1].id).toBe("review-submit");
  });

  it("all steps have stable string ids", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("includes operation-activity but not the old individual steps", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(ids).toContain("operation-activity");
    expect(ids).not.toContain("accommodation");
    expect(ids).not.toContain("experience-types");
    expect(ids).not.toContain("ownership");
    expect(ids).not.toContain("activity-unit");
    expect(ids).not.toContain("evidence-upload");
  });

  it("gps-preview comes before evidence-checklist", () => {
    const ids = ONBOARDING_STEPS.map((s) => s.id);
    expect(ids.indexOf("gps-preview")).toBeLessThan(ids.indexOf("evidence-checklist"));
  });
});

// ── Step navigation helpers ────────────────────────────────────────────────────

describe("getNextStep", () => {
  it("returns the next step for operator-type with no data", () => {
    const next = getNextStep("operator-type", {});
    expect(next?.id).toBe("identity");
  });

  it("identity → operation-activity for all operator types", () => {
    expect(getNextStep("identity", { operatorType: "A" })?.id).toBe("operation-activity");
    expect(getNextStep("identity", { operatorType: "B" })?.id).toBe("operation-activity");
    expect(getNextStep("identity", { operatorType: "C" })?.id).toBe("operation-activity");
  });

  it("operation-activity → photos", () => {
    const next = getNextStep("operation-activity", {});
    expect(next?.id).toBe("photos");
  });

  it("skips p3-programme and p3-evidence-quality for status E", () => {
    const next = getNextStep("p3-status", { p3Status: "E" });
    // E → skip programme, evidence-quality, forward-commitment → delta (if cycle 2+) or gps-preview
    expect(next?.id).toBe("gps-preview");
  });

  it("skips p3-programme and p3-evidence-quality for status E (cycle 1)", () => {
    const next = getNextStep("p3-status", { p3Status: "E", assessmentCycle: 1 });
    expect(next?.id).toBe("gps-preview");
  });

  it("includes p3-programme for status A", () => {
    const next = getNextStep("p3-status", { p3Status: "A" });
    expect(next?.id).toBe("p3-programme");
  });

  it("gps-preview → evidence-checklist", () => {
    const next = getNextStep("gps-preview", {});
    expect(next?.id).toBe("evidence-checklist");
  });

  it("evidence-checklist → review-submit (cycle 1)", () => {
    const next = getNextStep("evidence-checklist", {});
    expect(next?.id).toBe("review-submit");
  });

  it("includes delta before gps-preview for cycle 2+ operator", () => {
    const next = getNextStep("p3-status", { p3Status: "E", assessmentCycle: 2 });
    expect(next?.id).toBe("delta");
    const afterDelta = getNextStep("delta", { assessmentCycle: 2 });
    expect(afterDelta?.id).toBe("gps-preview");
  });

  it("returns undefined after review-submit (last step)", () => {
    const next = getNextStep("review-submit", {});
    expect(next).toBeUndefined();
  });
});

describe("getPreviousStep", () => {
  it("returns undefined at the first step", () => {
    const prev = getPreviousStep("operator-type", {});
    expect(prev).toBeUndefined();
  });

  it("returns operator-type from identity", () => {
    const prev = getPreviousStep("identity", {});
    expect(prev?.id).toBe("operator-type");
  });

  it("returns identity from operation-activity", () => {
    const prev = getPreviousStep("operation-activity", { operatorType: "A" });
    expect(prev?.id).toBe("identity");
  });

  it("returns operation-activity from photos", () => {
    const prev = getPreviousStep("photos", {});
    expect(prev?.id).toBe("operation-activity");
  });

  it("returns evidence-checklist from review-submit", () => {
    const prev = getPreviousStep("review-submit", {});
    expect(prev?.id).toBe("evidence-checklist");
  });
});

// ── Visible steps ─────────────────────────────────────────────────────────────

describe("getVisibleSteps", () => {
  it("for type A, status E, cycle 1 — visible steps exclude conditional P3/delta steps", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "E" };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("operation-activity");
    expect(visible).not.toContain("accommodation");
    expect(visible).not.toContain("experience-types");
    expect(visible).not.toContain("ownership");
    expect(visible).not.toContain("activity-unit");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
    expect(visible).not.toContain("p3-forward-commitment");
    expect(visible).not.toContain("delta");
  });

  it("for type B, status A, cycle 2 — includes p3-programme, delta, no old individual steps", () => {
    const data: OnboardingData = { operatorType: "B", p3Status: "A", assessmentCycle: 2 };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("operation-activity");
    expect(visible).not.toContain("accommodation");
    expect(visible).not.toContain("experience-types");
    expect(visible).toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality"); // merged into p3-programme
    expect(visible).toContain("delta");
  });

  it("for status D — includes forward-commitment, excludes p3-programme and p3-evidence-quality", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "D" };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("p3-forward-commitment");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
  });

  it("gps-preview always appears before evidence-checklist", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "E" };
    const ids = getVisibleSteps(data).map((s) => s.id);
    expect(ids.indexOf("gps-preview")).toBeLessThan(ids.indexOf("evidence-checklist"));
  });
});

describe("isLastStep", () => {
  it("returns false for any step before review-submit", () => {
    expect(isLastStep("gps-preview", {})).toBe(false);
    expect(isLastStep("evidence-checklist", {})).toBe(false);
  });

  it("returns true for review-submit", () => {
    expect(isLastStep("review-submit", {})).toBe(true);
  });
});

// ── Validators ────────────────────────────────────────────────────────────────

describe("validateStep — operator-type", () => {
  it("fails when operatorType is undefined", () => {
    expect(validateStep("operator-type", {})).toBe(false);
  });

  it("passes for valid operator types A, B, C", () => {
    expect(validateStep("operator-type", { operatorType: "A" })).toBe(true);
    expect(validateStep("operator-type", { operatorType: "B" })).toBe(true);
    expect(validateStep("operator-type", { operatorType: "C" })).toBe(true);
  });
});

describe("validateStep — identity", () => {
  it("fails when required fields are missing", () => {
    expect(validateStep("identity", {})).toBe(false);
    expect(validateStep("identity", { legalName: "Test" })).toBe(false);
  });

  it("passes when all required fields present", () => {
    expect(validateStep("identity", {
      legalName: "Test Lda.",
      country: "Portugal",
      primaryContactName: "Ana",
      primaryContactEmail: "ana@test.com",
      territoryId: "ter-1",
    })).toBe(true);
  });
});

describe("validateStep — operation-activity", () => {
  it("fails when required fields missing", () => {
    expect(validateStep("operation-activity", { operatorType: "A" })).toBe(false);
  });

  it("passes for type A without assessmentPeriodEnd (field no longer required)", () => {
    expect(validateStep("operation-activity", {
      operatorType: "A",
      accommodationCategory: "guesthouse",
      rooms: 6,
      guestNights: 1200,
    })).toBe(true);
  });

  it("passes for type A with all fields including legacy assessmentPeriodEnd", () => {
    expect(validateStep("operation-activity", {
      operatorType: "A",
      accommodationCategory: "guesthouse",
      rooms: 6,
      ownershipType: "sole-proprietor",
      localEquityPct: 100,
      assessmentPeriodEnd: "2024-12-31",
      guestNights: 1200,
    })).toBe(true);
  });

  it("passes for type B without assessmentPeriodEnd (field no longer required)", () => {
    expect(validateStep("operation-activity", {
      operatorType: "B",
      experienceTypes: ["hiking_trekking"],
      visitorDays: 800,
    })).toBe(true);
  });

  it("passes for type B with all required fields (no accommodation needed)", () => {
    expect(validateStep("operation-activity", {
      operatorType: "B",
      experienceTypes: ["hiking_trekking"],
      ownershipType: "sole-proprietor",
      localEquityPct: 100,
      visitorDays: 800,
    })).toBe(true);
  });

  it("passes for type C without assessmentPeriodEnd when revenue split sums to 100", () => {
    expect(validateStep("operation-activity", {
      operatorType: "C",
      accommodationCategory: "eco-lodge",
      rooms: 4,
      experienceTypes: ["kayaking_watersports"],
      guestNights: 600,
      visitorDays: 300,
      revenueSplitAccommodationPct: 60,
      revenueSplitExperiencePct: 40,
    })).toBe(true);
  });

  it("fails for type B when experience types missing", () => {
    expect(validateStep("operation-activity", {
      operatorType: "B",
      experienceTypes: [],
      visitorDays: 800,
    })).toBe(false);
  });

  it("fails for type A when guestNights is zero", () => {
    expect(validateStep("operation-activity", {
      operatorType: "A",
      accommodationCategory: "guesthouse",
      rooms: 6,
      guestNights: 0,
    })).toBe(false);
  });

  it("fails for type A when accommodationCategory is missing", () => {
    expect(validateStep("operation-activity", {
      operatorType: "A",
      rooms: 6,
      guestNights: 1200,
    })).toBe(false);
  });

  it("fails for type C when revenue split does not sum to 100", () => {
    expect(validateStep("operation-activity", {
      operatorType: "C",
      accommodationCategory: "eco-lodge",
      rooms: 4,
      experienceTypes: ["kayaking_watersports"],
      guestNights: 600,
      visitorDays: 300,
      revenueSplitAccommodationPct: 60,
      revenueSplitExperiencePct: 30,
    })).toBe(false);
  });
});

describe("validateStep — p2-employment", () => {
  it("passes immediately for solo operator", () => {
    expect(validateStep("p2-employment", { soloOperator: true })).toBe(true);
  });

  it("requires all fields for non-solo operators", () => {
    expect(validateStep("p2-employment", {
      soloOperator: false,
      totalFte: 4,
      localFte: 3,
      permanentContractPct: 75,
      averageMonthlyWage: 900,
    })).toBe(true);
    expect(validateStep("p2-employment", {
      soloOperator: false,
      totalFte: 4,
    })).toBe(false);
  });
});

describe("validateStep — gps-preview", () => {
  it("always passes (read-only step)", () => {
    expect(validateStep("gps-preview", {})).toBe(true);
  });
});

describe("validateStep — delta", () => {
  it("always passes (informational step)", () => {
    expect(validateStep("delta", {})).toBe(true);
    expect(validateStep("delta", { deltaExplanation: "Major changes" })).toBe(true);
  });
});

describe("validateStep — gps-preview and review-submit", () => {
  it("always pass (read-only and final steps)", () => {
    expect(validateStep("gps-preview", {})).toBe(true);
    expect(validateStep("review-submit", {})).toBe(true);
  });
});

describe("validateStep — p3-programme", () => {
  it("passes for status D/E (step not visible)", () => {
    expect(validateStep("p3-programme", { p3Status: "D" })).toBe(true);
    expect(validateStep("p3-programme", { p3Status: "E" })).toBe(true);
  });

  it("fails for status A when required fields missing", () => {
    expect(validateStep("p3-programme", { p3Status: "A" })).toBe(false);
  });

  it("fails for status A when traceability/additionality/continuity are missing", () => {
    expect(validateStep("p3-programme", {
      p3Status: "A",
      p3ContributionCategories: ["Cat1"],
      p3ProgrammeDescription: "Habitat restoration.",
      p3AnnualBudget: 5000,
      // p3Traceability, p3Additionality, p3Continuity intentionally omitted
    })).toBe(false);
  });

  it("passes for status A when categories and evidence quality scores present", () => {
    expect(validateStep("p3-programme", {
      p3Status: "A",
      p3ContributionCategories: ["Cat1"],
      p3Traceability: 75,
      p3Additionality: 50,
      p3Continuity: 75,
    })).toBe(true);
  });
});

// ── Full visible flow navigation (Type A, P3 status E, cycle 1) ───────────────

describe("full navigation — Type A, P3 status E, cycle 1", () => {
  it("traverses all visible steps from start to review-submit", () => {
    const data = typeAData() as OnboardingData;
    const visible = getVisibleSteps(data).map((s) => s.id);

    // Confirm merged step present, old individual steps absent
    expect(visible).toContain("operation-activity");
    expect(visible).not.toContain("accommodation");
    expect(visible).not.toContain("experience-types");
    expect(visible).not.toContain("ownership");
    expect(visible).not.toContain("activity-unit");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
    expect(visible).not.toContain("p3-forward-commitment");
    expect(visible).not.toContain("delta");
    expect(visible).toContain("review-submit");
  });

  it("each step validator passes for complete type A data", () => {
    const data = typeAData() as OnboardingData;
    const visible = getVisibleSteps(data);
    for (const step of visible) {
      expect(validateStep(step.id, data), `Step "${step.id}" should pass`).toBe(true);
    }
  });

  it("can navigate forward from start to finish without stops", () => {
    const data = typeAData() as OnboardingData;
    let current = ONBOARDING_STEPS[0];
    let count = 0;
    while (current) {
      const next = getNextStep(current.id, data);
      if (!next) break;
      current = next;
      count++;
    }
    expect(current.id).toBe("review-submit");
    expect(count).toBeGreaterThan(10);
  });
});

describe("full navigation — Type B, P3 status A, cycle 2", () => {
  it("traverses all visible steps including p3-programme (evidence quality merged) and delta", () => {
    const data = typeBData() as OnboardingData;
    (data as any).assessmentCycle = 2;
    (data as any).deltaExplanation = "Added solar panels.";
    const visible = getVisibleSteps(data).map((s) => s.id);

    expect(visible).toContain("operation-activity");
    expect(visible).not.toContain("experience-types");
    expect(visible).not.toContain("accommodation");
    expect(visible).toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality"); // merged into p3-programme
    expect(visible).not.toContain("p3-forward-commitment");
    expect(visible).toContain("delta");
  });

  it("each step validator passes for complete type B / status A data", () => {
    const data = { ...typeBData(), assessmentCycle: 2 } as OnboardingData;
    const visible = getVisibleSteps(data);
    for (const step of visible) {
      expect(validateStep(step.id, data), `Step "${step.id}" should pass`).toBe(true);
    }
  });
});

// ── getVisibleStepNumber ──────────────────────────────────────────────────────

describe("getVisibleStepNumber", () => {
  it("returns 1 for the first step", () => {
    expect(getVisibleStepNumber("operator-type", {})).toBe(1);
  });

  it("returns -1 for hidden step", () => {
    // delta is hidden for cycle 1 operators
    expect(getVisibleStepNumber("delta", { operatorType: "B" })).toBe(-1);
  });

  it("returns sequential numbers for visible steps", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "E" };
    const visible = getVisibleSteps(data);
    visible.forEach((step, i) => {
      expect(getVisibleStepNumber(step.id, data)).toBe(i + 1);
    });
  });
});

// ── getStepById and getStepIndex ──────────────────────────────────────────────

describe("getStepById", () => {
  it("returns the step for a valid id", () => {
    const step = getStepById("identity");
    expect(step?.id).toBe("identity");
    expect(step?.label).toBe("About Your Business");
  });

  it("returns undefined for unknown id", () => {
    expect(getStepById("nonexistent")).toBeUndefined();
  });
});

describe("getStepIndex", () => {
  it("returns 0 for the first step", () => {
    expect(getStepIndex("operator-type")).toBe(0);
  });

  it("returns -1 for unknown step", () => {
    expect(getStepIndex("unknown")).toBe(-1);
  });

  it("returns the correct index for review-submit (last step)", () => {
    expect(getStepIndex("review-submit")).toBe(ONBOARDING_STEPS.length - 1);
  });
});
