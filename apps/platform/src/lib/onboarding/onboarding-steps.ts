/**
 * Onboarding Step Configuration and Navigation Engine
 *
 * Single source of truth for the operator onboarding flow (Lovable parity).
 * No scoring logic. No UI. Pure step definitions + navigation helpers
 * + field-level validation per step.
 *
 * Step ids are stable string keys — never use array indices for routing.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type OperatorType = "A" | "B" | "C";
export type P3Status = "A" | "B" | "C" | "D" | "E";
export type EvidenceTier = "T1" | "T2" | "T3" | "Proxy";

/** Subset of onboarding draft dataJson used by validation functions. */
export interface OnboardingData {
  // Step 0 — Operator type selection
  operatorType?: OperatorType;

  // Step 1 — Legal identity
  legalName?: string;
  tradingName?: string;
  country?: string;
  destinationRegion?: string;
  territoryId?: string;
  yearOperationStart?: number;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  /** Average published nightly rate (optional raw input) */
  pricePerNight?: number;
  /** WGS84 — optional raw input */
  latitude?: number;
  longitude?: number;

  // Step 2 — Operator profile (Type A / C)
  accommodationCategory?: string;
  rooms?: number;
  bedCapacity?: number;

  // Step 3 — Experience types (Type B / C)
  experienceTypes?: string[];

  // Step 4 — Ownership
  ownershipType?: string;
  localEquityPct?: number;
  isChainMember?: boolean;
  chainName?: string;
  soloOperator?: boolean;
  ownerLivesLocally?: boolean;

  // Step 5 — Activity unit
  guestNights?: number;
  visitorDays?: number;
  revenueSplitAccommodationPct?: number;
  revenueSplitExperiencePct?: number;
  assessmentPeriodEnd?: string;

  /**
   * Uploaded operator photos. Each entry is a persisted OperatorPhoto record.
   * id = OperatorPhoto.id (server-assigned), url = public storage URL.
   * isCover = true for the cover photo (enforced server-side via set-cover API).
   * No file bytes are stored here — only metadata from the upload API response.
   */
  photoRefs?: Array<{ id: string; url: string; isCover: boolean; fileName?: string }>;

  // Step 1 — Location (part of identity)
  address?: string;

  // Step 6 — P1: Energy
  totalElectricityKwh?: number;
  totalGasKwh?: number;
  /** kWh exported to grid (annual) */
  gridExportKwh?: number;
  /** Office / ancillary electricity (annual kWh), separate from main property meter if applicable */
  officeElectricityKwh?: number;
  /** Type B: no guest transport with own vehicles */
  tourNoTransport?: boolean;
  /** Type B: no fixed base — skips water step */
  tourNoFixedBase?: boolean;
  renewableOnsitePct?: number;
  renewableTariffPct?: number;
  tourFuelType?: string;
  tourFuelLitresPerMonth?: number;
  evKwhPerMonth?: number;
  evidenceTierEnergy?: EvidenceTier;

  // Step 7 — P1: Water (practices = raw booleans; legacy p1RecirculationScore optional for old drafts)
  totalWaterLitres?: number;
  waterGreywater?: boolean;
  waterRainwater?: boolean;
  waterWastewaterTreatment?: boolean;
  /** @deprecated Legacy band score — not collected in UI; use water practice booleans */
  p1RecirculationScore?: number;
  evidenceTierWater?: EvidenceTier;

  // P1: Waste
  totalWasteKg?: number;
  wasteRecycledKg?: number;
  wasteCompostedKg?: number;
  wasteOtherDivertedKg?: number;
  noSingleUsePlastics?: boolean;
  foodWasteProgramme?: boolean;
  wasteEducation?: boolean;
  evidenceTierWaste?: EvidenceTier;

  // P1: Carbon (scope 3 context)
  scope3TransportKgCo2e?: number;
  evidenceTierCarbon?: EvidenceTier;

