/**
 * Draft Migration
 *
 * Handles two tasks:
 *
 * 1. migrateDraft()  — converts any draft shape (v1 flat OR v2 sliced) to OnboardingState.
 *    Called on loadDraft to ensure the store always works with the new structure.
 *
 * 2. flattenState()  — converts OnboardingState back to the flat shape expected by
 *    the scoring API (/api/v1/score) and the existing step components.
 *    Preserves full backward compatibility with the API contract.
 *
 * 3. mapLegacyStepId() — maps old integer step index or old string step ID to
 *    the new namespaced step ID.
 */

import type { OnboardingState } from '../types';
import { operatorTypeToCaps } from '../types';

// ── Legacy step index → new step ID ──────────────────────────────────────────

const LEGACY_INDEX_MAP: Record<number, string> = {
  0:  'base:capability-select',
  1:  'base:identity',
  2:  'accommodation:setup',  // was operation-activity (routes to first capability step)
  3:  'base:photos',
  4:  'pillar1:energy',
  5:  'pillar1:water',
  6:  'pillar1:waste',
  7:  'pillar1:carbon',
  8:  'pillar1:site',
  9:  'pillar2:employment',
  10: 'pillar2:procurement',
  11: 'pillar2:revenue',
  12: 'pillar2:community',
  13: 'pillar3:status',
  14: 'pillar3:programme',
  15: 'pillar3:forward-commitment',
  16: 'evidence:delta',
  17: 'evidence:checklist',
  18: 'review:gps-preview',
  19: 'review:submit',
};

const LEGACY_ID_MAP: Record<string, string> = {
  'operator-type':          'base:capability-select',
  'identity':               'base:identity',
  'operation-activity':     'accommodation:setup',
  'photos':                 'base:photos',
  'p1-energy':              'pillar1:energy',
  'p1-water':               'pillar1:water',
  'p1-waste':               'pillar1:waste',
  'p1-carbon':              'pillar1:carbon',
  'p1-site':                'pillar1:site',
  'p2-employment':          'pillar2:employment',
  'p2-procurement':         'pillar2:procurement',
  'p2-revenue':             'pillar2:revenue',
  'p2-community':           'pillar2:community',
  'p3-status':              'pillar3:status',
  'p3-programme':           'pillar3:programme',
  'p3-forward-commitment':  'pillar3:forward-commitment',
  'delta':                  'evidence:delta',
  'evidence-checklist':     'evidence:checklist',
  'gps-preview':            'review:gps-preview',
  'review-submit':          'review:submit',
};

export function mapLegacyStepId(stepIdOrIndex: string | number | undefined): string {
  if (stepIdOrIndex === undefined) return 'base:capability-select';
  if (typeof stepIdOrIndex === 'number') {
    return LEGACY_INDEX_MAP[stepIdOrIndex] ?? 'base:capability-select';
  }
  // Already new format
  if (stepIdOrIndex.includes(':')) return stepIdOrIndex;
  // Old string format
  return LEGACY_ID_MAP[stepIdOrIndex] ?? 'base:capability-select';
}

// ── Draft migration ───────────────────────────────────────────────────────────

/**
 * Converts any draft shape to OnboardingState.
 * Handles:
 *   - v2 sliced format (already OnboardingState) — returned as-is
 *   - v1 flat format (legacy OnboardingData blob) — fields routed to slices
 *   - Empty / undefined — returns initial state
 */
