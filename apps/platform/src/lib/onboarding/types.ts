/**
 * Core types for the capability-based onboarding engine.
 *
 * CapabilityId — business capabilities an operator offers (base/accommodation/tours).
 * SectionId    — assessment sections that are always present regardless of capabilities.
 *
 * Pillar1/2/3, evidence, and review are SECTIONS, not capabilities.
 */

// ── Identifiers ───────────────────────────────────────────────────────────────

/** Business capabilities an operator can offer. */
export type CapabilityId = 'base' | 'accommodation' | 'tours';

/** Assessment sections (always present; not tied to a single business capability). */
export type SectionId = 'pillar1' | 'pillar2' | 'pillar3' | 'evidence' | 'review';

/** Stable string step identifier, namespaced: 'pillar1:energy', 'accommodation:setup'. */
export type StepId = string;

export type EvidenceTier = 'T1' | 'T2' | 'T3' | 'Proxy';
export type P3Status = 'A' | 'B' | 'C' | 'D' | 'E';

// ── Data slices ───────────────────────────────────────────────────────────────

/** Core operator identity and profile data — always collected. */
export interface BaseData {
  legalName?: string;
  tradingName?: string;
  country?: string;
  destinationRegion?: string;
  territoryId?: string;
  referenceDpi?: boolean;
  yearOperationStart?: number;
  website?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  pricePerNight?: number;
  ownershipType?: string;
  localEquityPct?: number;
  isChainMember?: boolean;
  chainName?: string;
  soloOperator?: boolean;
  ownerLivesLocally?: boolean;
  assessmentPeriodEnd?: string;
  photoRefs?: Array<{ id: string; url: string; isCover: boolean; fileName?: string }>;
  /** @internal Session flags persisted for resume UX */
  _accomGateShown?: boolean;
  _confirmsNoAccommodation?: boolean;
  _accomGateWarn?: boolean;
}

/** Accommodation-specific data — collected only when accommodation capability is active. */
export interface AccommodationData {
  accommodationCategory?: string;
  rooms?: number;
  bedCapacity?: number;
  guestNights?: number;
}

/** Tour/experience-specific data — collected only when tours capability is active. */
export interface ToursData {
  experienceTypes?: string[];
  visitorDays?: number;
  /** No fixed operational base — skips P1 water step */
  tourNoFixedBase?: boolean;
  /** No guest transport with own vehicles */
  tourNoTransport?: boolean;
}

/** Revenue split — only required when both accommodation and tours are active. */
export interface ActivityData {
  revenueSplitAccommodationPct?: number;
  revenueSplitExperiencePct?: number;
}

/** Pillar 1: Operational Footprint inputs. */
export interface Pillar1Data {
  // Energy
  totalElectricityKwh?: number;
  totalGasKwh?: number;
  gridExportKwh?: number;
  officeElectricityKwh?: number;
  renewableOnsitePct?: number;
  renewableTariffPct?: number;
  tourFuelType?: string;
  tourFuelLitresPerMonth?: number;
  evKwhPerMonth?: number;
  evidenceTierEnergy?: EvidenceTier;
  // Water
  totalWaterLitres?: number;
  waterGreywater?: boolean;
  waterRainwater?: boolean;
  waterWastewaterTreatment?: boolean;
  /** @deprecated Legacy band score — use water practice booleans */
  p1RecirculationScore?: number;
  evidenceTierWater?: EvidenceTier;
  // Waste
  totalWasteKg?: number;
  wasteRecycledKg?: number;
  wasteCompostedKg?: number;
  wasteOtherDivertedKg?: number;
  noSingleUsePlastics?: boolean;
  foodWasteProgramme?: boolean;
  wasteEducation?: boolean;
  evidenceTierWaste?: EvidenceTier;
  // Carbon
  scope3TransportKgCo2e?: number;
  evidenceTierCarbon?: EvidenceTier;
  // Site
  p1SiteScore?: number;
  evidenceTierSite?: EvidenceTier;
}

/** Pillar 2: Local Integration inputs. */
export interface Pillar2Data {
  // Employment
  totalFte?: number;
  localFte?: number;
  permanentContractPct?: number;
  averageMonthlyWage?: number;
  minimumWage?: number;
  seasonalOperator?: boolean;
  evidenceTierEmployment?: EvidenceTier;
  // Procurement
  totalFbSpend?: number;
  localFbSpend?: number;
  totalNonFbSpend?: number;
  localNonFbSpend?: number;
  foodServiceType?: string;
  tourNoFbSpend?: boolean;
  tourNoNonFbSpend?: boolean;
  evidenceTierProcurement?: EvidenceTier;
  // Revenue
  totalBookingsCount?: number;
  allDirectBookings?: boolean;
  directBookingPct?: number;
  evidenceTierRevenue?: EvidenceTier;
  // Community
  communityScore?: number;
  evidenceTierCommunity?: EvidenceTier;
}