  // P1: Site / land use
  p1SiteScore?: number;
  evidenceTierSite?: EvidenceTier;

  // Step 9 — P2: Employment
  totalFte?: number;
  localFte?: number;
  permanentContractPct?: number;
  averageMonthlyWage?: number;
  minimumWage?: number;
  seasonalOperator?: boolean;

  // Step 10 — P2: Procurement
  totalFbSpend?: number;
  localFbSpend?: number;
  totalNonFbSpend?: number;
  localNonFbSpend?: number;
  foodServiceType?: string;
  tourNoFbSpend?: boolean;
  tourNoNonFbSpend?: boolean;

  // Step 9 — P2: Employment (evidence)
  evidenceTierEmployment?: EvidenceTier;

  // Step 10 — P2: Procurement (evidence)
  evidenceTierProcurement?: EvidenceTier;

  // Step 11 — P2: Revenue
  totalBookingsCount?: number;
  allDirectBookings?: boolean;
  directBookingPct?: number;
  evidenceTierRevenue?: EvidenceTier;

  // P2: Community
  communityScore?: number;
  evidenceTierCommunity?: EvidenceTier;

  /** Evidence readiness checklist (confirmation only, before GPS preview) */
  evidenceChecklistElectricity?: boolean;
  evidenceChecklistGasFuel?: boolean;
  evidenceChecklistWater?: boolean;
  evidenceChecklistWaste?: boolean;
  evidenceChecklistEmployment?: boolean;
  evidenceChecklistSupplier?: boolean;
  evidenceChecklistBooking?: boolean;
  evidenceChecklistOwnership?: boolean;
  /** Required when p3Status is A, B, or C */
  evidenceChecklistP3?: boolean;

  // Step 12 — P3: Status
  p3Status?: P3Status;

  // Step 13 — P3: Programme details (Status A/B/C)
  p3ContributionCategories?: string[];
  p3ProgrammeDescription?: string;
  p3ProgrammeDuration?: string;
  p3GeographicScope?: string;
  p3AnnualBudget?: number;
  p3GuestsParticipating?: number;
  p3IsCollective?: boolean;
  p3CollectiveSize?: string;
  p3CollectiveTotalBudget?: number;
  p3CollectiveSharePct?: number;
  p3InstitutionName?: string;

  // Step 14 — P3: Evidence quality (Status A/B/C)
  p3Traceability?: number;
  p3Additionality?: number;
  p3Continuity?: number;

  // Step 15 — Forward commitment (Status D)
  forwardCommitmentPreferredCategory?: string;
  forwardCommitmentTerritoryContext?: string;
  forwardCommitmentPreferredInstitutionType?: string;
  forwardCommitmentTargetCycle?: number;
  forwardCommitmentSignatory?: string;
  forwardCommitmentSignedAt?: string;

  // Step 16 — Evidence upload
  evidenceRefs?: Array<{
    indicatorId: string;
    tier: "T1" | "T2" | "T3" | "Proxy";
    checksum: string;
    verificationState: "pending" | "verified" | "rejected" | "lapsed";
  }>;

  // Step 17 — Delta / prior cycle (Cycle 2+)
  assessmentCycle?: number;
  /** Free-text explanation of major changes since the prior cycle (Cycle 2+). */
  deltaExplanation?: string;

  // Step 18 — GPS preview (read-only, no validation required)

  // Step 19 — Review & submit

  // ── Internal UI state (persisted in draft for resume) ───────────────────
  /** @internal Type B accommodation gate shown */
  _accomGateShown?: boolean;
  /** @internal Type B confirmed no accommodation */
  _confirmsNoAccommodation?: boolean;
  /** @internal Type B gate warning shown */
  _accomGateWarn?: boolean;
}

/**
 * Wire-format mapping of raw water-practice booleans to the 0–3 discrete field
 * accepted by the scoring API. Not used for display scoring.
 */
