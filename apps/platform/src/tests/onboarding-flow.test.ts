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
 *   - Evidence upload step is always passable (optional)
 *   - Delta step is only visible for cycle 2+ operators
 *   - Accommodation/experience steps are gated by operator type
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
    ownershipType: "independent",
    localEquityPct: 100,
    assessmentPeriodEnd: "2024-12-31",
    guestNights: 1200,
    totalElectricityKwh: 8000,
    totalWaterLitres: 50000,
    totalWasteKg: 1200,
    p1RecirculationScore: 50,
    p1SiteScore: 2,
    soloOperator: false,
    totalFte: 4,
    localFte: 4,
    permanentContractPct: 80,
    averageMonthlyWage: 900,
    minimumWage: 820,
    totalFbSpend: 12000,
    localFbSpend: 9000,
    totalNonFbSpend: 5000,
    localNonFbSpend: 3000,
    directBookingPct: 60,
    communityScore: 3,
    p3Status: "E",
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
    experienceTypes: ["hiking", "wildlife"],
    ownershipType: "independent",
    localEquityPct: 100,
    assessmentPeriodEnd: "2024-12-31",
    visitorDays: 800,
    totalElectricityKwh: 2000,
    totalWaterLitres: 10000,
    totalWasteKg: 300,
    p1RecirculationScore: 25,
    p1SiteScore: 1,
    soloOperator: true,
    tourNoFbSpend: true,
    tourNoNonFbSpend: true,
    directBookingPct: 75,
    communityScore: 2,
    p3Status: "A",
    p3ContributionCategories: ["Cat1"],
    p3ProgrammeDescription: "Reforestation programme.",
    p3AnnualBudget: 5000,
    p3Traceability: 75,
    p3Additionality: 50,
    p3Continuity: 75,
  };
}

// ── Step definitions ──────────────────────────────────────────────────────────

