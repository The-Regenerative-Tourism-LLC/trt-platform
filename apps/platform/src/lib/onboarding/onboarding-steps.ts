/**
 * Onboarding Step Configuration and Navigation Engine
 *
 * Single source of truth for the 20-step operator onboarding flow.
 * No scoring logic. No UI. Pure step definitions + navigation helpers
 * + field-level validation per step.
 *
 * Step ids are stable string keys — never use array indices for routing.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type OperatorType = "A" | "B" | "C";
export type P3Status = "A" | "B" | "C" | "D" | "E";

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

  // Step 5 — Activity unit
  guestNights?: number;
  visitorDays?: number;
  revenueSplitAccommodationPct?: number;
  revenueSplitExperiencePct?: number;
  assessmentPeriodEnd?: string;

  // Step 6 — P1: Energy
  totalElectricityKwh?: number;
  totalGasKwh?: number;
  renewableOnsitePct?: number;
  renewableTariffPct?: number;
  tourFuelType?: "diesel" | "petrol" | "electric";
  tourFuelLitresPerMonth?: number;
  evKwhPerMonth?: number;

  // Step 7 — P1: Water & Waste
  totalWaterLitres?: number;
  totalWasteKg?: number;
  wasteRecycledKg?: number;
  wasteCompostedKg?: number;
  wasteOtherDivertedKg?: number;
  p1RecirculationScore?: number;

  // Step 8 — P1: Site & Carbon
  scope3TransportKgCo2e?: number;
  p1SiteScore?: number;

  // Step 9 — P2: Employment
  totalFte?: number;
  localFte?: number;
  permanentContractPct?: number;
  averageMonthlyWage?: number;
  minimumWage?: number;

  // Step 10 — P2: Procurement
  totalFbSpend?: number;
  localFbSpend?: number;
  totalNonFbSpend?: number;
  localNonFbSpend?: number;
  foodServiceType?: string;
  tourNoFbSpend?: boolean;
  tourNoNonFbSpend?: boolean;

  // Step 11 — P2: Revenue & Community
  directBookingPct?: number;
  communityScore?: number;

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
  forwardCommitmentTargetCycle?: number;
  forwardCommitmentSignatory?: string;

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
  { id: "operator-type",       label: "Operator Type" },
  { id: "identity",            label: "Identity" },
  { id: "accommodation",       label: "Accommodation",
    condition: (d) => d.operatorType === "A" || d.operatorType === "C" },
  { id: "experience-types",    label: "Experiences",
    condition: (d) => d.operatorType === "B" || d.operatorType === "C" },
  { id: "ownership",           label: "Ownership" },
  { id: "activity-unit",       label: "Activity Data" },
  { id: "p1-energy",           label: "Energy" },
  { id: "p1-water-waste",      label: "Water & Waste" },
  { id: "p1-site-carbon",      label: "Site & Carbon" },
  { id: "p2-employment",       label: "Employment" },
  { id: "p2-procurement",      label: "Procurement" },
  { id: "p2-revenue-community", label: "Revenue & Community" },
  { id: "p3-status",           label: "P3 Status" },
  { id: "p3-programme",        label: "Programme Details",
    condition: (d) => d.p3Status === "A" || d.p3Status === "B" || d.p3Status === "C" },
  { id: "p3-evidence-quality", label: "Evidence Quality",
    condition: (d) => d.p3Status === "A" || d.p3Status === "B" || d.p3Status === "C" },
  { id: "p3-forward-commitment", label: "Forward Commitment",
    condition: (d) => d.p3Status === "D" },
  { id: "evidence-upload",     label: "Evidence Upload" },
  { id: "delta",               label: "Prior Cycle",
    condition: (d) => typeof d.assessmentCycle === "number" && d.assessmentCycle > 1 },
  { id: "gps-preview",         label: "GPS Preview" },
  { id: "review-submit",       label: "Review & Submit" },
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
    isNonEmpty(d.primaryContactName) &&
    isNonEmpty(d.primaryContactEmail) &&
    isNonEmpty(d.territoryId),

  "accommodation": (d) => {
    // Conditional step — if not shown, treat as valid
    if (d.operatorType !== "A" && d.operatorType !== "C") return true;
    return isNonEmpty(d.accommodationCategory) && isPositiveNumber(d.rooms);
  },

  "experience-types": (d) => {
    if (d.operatorType !== "B" && d.operatorType !== "C") return true;
    return Array.isArray(d.experienceTypes) && d.experienceTypes.length > 0;
  },

  "ownership": (d) =>
    isNonEmpty(d.ownershipType) &&
    isNonNegativeNumber(d.localEquityPct),

  "activity-unit": (d) => {
    if (!isNonEmpty(d.assessmentPeriodEnd)) return false;
    if (d.operatorType === "A") return isPositiveNumber(d.guestNights);
    if (d.operatorType === "B") return isPositiveNumber(d.visitorDays);
    // Type C: both required + revenue split must sum to 100
    if (!isPositiveNumber(d.guestNights) || !isPositiveNumber(d.visitorDays)) return false;
    const acc = d.revenueSplitAccommodationPct ?? 0;
    const exp = d.revenueSplitExperiencePct ?? 0;
    return Math.abs(acc + exp - 100) < 0.01;
  },

  "p1-energy": (d) =>
    // At minimum one energy source must be provided
    isNonNegativeNumber(d.totalElectricityKwh) || isNonNegativeNumber(d.totalGasKwh),

  "p1-water-waste": (d) =>
    isNonNegativeNumber(d.totalWaterLitres) &&
    isNonNegativeNumber(d.totalWasteKg) &&
    typeof d.p1RecirculationScore === "number",

  "p1-site-carbon": (d) =>
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
      isPositiveNumber(d.averageMonthlyWage) &&
      isPositiveNumber(d.minimumWage)
    );
  },

  "p2-procurement": (d) => {
    const fbOk = d.tourNoFbSpend === true || isNonNegativeNumber(d.totalFbSpend);
    const nonFbOk = d.tourNoNonFbSpend === true || isNonNegativeNumber(d.totalNonFbSpend);
    return fbOk && nonFbOk;
  },

  "p2-revenue-community": (d) =>
    isNonNegativeNumber(d.directBookingPct) &&
    typeof d.communityScore === "number",

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
      isNonEmpty(d.p3ProgrammeDescription) &&
      isPositiveNumber(d.p3AnnualBudget)
    );
  },

  "p3-evidence-quality": (d) => {
    if (d.p3Status !== "A" && d.p3Status !== "B" && d.p3Status !== "C") return true;
    return (
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

  // Evidence upload — optional, operators may submit without evidence
  "evidence-upload": (_d) => true,

  // Delta step — informational only for Cycle 2+, always passable
  "delta": (_d) => true,

  // GPS preview — read-only summary, always passable
  "gps-preview": (_d) => true,

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