export function waterPracticesToRecirculationScore(d: OnboardingData): number | null {
  const g = d.waterGreywater;
  const r = d.waterRainwater;
  const w = d.waterWastewaterTreatment;
  if (g === undefined && r === undefined && w === undefined) {
    return typeof d.p1RecirculationScore === "number" ? d.p1RecirculationScore : null;
  }
  return [g, r, w].filter((x) => x === true).length;
}

// ── Step definitions ──────────────────────────────────────────────────────────

export interface OnboardingStep {
  /** Stable string identifier used for routing and the validation map. */
  readonly id: string;
  /** Short human-readable name for progress display. */
  readonly label: string;
  /**
   * Whether this step is conditional. If provided, the step is only shown
   * when the predicate returns true for the current draft data.
   * Navigation helpers skip hidden steps automatically.
   */
  readonly condition?: (data: OnboardingData) => boolean;
}

export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  { id: "operator-type",         label: "Operator Type" },
  { id: "identity",              label: "About Your Business" },
  { id: "operation-activity",    label: "Your Operation" },
  { id: "photos",                label: "Photos" },
  { id: "p1-energy",             label: "Energy" },
  { id: "p1-water",              label: "Water",
    condition: (d) => !(d.operatorType === "B" && d.tourNoFixedBase === true) },
  { id: "p1-waste",              label: "Waste" },
  { id: "p1-carbon",             label: "Carbon" },
  { id: "p1-site",               label: "Site & Land Use" },
  { id: "p2-employment",         label: "Your Team" },
  { id: "p2-procurement",        label: "Where You Buy From" },
  { id: "p2-revenue",            label: "How Guests Book" },
  { id: "p2-community",          label: "Community Engagement" },
  { id: "p3-status",             label: "Giving Back" },
  { id: "p3-programme",          label: "Programme Details",
    condition: (d) => d.p3Status === "A" || d.p3Status === "B" || d.p3Status === "C" },
  { id: "p3-forward-commitment", label: "Forward Commitment",
    condition: (d) => d.p3Status === "D" },
  { id: "delta",                 label: "Prior Cycle",
    condition: (d) => typeof d.assessmentCycle === "number" && d.assessmentCycle > 1 },
  { id: "gps-preview",           label: "Your Score" },
  { id: "evidence-checklist",    label: "Evidence Checklist" },
  { id: "review-submit",         label: "Review & Submit" },
] as const;

// ── Navigation helpers ────────────────────────────────────────────────────────

/** Returns the step definition for the given id, or undefined if not found. */
export function getStepById(id: string): OnboardingStep | undefined {
  return ONBOARDING_STEPS.find((s) => s.id === id);
}

/**
 * Returns the index of the step in ONBOARDING_STEPS, ignoring conditions.
 * Used for progress bar display (total step count includes all defined steps).
 */
export function getStepIndex(id: string): number {
  return ONBOARDING_STEPS.findIndex((s) => s.id === id);
}

/**
 * Returns the next visible step given the current step id and current draft data.
 * Skips any conditional steps whose condition returns false.
 * Returns undefined if the current step is the last visible step.
 */
export function getNextStep(
  id: string,
  data: OnboardingData = {}
): OnboardingStep | undefined {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === id);
  if (currentIndex === -1) return undefined;

  for (let i = currentIndex + 1; i < ONBOARDING_STEPS.length; i++) {
    const step = ONBOARDING_STEPS[i];
    if (!step.condition || step.condition(data)) {
      return step;
    }
  }
  return undefined;
}

/**
 * Returns the previous visible step given the current step id and current draft data.
 * Skips any conditional steps whose condition returns false.
 * Returns undefined if the current step is the first step.
 */
export function getPreviousStep(
  id: string,
  data: OnboardingData = {}
): OnboardingStep | undefined {
  const currentIndex = ONBOARDING_STEPS.findIndex((s) => s.id === id);
  if (currentIndex === -1) return undefined;

  for (let i = currentIndex - 1; i >= 0; i--) {
    const step = ONBOARDING_STEPS[i];
    if (!step.condition || step.condition(data)) {
      return step;
    }
  }
  return undefined;
}

