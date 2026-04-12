/**
 * Field Router
 *
 * Routes a flat OnboardingData patch to the correct OnboardingState slice.
 * Extracted from the store to keep transformation logic isolated and testable.
 *
 * Each field set maps OnboardingData keys to their owning slice.
 * Fields not in any named set default to the 'base' slice.
 */

import type { OnboardingData } from '../onboarding-steps';
import type { OnboardingState, CapabilityId } from '../types';
import { operatorTypeToCaps } from '../types';

// ── Field membership sets ─────────────────────────────────────────────────────

export const ACCOMMODATION_FIELDS = new Set<string>([
  'accommodationCategory', 'rooms', 'bedCapacity', 'guestNights',
]);

export const TOURS_FIELDS = new Set<string>([
  'experienceTypes', 'visitorDays', 'tourNoFixedBase', 'tourNoTransport',
]);

export const ACTIVITY_FIELDS = new Set<string>([
  'revenueSplitAccommodationPct', 'revenueSplitExperiencePct',
]);

export const PILLAR1_FIELDS = new Set<string>([
  'totalElectricityKwh', 'totalGasKwh', 'gridExportKwh', 'officeElectricityKwh',
  'renewableOnsitePct', 'renewableTariffPct', 'tourFuelType', 'tourFuelLitresPerMonth',
  'evKwhPerMonth', 'evidenceTierEnergy', 'totalWaterLitres', 'waterGreywater',
  'waterRainwater', 'waterWastewaterTreatment', 'p1RecirculationScore', 'evidenceTierWater',
  'totalWasteKg', 'wasteRecycledKg', 'wasteCompostedKg', 'wasteOtherDivertedKg',
  'noSingleUsePlastics', 'foodWasteProgramme', 'wasteEducation', 'evidenceTierWaste',
  'scope3TransportKgCo2e', 'evidenceTierCarbon', 'p1SiteScore', 'evidenceTierSite',
]);

export const PILLAR2_FIELDS = new Set<string>([
  'totalFte', 'localFte', 'permanentContractPct', 'averageMonthlyWage', 'minimumWage',
  'seasonalOperator', 'evidenceTierEmployment', 'totalFbSpend', 'localFbSpend',
  'totalNonFbSpend', 'localNonFbSpend', 'foodServiceType', 'tourNoFbSpend',
  'tourNoNonFbSpend', 'evidenceTierProcurement', 'totalBookingsCount', 'allDirectBookings',
  'directBookingPct', 'evidenceTierRevenue', 'communityScore', 'evidenceTierCommunity',
]);

export const PILLAR3_FIELDS = new Set<string>([
  'p3Status', 'p3ContributionCategories', 'p3ProgrammeDescription', 'p3ProgrammeDuration',
  'p3GeographicScope', 'p3AnnualBudget', 'p3GuestsParticipating', 'p3IsCollective',
  'p3CollectiveSize', 'p3CollectiveTotalBudget', 'p3CollectiveSharePct', 'p3InstitutionName',
  'p3Traceability', 'p3Additionality', 'p3Continuity', 'forwardCommitmentPreferredCategory',
  'forwardCommitmentTerritoryContext', 'forwardCommitmentPreferredInstitutionType',
  'forwardCommitmentTargetCycle', 'forwardCommitmentSignatory', 'forwardCommitmentSignedAt',
]);

export const EVIDENCE_FIELDS = new Set<string>([
  'evidenceChecklistElectricity', 'evidenceChecklistGasFuel', 'evidenceChecklistWater',
  'evidenceChecklistWaste', 'evidenceChecklistEmployment', 'evidenceChecklistSupplier',
  'evidenceChecklistBooking', 'evidenceChecklistOwnership', 'evidenceChecklistP3',
  'evidenceDetailedChecked', 'evidenceP3Checked', 'declarationChecked',
  'evidenceRefs', 'assessmentCycle', 'deltaExplanation',
]);

// ── Patch router ──────────────────────────────────────────────────────────────

export interface RoutedPatch {
  capabilities?: CapabilityId[];
  base?: Partial<OnboardingState['base']>;
  accommodation?: Partial<OnboardingState['accommodation']>;
  tours?: Partial<OnboardingState['tours']>;
  activity?: Partial<OnboardingState['activity']>;
  pillar1?: Partial<OnboardingState['pillar1']>;
  pillar2?: Partial<OnboardingState['pillar2']>;
  pillar3?: Partial<OnboardingState['pillar3']>;
  evidence?: Partial<OnboardingState['evidence']>;
}

/**
 * Routes a flat OnboardingData patch to the appropriate OnboardingState slices.
 * Merges each field into its owning slice based on the field membership sets above.
 * Fields not matched by any set default to the 'base' slice.
 */
export function routePatch(
  patch: Partial<OnboardingData>,
  current: OnboardingState
): RoutedPatch {
  const result: RoutedPatch = {};

  let base = { ...current.base };
  let accommodation = { ...current.accommodation };
  let tours = { ...current.tours };
  let activity = { ...current.activity };
  let pillar1 = { ...current.pillar1 };
  let pillar2 = { ...current.pillar2 };
  let pillar3 = { ...current.pillar3 };
  let evidence = { ...current.evidence };

  for (const key of Object.keys(patch)) {
    const value = (patch as Record<string, unknown>)[key];

    if (key === 'operatorType') {
      result.capabilities = operatorTypeToCaps(value as 'A' | 'B' | 'C' | undefined);
    } else if (ACCOMMODATION_FIELDS.has(key)) {
      accommodation = { ...accommodation, [key]: value };
    } else if (TOURS_FIELDS.has(key)) {
      tours = { ...tours, [key]: value };
    } else if (ACTIVITY_FIELDS.has(key)) {
      activity = { ...activity, [key]: value };
    } else if (PILLAR1_FIELDS.has(key)) {
      pillar1 = { ...pillar1, [key]: value };
    } else if (PILLAR2_FIELDS.has(key)) {
      pillar2 = { ...pillar2, [key]: value };
    } else if (PILLAR3_FIELDS.has(key)) {
      pillar3 = { ...pillar3, [key]: value };
    } else if (EVIDENCE_FIELDS.has(key)) {
      evidence = { ...evidence, [key]: value };
    } else {
      // Default: base (identity, ownership, photos, UI state flags)
      base = { ...base, [key]: value };
    }
  }

  result.base = base;
  result.accommodation = accommodation;
  result.tours = tours;
  result.activity = activity;
  result.pillar1 = pillar1;
  result.pillar2 = pillar2;
  result.pillar3 = pillar3;
  result.evidence = evidence;

  return result;
}