export function migrateDraft(
  raw: unknown,
  stepIdOrIndex?: string | number
): OnboardingState {
  if (!raw || typeof raw !== 'object') {
    return makeInitialState();
  }

  const data = raw as Record<string, unknown>;

  // Already v2 — return as-is with currentStepId updated if provided
  if (data._v === 2) {
    const state = data as unknown as OnboardingState;
    return {
      ...state,
      currentStepId: stepIdOrIndex !== undefined
        ? mapLegacyStepId(stepIdOrIndex)
        : state.currentStepId,
    };
  }

  // v1 flat format — route all fields to slices
  const capabilities = operatorTypeToCaps(
    (data.operatorType as 'A' | 'B' | 'C' | undefined)
  );

  const currentStepId = mapLegacyStepId(stepIdOrIndex);

  return {
    _v: 2,
    capabilities,
    currentStepId,

    base: {
      legalName:            data.legalName as string | undefined,
      tradingName:          data.tradingName as string | undefined,
      country:              data.country as string | undefined,
      destinationRegion:    data.destinationRegion as string | undefined,
      territoryId:          data.territoryId as string | undefined,
      referenceDpi:         data.referenceDpi as boolean | undefined,
      yearOperationStart:   data.yearOperationStart as number | undefined,
      website:              data.website as string | undefined,
      primaryContactName:   data.primaryContactName as string | undefined,
      primaryContactEmail:  data.primaryContactEmail as string | undefined,
      address:              data.address as string | undefined,
      latitude:             data.latitude as number | undefined,
      longitude:            data.longitude as number | undefined,
      pricePerNight:        data.pricePerNight as number | undefined,
      ownershipType:        data.ownershipType as string | undefined,
      localEquityPct:       data.localEquityPct as number | undefined,
      isChainMember:        data.isChainMember as boolean | undefined,
      chainName:            data.chainName as string | undefined,
      soloOperator:         data.soloOperator as boolean | undefined,
      ownerLivesLocally:    data.ownerLivesLocally as boolean | undefined,
      assessmentPeriodEnd:  data.assessmentPeriodEnd as string | undefined,
      photoRefs:            data.photoRefs as BaseData['photoRefs'] | undefined,
      _accomGateShown:      data._accomGateShown as boolean | undefined,
      _confirmsNoAccommodation: data._confirmsNoAccommodation as boolean | undefined,
      _accomGateWarn:       data._accomGateWarn as boolean | undefined,
    },

    accommodation: {
      accommodationCategory: data.accommodationCategory as string | undefined,
      rooms:                 data.rooms as number | undefined,
      bedCapacity:           data.bedCapacity as number | undefined,
      guestNights:           data.guestNights as number | undefined,
    },

    tours: {
      experienceTypes:  data.experienceTypes as string[] | undefined,
      visitorDays:      data.visitorDays as number | undefined,
      tourNoFixedBase:  data.tourNoFixedBase as boolean | undefined,
      tourNoTransport:  data.tourNoTransport as boolean | undefined,
    },

    activity: {
      revenueSplitAccommodationPct: data.revenueSplitAccommodationPct as number | undefined,
      revenueSplitExperiencePct:    data.revenueSplitExperiencePct as number | undefined,
    },

    pillar1: {
      totalElectricityKwh:       data.totalElectricityKwh as number | undefined,
      totalGasKwh:               data.totalGasKwh as number | undefined,
      gridExportKwh:             data.gridExportKwh as number | undefined,
      officeElectricityKwh:      data.officeElectricityKwh as number | undefined,
      renewableOnsitePct:        data.renewableOnsitePct as number | undefined,
      renewableTariffPct:        data.renewableTariffPct as number | undefined,
      tourFuelType:              data.tourFuelType as string | undefined,
      tourFuelLitresPerMonth:    data.tourFuelLitresPerMonth as number | undefined,
      evKwhPerMonth:             data.evKwhPerMonth as number | undefined,
      evidenceTierEnergy:        data.evidenceTierEnergy as EvidenceTier | undefined,
      totalWaterLitres:          data.totalWaterLitres as number | undefined,
      waterGreywater:            data.waterGreywater as boolean | undefined,
      waterRainwater:            data.waterRainwater as boolean | undefined,
      waterWastewaterTreatment:  data.waterWastewaterTreatment as boolean | undefined,
      p1RecirculationScore:      data.p1RecirculationScore as number | undefined,
      evidenceTierWater:         data.evidenceTierWater as EvidenceTier | undefined,
      totalWasteKg:              data.totalWasteKg as number | undefined,
      wasteRecycledKg:           data.wasteRecycledKg as number | undefined,
      wasteCompostedKg:          data.wasteCompostedKg as number | undefined,
      wasteOtherDivertedKg:      data.wasteOtherDivertedKg as number | undefined,
      noSingleUsePlastics:       data.noSingleUsePlastics as boolean | undefined,
      foodWasteProgramme:        data.foodWasteProgramme as boolean | undefined,
      wasteEducation:            data.wasteEducation as boolean | undefined,
      evidenceTierWaste:         data.evidenceTierWaste as EvidenceTier | undefined,
      scope3TransportKgCo2e:     data.scope3TransportKgCo2e as number | undefined,
      evidenceTierCarbon:        data.evidenceTierCarbon as EvidenceTier | undefined,
      p1SiteScore:               data.p1SiteScore as number | undefined,
      evidenceTierSite:          data.evidenceTierSite as EvidenceTier | undefined,
    },

    pillar2: {
      totalFte:               data.totalFte as number | undefined,
      localFte:               data.localFte as number | undefined,
      permanentContractPct:   data.permanentContractPct as number | undefined,
      averageMonthlyWage:     data.averageMonthlyWage as number | undefined,
      minimumWage:            data.minimumWage as number | undefined,
      seasonalOperator:       data.seasonalOperator as boolean | undefined,
      evidenceTierEmployment: data.evidenceTierEmployment as EvidenceTier | undefined,
      totalFbSpend:           data.totalFbSpend as number | undefined,
      localFbSpend:           data.localFbSpend as number | undefined,
      totalNonFbSpend:        data.totalNonFbSpend as number | undefined,
      localNonFbSpend:        data.localNonFbSpend as number | undefined,
      foodServiceType:        data.foodServiceType as string | undefined,
      tourNoFbSpend:          data.tourNoFbSpend as boolean | undefined,
      tourNoNonFbSpend:       data.tourNoNonFbSpend as boolean | undefined,
      evidenceTierProcurement: data.evidenceTierProcurement as EvidenceTier | undefined,
      totalBookingsCount:     data.totalBookingsCount as number | undefined,
      allDirectBookings:      data.allDirectBookings as boolean | undefined,
      directBookingPct:       data.directBookingPct as number | undefined,
      evidenceTierRevenue:    data.evidenceTierRevenue as EvidenceTier | undefined,
      communityScore:         data.communityScore as number | undefined,
      evidenceTierCommunity:  data.evidenceTierCommunity as EvidenceTier | undefined,
    },

    pillar3: {
      p3Status:                            data.p3Status as P3Status | undefined,
      p3ContributionCategories:            data.p3ContributionCategories as string[] | undefined,
      p3ProgrammeDescription:              data.p3ProgrammeDescription as string | undefined,
      p3ProgrammeDuration:                 data.p3ProgrammeDuration as string | undefined,
      p3GeographicScope:                   data.p3GeographicScope as string | undefined,
      p3AnnualBudget:                      data.p3AnnualBudget as number | undefined,
      p3GuestsParticipating:               data.p3GuestsParticipating as number | undefined,
      p3IsCollective:                      data.p3IsCollective as boolean | undefined,
      p3CollectiveSize:                    data.p3CollectiveSize as string | undefined,
      p3CollectiveTotalBudget:             data.p3CollectiveTotalBudget as number | undefined,
      p3CollectiveSharePct:                data.p3CollectiveSharePct as number | undefined,
      p3InstitutionName:                   data.p3InstitutionName as string | undefined,
      p3Traceability:                      data.p3Traceability as number | undefined,
      p3Additionality:                     data.p3Additionality as number | undefined,
      p3Continuity:                        data.p3Continuity as number | undefined,
      forwardCommitmentPreferredCategory:  data.forwardCommitmentPreferredCategory as string | undefined,
      forwardCommitmentTerritoryContext:   data.forwardCommitmentTerritoryContext as string | undefined,
      forwardCommitmentPreferredInstitutionType: data.forwardCommitmentPreferredInstitutionType as string | undefined,
      forwardCommitmentTargetCycle:        data.forwardCommitmentTargetCycle as number | undefined,
      forwardCommitmentSignatory:          data.forwardCommitmentSignatory as string | undefined,
      forwardCommitmentSignedAt:           data.forwardCommitmentSignedAt as string | undefined,
    },

    evidence: {
      evidenceChecklistElectricity: data.evidenceChecklistElectricity as boolean | undefined,
      evidenceChecklistGasFuel:     data.evidenceChecklistGasFuel as boolean | undefined,
      evidenceChecklistWater:       data.evidenceChecklistWater as boolean | undefined,
      evidenceChecklistWaste:       data.evidenceChecklistWaste as boolean | undefined,
      evidenceChecklistEmployment:  data.evidenceChecklistEmployment as boolean | undefined,
      evidenceChecklistSupplier:    data.evidenceChecklistSupplier as boolean | undefined,
      evidenceChecklistBooking:     data.evidenceChecklistBooking as boolean | undefined,
      evidenceChecklistOwnership:   data.evidenceChecklistOwnership as boolean | undefined,
      evidenceChecklistP3:          data.evidenceChecklistP3 as boolean | undefined,
      evidenceRefs:                 data.evidenceRefs as EvidenceData['evidenceRefs'] | undefined,
      assessmentCycle:              data.assessmentCycle as number | undefined,
      deltaExplanation:             data.deltaExplanation as string | undefined,
    },
  };
}

export function makeInitialState(): OnboardingState {
  return {
    _v: 2,
    capabilities: [],
    currentStepId: 'base:capability-select',
    base: {},
    accommodation: {},
    tours: {},
    activity: {},
    pillar1: {},
    pillar2: {},
    pillar3: {},
    evidence: {},
  };
}

// ── Type imports needed for this file ─────────────────────────────────────────

import type { BaseData, EvidenceData, EvidenceTier, P3Status } from '../types';