/**
 * Returns true if the given step is the last visible step for the current draft data.
 */
export function isLastStep(id: string, data: OnboardingData = {}): boolean {
  return getNextStep(id, data) === undefined;
}

/**
 * Returns all visible steps for the current draft data (conditions evaluated).
 * Use this for progress indicator rendering.
 */
export function getVisibleSteps(data: OnboardingData = {}): OnboardingStep[] {
  return ONBOARDING_STEPS.filter((s) => !s.condition || s.condition(data));
}

/**
 * Returns the 1-based position of the step among visible steps.
 * Returns -1 if the step is not visible or not found.
 */
export function getVisibleStepNumber(
  id: string,
  data: OnboardingData = {}
): number {
  const visible = getVisibleSteps(data);
  const index = visible.findIndex((s) => s.id === id);
  return index === -1 ? -1 : index + 1;
}

// ── Validation map ────────────────────────────────────────────────────────────

/** Validation function signature: receives draft data, returns true if the step is complete. */
export type StepValidator = (data: OnboardingData) => boolean;

function isNonEmpty(v: string | undefined | null): boolean {
  return typeof v === "string" && v.trim().length > 0;
}

function isPositiveNumber(v: number | undefined | null): boolean {
  return typeof v === "number" && isFinite(v) && v > 0;
}

function isNonNegativeNumber(v: number | undefined | null): boolean {
  return typeof v === "number" && isFinite(v) && v >= 0;
}

/**
 * Map of stepId → validation function.
 * A step is considered complete (can advance) when its validator returns true.
 * Steps with no validator are always considered complete.
 */