/** Pillar 3: Regenerative Contribution inputs. */
export interface Pillar3Data {
  p3Status?: P3Status;
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
  p3Traceability?: number;
  p3Additionality?: number;
  p3Continuity?: number;
  forwardCommitmentPreferredCategory?: string;
  forwardCommitmentTerritoryContext?: string;
  forwardCommitmentPreferredInstitutionType?: string;
  forwardCommitmentTargetCycle?: number;
  forwardCommitmentSignatory?: string;
  forwardCommitmentSignedAt?: string;
}

/** Evidence checklist, references, and delta explanation. */
export interface EvidenceData {
  evidenceChecklistElectricity?: boolean;
  evidenceChecklistGasFuel?: boolean;
  evidenceChecklistWater?: boolean;
  evidenceChecklistWaste?: boolean;
  evidenceChecklistEmployment?: boolean;
  evidenceChecklistSupplier?: boolean;
  evidenceChecklistBooking?: boolean;
  evidenceChecklistOwnership?: boolean;
  evidenceChecklistP3?: boolean;
  evidenceRefs?: Array<{
    indicatorId: string;
    tier: EvidenceTier;
    checksum: string;
    verificationState: 'pending' | 'verified' | 'rejected' | 'lapsed';
  }>;
  assessmentCycle?: number;
  deltaExplanation?: string;
}

// ── Onboarding state ──────────────────────────────────────────────────────────

/**
 * Canonical onboarding state, namespaced by capability and section.
 * This is the source of truth for the new engine.
 */
export interface OnboardingState {
  /** Version flag for draft migration */
  _v: 2;
  /**
   * User-selected business capabilities (accommodation, tours).
   * 'base' is always active via registry condition and is NOT stored here.
   */
  capabilities: CapabilityId[];
  /** Current step ID in namespaced format: 'pillar1:energy' */
  currentStepId: StepId;

  base: BaseData;
  accommodation: AccommodationData;
  tours: ToursData;
  activity: ActivityData;
  pillar1: Pillar1Data;
  pillar2: Pillar2Data;
  pillar3: Pillar3Data;
  evidence: EvidenceData;
}

// ── Registry definitions ──────────────────────────────────────────────────────

export interface StepDefinition {
  readonly id: StepId;
  /**
   * Business capability this step belongs to.
   * Only set for profile-level steps: base, accommodation, tours.
   * Omit for assessment section steps (pillar1, pillar2, pillar3, evidence, review).
   */
  readonly capability?: CapabilityId;
  /**
   * Assessment section this step belongs to.
   * Set for pillar/evidence/review steps. Undefined for profile-level steps.
   */
  readonly section?: SectionId;
  readonly label: string;
  readonly sectionLabel: string;
  /** Step is only shown in the flow when this returns true. */
  readonly condition?: (state: OnboardingState) => boolean;
  /** Step is complete when this returns true (gates Next button). */
  readonly validate?: (state: OnboardingState) => boolean;
}

export interface CapabilityDefinition {
  readonly id: CapabilityId;
  readonly label: string;
  readonly shortLabel: string;
  /** Ordered step IDs this capability contributes (profile-level steps only). */
  readonly steps: readonly StepId[];
  /** Whether this capability's steps are included in the flow. */
  readonly condition: (selected: CapabilityId[], state: OnboardingState) => boolean;
}

export interface SectionDefinition {
  readonly id: SectionId;
  readonly label: string;
  readonly shortLabel: string;
  /** Ordered step IDs in this section. */
  readonly steps: readonly StepId[];
}

export interface SectionProgress {
  id: SectionId | CapabilityId;
  label: string;
  total: number;
  completed: number;
  isComplete: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Derive legacy operatorType from selected capabilities (for scoring API compat). */
export function deriveOperatorType(
  capabilities: CapabilityId[]
): 'A' | 'B' | 'C' | undefined {
  const hasAccom = capabilities.includes('accommodation');
  const hasTours = capabilities.includes('tours');
  if (hasAccom && hasTours) return 'C';
  if (hasAccom) return 'A';
  if (hasTours) return 'B';
  return undefined;
}

/** Map legacy operatorType string to capabilities array. */
export function operatorTypeToCaps(
  operatorType: 'A' | 'B' | 'C' | string | undefined
): CapabilityId[] {
  if (operatorType === 'A') return ['accommodation'];
  if (operatorType === 'B') return ['tours'];
  if (operatorType === 'C') return ['accommodation', 'tours'];
  return [];
}