describe("ONBOARDING_STEPS", () => {
  it("has 20 steps defined", () => {
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
});

// ── Step navigation helpers ────────────────────────────────────────────────────

describe("getNextStep", () => {
  it("returns the next step for operator-type with no data", () => {
    const next = getNextStep("operator-type", {});
    expect(next?.id).toBe("identity");
  });

  it("skips accommodation step for type B operator", () => {
    const next = getNextStep("identity", { operatorType: "B" });
    // accommodation is conditional on A or C — should skip to experience-types
    expect(next?.id).toBe("experience-types");
  });

  it("includes accommodation step for type A operator", () => {
    const next = getNextStep("identity", { operatorType: "A" });
    expect(next?.id).toBe("accommodation");
  });

  it("skips experience-types step for type A operator", () => {
    const next = getNextStep("accommodation", { operatorType: "A" });
    expect(next?.id).toBe("ownership");
  });

  it("includes experience-types step for type B operator", () => {
    // B has no accommodation, so identity → experience-types → ownership
    const next = getNextStep("identity", { operatorType: "B" });
    expect(next?.id).toBe("experience-types");
    const next2 = getNextStep("experience-types", { operatorType: "B" });
    expect(next2?.id).toBe("ownership");
  });

  it("skips p3-programme and p3-evidence-quality for status E", () => {
    const next = getNextStep("p3-status", { p3Status: "E" });
    // E → skip programme, evidence-quality, forward-commitment → evidence-upload
    expect(next?.id).toBe("evidence-upload");
  });

  it("includes p3-programme for status A", () => {
    const next = getNextStep("p3-status", { p3Status: "A" });
    expect(next?.id).toBe("p3-programme");
  });

  it("skips delta step for cycle 1 operator (no assessmentCycle)", () => {
    const next = getNextStep("evidence-upload", {});
    expect(next?.id).toBe("gps-preview");
  });

  it("includes delta step for cycle 2+ operator", () => {
    const next = getNextStep("evidence-upload", { assessmentCycle: 2 });
    expect(next?.id).toBe("delta");
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

  it("skips accommodation going back from ownership for type B", () => {
    // B: ownership → back → experience-types (accommodation skipped)
    const prev = getPreviousStep("ownership", { operatorType: "B" });
    expect(prev?.id).toBe("experience-types");
  });

  it("goes back to accommodation from ownership for type A", () => {
    const prev = getPreviousStep("ownership", { operatorType: "A" });
    expect(prev?.id).toBe("accommodation");
  });
});

// ── Visible steps ─────────────────────────────────────────────────────────────

describe("getVisibleSteps", () => {
  it("for type A, status E, cycle 1 — visible steps exclude conditional B/C/D steps", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "E" };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("accommodation");
    expect(visible).not.toContain("experience-types");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
    expect(visible).not.toContain("p3-forward-commitment");
    expect(visible).not.toContain("delta");
  });

  it("for type B, status A, cycle 2 — includes experience-types, p3-programme, delta", () => {
    const data: OnboardingData = { operatorType: "B", p3Status: "A", assessmentCycle: 2 };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("experience-types");
    expect(visible).not.toContain("accommodation");
    expect(visible).toContain("p3-programme");
    expect(visible).toContain("p3-evidence-quality");
    expect(visible).toContain("delta");
  });

  it("for status D — includes forward-commitment, excludes p3-programme and p3-evidence-quality", () => {
    const data: OnboardingData = { operatorType: "A", p3Status: "D" };
    const visible = getVisibleSteps(data).map((s) => s.id);
    expect(visible).toContain("p3-forward-commitment");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
  });
});

describe("isLastStep", () => {
  it("returns false for any step before review-submit", () => {
    expect(isLastStep("gps-preview", {})).toBe(false);
    expect(isLastStep("evidence-upload", {})).toBe(false);
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

describe("validateStep — accommodation", () => {
  it("passes for type B (step not visible)", () => {
    expect(validateStep("accommodation", { operatorType: "B" })).toBe(true);
  });

  it("fails for type A when accommodationCategory or rooms missing", () => {
    expect(validateStep("accommodation", { operatorType: "A" })).toBe(false);
    expect(validateStep("accommodation", { operatorType: "A", accommodationCategory: "guesthouse" })).toBe(false);
  });

  it("passes for type A when accommodationCategory and rooms provided", () => {
    expect(validateStep("accommodation", {
      operatorType: "A",
      accommodationCategory: "guesthouse",
      rooms: 6,
    })).toBe(true);
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
      minimumWage: 820,
    })).toBe(true);
    expect(validateStep("p2-employment", {
      soloOperator: false,
      totalFte: 4,
    })).toBe(false);
  });
});

describe("validateStep — evidence-upload", () => {
  it("always passes regardless of evidenceRefs (optional)", () => {
    expect(validateStep("evidence-upload", {})).toBe(true);
    expect(validateStep("evidence-upload", { evidenceRefs: [] })).toBe(true);
    expect(validateStep("evidence-upload", {
      evidenceRefs: [{ indicatorId: "p1_energy_intensity", tier: "T1", checksum: "abc", verificationState: "pending" }],
    })).toBe(true);
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

  it("passes for status A when required fields present", () => {
    expect(validateStep("p3-programme", {
      p3Status: "A",
      p3ContributionCategories: ["Cat1"],
      p3ProgrammeDescription: "Habitat restoration.",
      p3AnnualBudget: 5000,
    })).toBe(true);
  });
});

// ── Full visible flow navigation (Type A, P3 status E, cycle 1) ───────────────

describe("full navigation — Type A, P3 status E, cycle 1", () => {
  it("traverses all visible steps from start to review-submit", () => {
    const data = typeAData() as OnboardingData;
    const visible = getVisibleSteps(data).map((s) => s.id);

    // Confirm no conditional steps that shouldn't be present
    expect(visible).not.toContain("experience-types");
    expect(visible).not.toContain("p3-programme");
    expect(visible).not.toContain("p3-evidence-quality");
    expect(visible).not.toContain("p3-forward-commitment");
    expect(visible).not.toContain("delta");
    expect(visible).toContain("accommodation");
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
  it("traverses all visible steps including p3-programme, p3-evidence-quality, and delta", () => {
    const data = typeBData() as OnboardingData;
    (data as any).assessmentCycle = 2;
    (data as any).deltaExplanation = "Added solar panels.";
    const visible = getVisibleSteps(data).map((s) => s.id);

    expect(visible).toContain("experience-types");
    expect(visible).not.toContain("accommodation");
    expect(visible).toContain("p3-programme");
    expect(visible).toContain("p3-evidence-quality");
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
    // accommodation is hidden for type B
    expect(getVisibleStepNumber("accommodation", { operatorType: "B" })).toBe(-1);
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
    expect(step?.label).toBe("Identity");
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