export const STEP_VALIDATORS: Record<string, StepValidator> = {
  "operator-type": (d) =>
    d.operatorType === "A" || d.operatorType === "B" || d.operatorType === "C",

  "identity": (d) =>
    isNonEmpty(d.legalName) &&
    isNonEmpty(d.country) &&
    isNonEmpty(d.territoryId),

  // Legacy individual validators (kept for backward compat, not in active step list)
  "accommodation": (d) => {
    if (d.operatorType !== "A" && d.operatorType !== "C") return true;
    return isNonEmpty(d.accommodationCategory) && isPositiveNumber(d.rooms);
  },
  "experience-types": (d) => {
    if (d.operatorType !== "B" && d.operatorType !== "C") return true;
    return Array.isArray(d.experienceTypes) && d.experienceTypes.length > 0;
  },
  "ownership": (d) => {
    if (!isNonEmpty(d.ownershipType)) return false;
    const variantB = new Set(["partnership", "private-company", "public-company"]);
    if (variantB.has(d.ownershipType!)) return isNonNegativeNumber(d.localEquityPct);
    return true;
  },
  "activity-unit": (d) => {
    if (d.operatorType === "A") return isPositiveNumber(d.guestNights);
    if (d.operatorType === "B") return isPositiveNumber(d.visitorDays);
    if (!isPositiveNumber(d.guestNights) || !isPositiveNumber(d.visitorDays)) return false;
    const acc = d.revenueSplitAccommodationPct ?? 0;
    const exp = d.revenueSplitExperiencePct ?? 0;
    return Math.abs(acc + exp - 100) < 0.01;
  },

  /** Merged step: accommodation + experience types + activity unit (ownership moved to identity step) */
  "operation-activity": (d) => {
    const accomOk =
      (d.operatorType !== "A" && d.operatorType !== "C") ||
      (isNonEmpty(d.accommodationCategory) && isPositiveNumber(d.rooms));
    const expOk =
      (d.operatorType !== "B" && d.operatorType !== "C") ||
      (Array.isArray(d.experienceTypes) && d.experienceTypes.length > 0);
    if (!accomOk || !expOk) return false;
    if (d.operatorType === "A") return isPositiveNumber(d.guestNights);
    if (d.operatorType === "B") return isPositiveNumber(d.visitorDays);
    if (d.operatorType === "C") {
      if (!isPositiveNumber(d.guestNights) || !isPositiveNumber(d.visitorDays)) return false;
      const acc = d.revenueSplitAccommodationPct ?? 0;
      const exp = d.revenueSplitExperiencePct ?? 0;
      return Math.abs(acc + exp - 100) < 0.01;
    }
    return true;
  },

  "photos": (d) =>
    Array.isArray(d.photoRefs) &&
    d.photoRefs.length >= 1,

  "p1-energy": (d) => {
    const gridOffice =
      isNonNegativeNumber(d.officeElectricityKwh) ||
      isNonNegativeNumber(d.gridExportKwh);
    const accEleGas =
      isNonNegativeNumber(d.totalElectricityKwh) ||
      isNonNegativeNumber(d.totalGasKwh);
    if (d.operatorType === "B") {
      const baseEle = accEleGas || gridOffice;
      const transportOk =
        d.tourNoTransport === true ||
        d.tourFuelType === "no_vehicle" ||
        (d.tourFuelType === "electric" && isNonNegativeNumber(d.evKwhPerMonth)) ||
        (!!d.tourFuelType &&
          d.tourFuelType !== "electric" &&
          d.tourFuelType !== "no_vehicle" &&
          isNonNegativeNumber(d.tourFuelLitresPerMonth));
      return baseEle || transportOk;
    }
    return accEleGas || gridOffice;
  },

  "p1-water": (d) => {
    if (d.operatorType === "B" && d.tourNoFixedBase === true) return true;
    return (
      isNonNegativeNumber(d.totalWaterLitres) &&
      typeof d.waterGreywater === "boolean" &&
      typeof d.waterRainwater === "boolean" &&
      typeof d.waterWastewaterTreatment === "boolean"
    );
  },

  "p1-waste": (d) => isNonNegativeNumber(d.totalWasteKg),

  "p1-carbon": (_d) => true,

  "p1-site": (d) =>
    typeof d.p1SiteScore === "number" &&
    d.p1SiteScore >= 0 &&
    d.p1SiteScore <= 4,

  "p2-employment": (d) => {
    // Solo operators bypass employment fields
    if (d.soloOperator) return true;
    return (
      isPositiveNumber(d.totalFte) &&
      isNonNegativeNumber(d.localFte) &&
      isNonNegativeNumber(d.permanentContractPct) &&
      isPositiveNumber(d.averageMonthlyWage)
    );
  },

  "p2-procurement": (d) => {
    // Accept legacy tourNoFbSpend/tourNoNonFbSpend flags (old drafts) or direct spend values
    const fbOk = d.tourNoFbSpend === true || isNonNegativeNumber(d.totalFbSpend);
    const nonFbOk = d.tourNoNonFbSpend === true || isNonNegativeNumber(d.totalNonFbSpend);
    return fbOk && nonFbOk;
  },

  "p2-revenue": (d) =>
    isPositiveNumber(d.totalBookingsCount) &&
    (d.allDirectBookings === true || isNonNegativeNumber(d.directBookingPct)) &&
    !!d.evidenceTierRevenue,

  "p2-community": (d) =>
    typeof d.communityScore === "number" && !!d.evidenceTierCommunity,

  "p3-status": (d) =>
    d.p3Status === "A" ||
    d.p3Status === "B" ||
    d.p3Status === "C" ||
    d.p3Status === "D" ||
    d.p3Status === "E",

  "p3-programme": (d) => {
    if (d.p3Status !== "A" && d.p3Status !== "B" && d.p3Status !== "C") return true;
    return (
      Array.isArray(d.p3ContributionCategories) &&
      d.p3ContributionCategories.length > 0 &&
      typeof d.p3Traceability === "number" &&
      typeof d.p3Additionality === "number" &&
      typeof d.p3Continuity === "number"
    );
  },

  "p3-forward-commitment": (d) => {
    if (d.p3Status !== "D") return true;
    return (
      isNonEmpty(d.forwardCommitmentPreferredCategory) &&
      isNonEmpty(d.forwardCommitmentSignatory)
    );
  },

  // GPS preview — read-only summary, always passable
  "gps-preview": (_d) => true,

  "evidence-checklist": (_d) => true,

  // Delta step — informational only for Cycle 2+, always passable
  "delta": (_d) => true,

  // Review — no additional validation beyond reaching this step
  "review-submit": (_d) => true,
};

/**
 * Returns true if the given step's validation passes for the provided data.
 * Steps without an explicit validator are considered valid.
 */
export function validateStep(id: string, data: OnboardingData): boolean {
  const validator = STEP_VALIDATORS[id];
  if (!validator) return true;
  return validator(data);
}

// ── Section labels (for UX context display) ───────────────────────────────────

// ── Section groups (for section progress bar) ─────────────────────────────────

export interface SectionGroup {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly stepIds: readonly string[];
}

/**
 * Ordered sections shown in the onboarding progress bar.
 * Does not include the roadmap pre-step (handled in the UI layer).
 */
export const SECTION_GROUPS: readonly SectionGroup[] = [
  {
    id: "profile",
    label: "Your Operation",
    shortLabel: "Operation",
    stepIds: ["operator-type", "identity", "operation-activity", "photos"],
  },
  {
    id: "pillar1",
    label: "Operational Footprint",
    shortLabel: "P1",
    stepIds: ["p1-energy", "p1-water", "p1-waste", "p1-carbon", "p1-site"],
  },
  {
    id: "pillar2",
    label: "Local Integration",
    shortLabel: "P2",
    stepIds: ["p2-employment", "p2-procurement", "p2-revenue", "p2-community"],
  },
  {
    id: "pillar3",
    label: "Regenerative Contribution",
    shortLabel: "P3",
    stepIds: ["p3-status", "p3-programme", "p3-forward-commitment"],
  },
  {
    id: "submit",
    label: "Review & Submit",
    shortLabel: "Submit",
    stepIds: ["delta", "gps-preview", "evidence-checklist", "review-submit"],
  },
] as const;

/** Returns the section group for a given step id. */
export function getSectionForStep(stepId: string): SectionGroup | undefined {
  return SECTION_GROUPS.find((g) => (g.stepIds as readonly string[]).includes(stepId));
}

/**
 * Maps each step id to its section label.
 * Used to show contextual "section name · step title" in the onboarding header.
 */
export const STEP_SECTIONS: Readonly<Record<string, string>> = {
  "operator-type":           "Your Operation",
  "identity":                "Your Operation",
  "operation-activity":      "Your Operation",
  "photos":                  "Your Operation",
  "p1-energy":               "Pillar 1 — Operational Footprint",
  "p1-water":                "Pillar 1 — Operational Footprint",
  "p1-waste":                "Pillar 1 — Operational Footprint",
  "p1-carbon":               "Pillar 1 — Operational Footprint",
  "p1-site":                 "Pillar 1 — Operational Footprint",
  "p2-employment":           "Pillar 2 — Local Integration",
  "p2-procurement":          "Pillar 2 — Local Integration",
  "p2-revenue":              "Pillar 2 — Local Integration",
  "p2-community":            "Pillar 2 — Local Integration",
  "p3-status":               "Pillar 3 — Regenerative Contribution",
  "p3-programme":            "Pillar 3 — Regenerative Contribution",
  "p3-forward-commitment":   "Pillar 3 — Regenerative Contribution",
  "delta":                   "Review",
  "gps-preview":             "Review",
  "evidence-checklist":      "Review",
  "review-submit":           "Review & Submit",
};
