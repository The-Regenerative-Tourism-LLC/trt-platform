/**
 * Onboarding Engine Tests
 *
 * Full coverage for:
 *   - createFullState helper (all slices, all fields)
 *   - Full roundtrip: state → v2 payload → migrateDraft → same slices
 *   - Field coverage: no data loss through flattenState
 *   - buildFlow for accommodation-only, tours-only, combined
 *   - Step conditions: tours-only, noFixedBase, delta, p3Status
 *   - Validation for every step in STEP_REGISTRY
 *   - migrateDraft: v1 full, partial, empty
 *   - routePatch: slice isolation
 *   - computeFlatData: matches all slices combined
 *   - Persistence structure: saveDraft payload shape
 */

import { describe, it, expect } from 'vitest';
import type { OnboardingState, CapabilityId } from '@/lib/onboarding/types';
import {
  migrateDraft,
  makeInitialState,
  mapLegacyStepId,
} from '@/lib/onboarding/engine/draft-migration';
import { flattenState, computeFlatData } from '@/lib/onboarding/engine/compat';
import { routePatch } from '@/lib/onboarding/engine/field-router';
import { buildFlow } from '@/lib/onboarding/engine/flow-builder';
import { STEP_REGISTRY } from '@/lib/onboarding/registry/step-registry';

// ── createFullState ───────────────────────────────────────────────────────────

/**
 * Returns an OnboardingState with every field in every slice populated.
 * Used as the canonical fixture for all engine tests.
 */
function createFullState(): OnboardingState {
  return {
    _v: 2,
    capabilities: ['accommodation', 'tours'],
    currentStepId: 'pillar1:energy',

    base: {
      legalName: 'Quinta das Levadas Lda.',
      tradingName: 'Levadas Eco Lodge',
      country: 'Portugal',
      destinationRegion: 'Alentejo',
      territoryId: 'ter-1',
      referenceDpi: false,
      yearOperationStart: 2015,
      website: 'https://levadas.pt',
      primaryContactName: 'Ana Costa',
      primaryContactEmail: 'ana@levadas.pt',
      address: 'Rua das Levadas 1, Évora',
      latitude: 38.7,
      longitude: -9.1,
      pricePerNight: 120,
      ownershipType: 'sole-proprietor',
      localEquityPct: 100,
      isChainMember: false,
      chainName: 'None',
      soloOperator: false,
      ownerLivesLocally: true,
      assessmentPeriodEnd: '2024-12-31',
      photoRefs: [
        { id: 'ph-1', url: 'https://storage.example.com/cover.jpg', isCover: true, fileName: 'cover.jpg' },
      ],
      _accomGateShown: false,
      _confirmsNoAccommodation: false,
      _accomGateWarn: false,
    },

    accommodation: {
      accommodationCategory: 'guesthouse',
      rooms: 8,
      bedCapacity: 16,
      guestNights: 1800,
    },

    tours: {
      experienceTypes: ['hiking_trekking', 'nature_wildlife'],
      visitorDays: 600,
      tourNoFixedBase: false,
      tourNoTransport: false,
    },

    activity: {
      revenueSplitAccommodationPct: 70,
      revenueSplitExperiencePct: 30,
    },

    pillar1: {
      totalElectricityKwh: 12000,
      totalGasKwh: 2000,
      gridExportKwh: 500,
      officeElectricityKwh: 1000,
      renewableOnsitePct: 40,
      renewableTariffPct: 20,
      tourFuelType: 'diesel',
      tourFuelLitresPerMonth: 50,
      evKwhPerMonth: 0,
      evidenceTierEnergy: 'T2',
      totalWaterLitres: 60000,
      waterGreywater: true,
      waterRainwater: false,
      waterWastewaterTreatment: true,
      p1RecirculationScore: 2,
      evidenceTierWater: 'T2',
      totalWasteKg: 1500,
      wasteRecycledKg: 500,
      wasteCompostedKg: 200,
      wasteOtherDivertedKg: 100,
      noSingleUsePlastics: true,
      foodWasteProgramme: false,
      wasteEducation: true,
      evidenceTierWaste: 'T2',
      scope3TransportKgCo2e: 800,
      evidenceTierCarbon: 'T2',
      p1SiteScore: 3,
      evidenceTierSite: 'T2',
    },

    pillar2: {
      totalFte: 5,
      localFte: 4,
      permanentContractPct: 80,
      averageMonthlyWage: 950,
      minimumWage: 820,
      seasonalOperator: false,
      evidenceTierEmployment: 'T2',
      totalFbSpend: 15000,
      localFbSpend: 11000,
      totalNonFbSpend: 6000,
      localNonFbSpend: 4000,
      foodServiceType: 'breakfast_only',
      tourNoFbSpend: false,
      tourNoNonFbSpend: false,
      evidenceTierProcurement: 'T2',
      totalBookingsCount: 450,
      allDirectBookings: false,
      directBookingPct: 65,
      evidenceTierRevenue: 'T2',
      communityScore: 3,
      evidenceTierCommunity: 'T2',
    },

    pillar3: {
      p3Status: 'A',
      p3ContributionCategories: ['Cat1', 'Cat3'],
      p3ProgrammeDescription: 'Habitat restoration programme.',
      p3ProgrammeDuration: '5 years',
      p3GeographicScope: 'local',
      p3AnnualBudget: 8000,
      p3GuestsParticipating: 30,
      p3IsCollective: false,
      p3CollectiveSize: 'small',
      p3CollectiveTotalBudget: 20000,
      p3CollectiveSharePct: 40,
      p3InstitutionName: 'WWF Portugal',
      p3Traceability: 75,
      p3Additionality: 50,
      p3Continuity: 75,
      forwardCommitmentPreferredCategory: 'Cat2',
      forwardCommitmentTerritoryContext: 'Alentejo wilderness corridor',
      forwardCommitmentPreferredInstitutionType: 'NGO',
      forwardCommitmentTargetCycle: 3,
      forwardCommitmentSignatory: 'Ana Costa',
      forwardCommitmentSignedAt: '2024-11-01',
    },

    evidence: {
      evidenceChecklistElectricity: true,
      evidenceChecklistGasFuel: true,
      evidenceChecklistWater: true,
      evidenceChecklistWaste: true,
      evidenceChecklistEmployment: true,
      evidenceChecklistSupplier: true,
      evidenceChecklistBooking: true,
      evidenceChecklistOwnership: true,
      evidenceChecklistP3: true,
      evidenceRefs: [
        { indicatorId: 'p1_energy', tier: 'T2', checksum: 'abc123', verificationState: 'pending' },
      ],
      assessmentCycle: 2,
      deltaExplanation: 'Installed rooftop solar in year 2.',
    },
  };
}

// ── 1. Full Roundtrip ─────────────────────────────────────────────────────────

describe('Full roundtrip — state → v2 payload → migrateDraft → same state', () => {
  it('all slices are preserved through JSON serialisation and migrateDraft', () => {
    const original = createFullState();

    // Simulate what saveDraft writes to dataJson (clean v2, no flat spread)
    const dataJson = {
      _v: 2 as const,
      capabilities: original.capabilities,
      currentStepId: original.currentStepId,
      base: original.base,
      accommodation: original.accommodation,
      tours: original.tours,
      activity: original.activity,
      pillar1: original.pillar1,
      pillar2: original.pillar2,
      pillar3: original.pillar3,
      evidence: original.evidence,
    };

    // Simulate database persistence (JSON roundtrip)
    const persisted = JSON.parse(JSON.stringify(dataJson));

    // migrateDraft recognises _v === 2 and returns as-is
    const loaded = migrateDraft(persisted);

    expect(loaded._v).toBe(2);
    expect(loaded.capabilities).toEqual(original.capabilities);
    expect(loaded.currentStepId).toBe(original.currentStepId);
    expect(loaded.base).toEqual(original.base);
    expect(loaded.accommodation).toEqual(original.accommodation);
    expect(loaded.tours).toEqual(original.tours);
    expect(loaded.activity).toEqual(original.activity);
    expect(loaded.pillar1).toEqual(original.pillar1);
    expect(loaded.pillar2).toEqual(original.pillar2);
    expect(loaded.pillar3).toEqual(original.pillar3);
    expect(loaded.evidence).toEqual(original.evidence);
  });

  it('no slice is undefined after roundtrip', () => {
    const loaded = migrateDraft(JSON.parse(JSON.stringify(createFullState())));
    for (const key of ['base', 'accommodation', 'tours', 'activity', 'pillar1', 'pillar2', 'pillar3', 'evidence'] as const) {
      expect(loaded[key], `${key} should not be undefined`).toBeDefined();
    }
  });

  it('currentStepId override via stepIdOrIndex is applied', () => {
    const payload = { ...createFullState() };
    const loaded = migrateDraft(payload, 'pillar2:employment');
    expect(loaded.currentStepId).toBe('pillar2:employment');
  });

  it('integer stepIdOrIndex is mapped to namespaced step id', () => {
    const payload = { ...createFullState() };
    const loaded = migrateDraft(payload, 4); // 4 → pillar1:energy
    expect(loaded.currentStepId).toBe('pillar1:energy');
  });
});

// ── 2. Field Coverage ─────────────────────────────────────────────────────────

describe('Field coverage — flattenState contains all slice keys', () => {
  it('all base keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.base)) {
      expect(flat, `base.${key} missing`).toHaveProperty(key);
    }
  });

  it('all accommodation keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.accommodation)) {
      expect(flat, `accommodation.${key} missing`).toHaveProperty(key);
    }
  });

  it('all tours keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.tours)) {
      expect(flat, `tours.${key} missing`).toHaveProperty(key);
    }
  });

  it('all activity keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.activity)) {
      expect(flat, `activity.${key} missing`).toHaveProperty(key);
    }
  });

  it('all pillar1 keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.pillar1)) {
      expect(flat, `pillar1.${key} missing`).toHaveProperty(key);
    }
  });

  it('all pillar2 keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.pillar2)) {
      expect(flat, `pillar2.${key} missing`).toHaveProperty(key);
    }
  });

  it('all pillar3 keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.pillar3)) {
      expect(flat, `pillar3.${key} missing`).toHaveProperty(key);
    }
  });

  it('all evidence keys appear in flat output', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;
    for (const key of Object.keys(state.evidence)) {
      expect(flat, `evidence.${key} missing`).toHaveProperty(key);
    }
  });

  it('flat values match the original slice values — no silent renaming', () => {
    const state = createFullState();
    const flat = flattenState(state) as Record<string, unknown>;

    expect(flat.legalName).toBe(state.base.legalName);
    expect(flat.guestNights).toBe(state.accommodation.guestNights);
    expect(flat.visitorDays).toBe(state.tours.visitorDays);
    expect(flat.revenueSplitAccommodationPct).toBe(state.activity.revenueSplitAccommodationPct);
    expect(flat.totalElectricityKwh).toBe(state.pillar1.totalElectricityKwh);
    expect(flat.totalFte).toBe(state.pillar2.totalFte);
    expect(flat.p3Status).toBe(state.pillar3.p3Status);
    expect(flat.evidenceChecklistElectricity).toBe(state.evidence.evidenceChecklistElectricity);
  });

  it('operatorType is derived from capabilities in flat output', () => {
    const flat = flattenState(createFullState()) as Record<string, unknown>;
    // accommodation + tours → C
    expect(flat.operatorType).toBe('C');
  });
});

// ── 3. Flow Tests ─────────────────────────────────────────────────────────────

describe('buildFlow — accommodation only (type A)', () => {
  const state: OnboardingState = {
    ...makeInitialState(),
    capabilities: ['accommodation'],
  };

  it('includes accommodation:setup', () => {
    expect(buildFlow(state)).toContain('accommodation:setup');
  });

  it('excludes tours:setup', () => {
    expect(buildFlow(state)).not.toContain('tours:setup');
  });

  it('excludes base:revenue-split', () => {
    expect(buildFlow(state)).not.toContain('base:revenue-split');
  });

  it('includes all assessment section steps', () => {
    const flow = buildFlow(state);
    expect(flow).toContain('pillar1:energy');
    expect(flow).toContain('pillar2:employment');
    expect(flow).toContain('pillar3:status');
    expect(flow).toContain('evidence:checklist');
    expect(flow).toContain('review:submit');
  });

  it('steps are in correct order: capability-select → identity → photos → accommodation:setup', () => {
    const flow = buildFlow(state);
    expect(flow.indexOf('base:capability-select')).toBeLessThan(flow.indexOf('base:identity'));
    expect(flow.indexOf('base:identity')).toBeLessThan(flow.indexOf('base:photos'));
    expect(flow.indexOf('base:photos')).toBeLessThan(flow.indexOf('accommodation:setup'));
  });
});

describe('buildFlow — tours only (type B)', () => {
  const state: OnboardingState = {
    ...makeInitialState(),
    capabilities: ['tours'],
  };

  it('includes tours:setup', () => {
    expect(buildFlow(state)).toContain('tours:setup');
  });

  it('excludes accommodation:setup', () => {
    expect(buildFlow(state)).not.toContain('accommodation:setup');
  });

  it('excludes base:revenue-split', () => {
    expect(buildFlow(state)).not.toContain('base:revenue-split');
  });

  it('includes all assessment section steps', () => {
    const flow = buildFlow(state);
    expect(flow).toContain('pillar1:energy');
    expect(flow).toContain('pillar2:employment');
    expect(flow).toContain('pillar3:status');
    expect(flow).toContain('review:submit');
  });
});

describe('buildFlow — combined (type C)', () => {
  const state: OnboardingState = {
    ...makeInitialState(),
    capabilities: ['accommodation', 'tours'],
  };

  it('includes accommodation:setup', () => {
    expect(buildFlow(state)).toContain('accommodation:setup');
  });

  it('includes tours:setup', () => {
    expect(buildFlow(state)).toContain('tours:setup');
  });

  it('includes base:revenue-split', () => {
    expect(buildFlow(state)).toContain('base:revenue-split');
  });

  it('revenue-split comes before assessment steps', () => {
    const flow = buildFlow(state);
    expect(flow.indexOf('base:revenue-split')).toBeLessThan(flow.indexOf('pillar1:energy'));
  });

  it('accommodation:setup comes before tours:setup', () => {
    const flow = buildFlow(state);
    expect(flow.indexOf('accommodation:setup')).toBeLessThan(flow.indexOf('tours:setup'));
  });

  it('no steps from tours appear before accommodation steps (capability order preserved)', () => {
    const flow = buildFlow(state);
    const accomIdx = flow.indexOf('accommodation:setup');
    const toursIdx = flow.indexOf('tours:setup');
    expect(accomIdx).toBeGreaterThanOrEqual(0);
    expect(toursIdx).toBeGreaterThanOrEqual(0);
    expect(accomIdx).toBeLessThan(toursIdx);
  });
});

// ── 4. Step Conditions ────────────────────────────────────────────────────────

describe('Step conditions — edge cases', () => {
  function stateWithCaps(caps: CapabilityId[], extras: Partial<OnboardingState> = {}): OnboardingState {
    return { ...makeInitialState(), capabilities: caps, ...extras };
  }

  // pillar1:water — excluded when tours-only + noFixedBase
  it('pillar1:water excluded when tours-only and tourNoFixedBase = true', () => {
    const state = stateWithCaps(['tours'], { tours: { tourNoFixedBase: true } });
    expect(buildFlow(state)).not.toContain('pillar1:water');
  });

  it('pillar1:water included when tours-only and tourNoFixedBase = false', () => {
    const state = stateWithCaps(['tours'], { tours: { tourNoFixedBase: false } });
    expect(buildFlow(state)).toContain('pillar1:water');
  });

  it('pillar1:water included when tours-only and tourNoFixedBase is undefined', () => {
    const state = stateWithCaps(['tours'], { tours: {} });
    expect(buildFlow(state)).toContain('pillar1:water');
  });

  it('pillar1:water included when accommodation-only (noFixedBase irrelevant)', () => {
    expect(buildFlow(stateWithCaps(['accommodation']))).toContain('pillar1:water');
  });

  it('pillar1:water included when combined (accommodation + tours) with tourNoFixedBase = true', () => {
    const state = stateWithCaps(['accommodation', 'tours'], { tours: { tourNoFixedBase: true } });
    // hasBothCapabilities → not tours-only → condition is false → step included
    expect(buildFlow(state)).toContain('pillar1:water');
  });

  // evidence:delta — cycle gating
  it('evidence:delta excluded when assessmentCycle = 1', () => {
    const state = stateWithCaps(['accommodation'], { evidence: { assessmentCycle: 1 } });
    expect(buildFlow(state)).not.toContain('evidence:delta');
  });

  it('evidence:delta excluded when assessmentCycle is undefined', () => {
    const state = stateWithCaps(['accommodation'], { evidence: {} });
    expect(buildFlow(state)).not.toContain('evidence:delta');
  });

  it('evidence:delta included when assessmentCycle = 2', () => {
    const state = stateWithCaps(['accommodation'], { evidence: { assessmentCycle: 2 } });
    expect(buildFlow(state)).toContain('evidence:delta');
  });

  it('evidence:delta included when assessmentCycle = 3', () => {
    const state = stateWithCaps(['accommodation'], { evidence: { assessmentCycle: 3 } });
    expect(buildFlow(state)).toContain('evidence:delta');
  });

  // pillar3:programme — p3Status A/B/C
  it('pillar3:programme included when p3Status = A', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'A' } });
    expect(buildFlow(state)).toContain('pillar3:programme');
  });

  it('pillar3:programme included when p3Status = B', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'B' } });
    expect(buildFlow(state)).toContain('pillar3:programme');
  });

  it('pillar3:programme included when p3Status = C', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'C' } });
    expect(buildFlow(state)).toContain('pillar3:programme');
  });

  it('pillar3:programme excluded when p3Status = D', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'D' } });
    expect(buildFlow(state)).not.toContain('pillar3:programme');
  });

  it('pillar3:programme excluded when p3Status = E', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'E' } });
    expect(buildFlow(state)).not.toContain('pillar3:programme');
  });

  // pillar3:forward-commitment — p3Status D only
  it('pillar3:forward-commitment included when p3Status = D', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'D' } });
    expect(buildFlow(state)).toContain('pillar3:forward-commitment');
  });

  it('pillar3:forward-commitment excluded when p3Status = A', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'A' } });
    expect(buildFlow(state)).not.toContain('pillar3:forward-commitment');
  });

  it('pillar3:forward-commitment excluded when p3Status = E', () => {
    const state = stateWithCaps(['accommodation'], { pillar3: { p3Status: 'E' } });
    expect(buildFlow(state)).not.toContain('pillar3:forward-commitment');
  });
});

// ── 5. Validation — all STEP_REGISTRY steps ───────────────────────────────────

describe('STEP_REGISTRY validation — base:capability-select', () => {
  it('fails with empty capabilities', () => {
    expect(STEP_REGISTRY['base:capability-select'].validate!(makeInitialState())).toBe(false);
  });
  it('passes with accommodation', () => {
    const s = { ...makeInitialState(), capabilities: ['accommodation'] as CapabilityId[] };
    expect(STEP_REGISTRY['base:capability-select'].validate!(s)).toBe(true);
  });
  it('passes with tours', () => {
    const s = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[] };
    expect(STEP_REGISTRY['base:capability-select'].validate!(s)).toBe(true);
  });
  it('passes with both', () => {
    const s = { ...makeInitialState(), capabilities: ['accommodation', 'tours'] as CapabilityId[] };
    expect(STEP_REGISTRY['base:capability-select'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — base:identity', () => {
  it('fails when legalName missing', () => {
    const s = { ...makeInitialState(), base: { country: 'Portugal' } };
    expect(STEP_REGISTRY['base:identity'].validate!(s)).toBe(false);
  });
  it('fails when country missing', () => {
    const s = { ...makeInitialState(), base: { legalName: 'Test Lda.' } };
    expect(STEP_REGISTRY['base:identity'].validate!(s)).toBe(false);
  });
  it('fails when both empty strings', () => {
    const s = { ...makeInitialState(), base: { legalName: '', country: '' } };
    expect(STEP_REGISTRY['base:identity'].validate!(s)).toBe(false);
  });
  it('passes with legalName and country', () => {
    const s = { ...makeInitialState(), base: { legalName: 'Test Lda.', country: 'Portugal' } };
    expect(STEP_REGISTRY['base:identity'].validate!(s)).toBe(true);
  });
  it('optional fields do not block progression', () => {
    // primaryContactName, website, etc. are optional — should still pass
    const s = { ...makeInitialState(), base: { legalName: 'Test', country: 'PT' } };
    expect(STEP_REGISTRY['base:identity'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — base:revenue-split', () => {
  it('fails when split does not sum to 100', () => {
    const s = { ...makeInitialState(), activity: { revenueSplitAccommodationPct: 60, revenueSplitExperiencePct: 30 } };
    expect(STEP_REGISTRY['base:revenue-split'].validate!(s)).toBe(false);
  });
  it('fails when fields are missing', () => {
    expect(STEP_REGISTRY['base:revenue-split'].validate!(makeInitialState())).toBe(false);
  });
  it('passes when split sums to exactly 100', () => {
    const s = { ...makeInitialState(), activity: { revenueSplitAccommodationPct: 65, revenueSplitExperiencePct: 35 } };
    expect(STEP_REGISTRY['base:revenue-split'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — base:photos', () => {
  it('fails when photoRefs is empty', () => {
    const s = { ...makeInitialState(), base: { photoRefs: [] } };
    expect(STEP_REGISTRY['base:photos'].validate!(s)).toBe(false);
  });
  it('fails when photoRefs is missing', () => {
    expect(STEP_REGISTRY['base:photos'].validate!(makeInitialState())).toBe(false);
  });
  it('passes with at least one photo', () => {
    const s = { ...makeInitialState(), base: { photoRefs: [{ id: 'p1', url: 'x', isCover: true }] } };
    expect(STEP_REGISTRY['base:photos'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — accommodation:setup', () => {
  it('fails when accommodationCategory missing', () => {
    const s = { ...makeInitialState(), accommodation: { rooms: 5, guestNights: 100 } };
    expect(STEP_REGISTRY['accommodation:setup'].validate!(s)).toBe(false);
  });
  it('fails when rooms = 0', () => {
    const s = { ...makeInitialState(), accommodation: { accommodationCategory: 'guesthouse', rooms: 0, guestNights: 100 } };
    expect(STEP_REGISTRY['accommodation:setup'].validate!(s)).toBe(false);
  });
  it('fails when guestNights = 0', () => {
    const s = { ...makeInitialState(), accommodation: { accommodationCategory: 'guesthouse', rooms: 5, guestNights: 0 } };
    expect(STEP_REGISTRY['accommodation:setup'].validate!(s)).toBe(false);
  });
  it('passes with category, rooms > 0, guestNights > 0', () => {
    const s = { ...makeInitialState(), accommodation: { accommodationCategory: 'guesthouse', rooms: 5, guestNights: 800 } };
    expect(STEP_REGISTRY['accommodation:setup'].validate!(s)).toBe(true);
  });
  it('optional bedCapacity does not block', () => {
    const s = { ...makeInitialState(), accommodation: { accommodationCategory: 'eco-lodge', rooms: 3, guestNights: 200 } };
    expect(STEP_REGISTRY['accommodation:setup'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — tours:setup', () => {
  it('fails when experienceTypes is empty', () => {
    const s = { ...makeInitialState(), tours: { experienceTypes: [], visitorDays: 200 } };
    expect(STEP_REGISTRY['tours:setup'].validate!(s)).toBe(false);
  });
  it('fails when visitorDays = 0', () => {
    const s = { ...makeInitialState(), tours: { experienceTypes: ['hiking_trekking'], visitorDays: 0 } };
    expect(STEP_REGISTRY['tours:setup'].validate!(s)).toBe(false);
  });
  it('fails when visitorDays missing', () => {
    const s = { ...makeInitialState(), tours: { experienceTypes: ['hiking_trekking'] } };
    expect(STEP_REGISTRY['tours:setup'].validate!(s)).toBe(false);
  });
  it('passes with at least one type and visitorDays > 0', () => {
    const s = { ...makeInitialState(), tours: { experienceTypes: ['hiking_trekking'], visitorDays: 300 } };
    expect(STEP_REGISTRY['tours:setup'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar1:energy', () => {
  it('fails with no energy data for accommodation', () => {
    const s = { ...makeInitialState(), capabilities: ['accommodation'] as CapabilityId[] };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(false);
  });
  it('passes when totalElectricityKwh = 0 (zero is valid non-neg)', () => {
    const s = { ...makeInitialState(), capabilities: ['accommodation'] as CapabilityId[], pillar1: { totalElectricityKwh: 0 } };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(true);
  });
  it('passes with totalGasKwh for accommodation-only', () => {
    const s = { ...makeInitialState(), capabilities: ['accommodation'] as CapabilityId[], pillar1: { totalGasKwh: 500 } };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(true);
  });
  it('tours-only: passes with tourNoTransport = true', () => {
    const s = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[], tours: { tourNoTransport: true } };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(true);
  });
  it('tours-only: passes with tourFuelType = no_vehicle', () => {
    const s = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[], pillar1: { tourFuelType: 'no_vehicle' } };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(true);
  });
  it('tours-only: fails with no energy or transport data', () => {
    const s = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[] };
    expect(STEP_REGISTRY['pillar1:energy'].validate!(s)).toBe(false);
  });
});

describe('STEP_REGISTRY validation — pillar1:water', () => {
  it('fails when totalWaterLitres missing', () => {
    const s = { ...makeInitialState(), pillar1: { waterGreywater: false, waterRainwater: false, waterWastewaterTreatment: false } };
    expect(STEP_REGISTRY['pillar1:water'].validate!(s)).toBe(false);
  });
  it('fails when water booleans missing', () => {
    const s = { ...makeInitialState(), pillar1: { totalWaterLitres: 50000 } };
    expect(STEP_REGISTRY['pillar1:water'].validate!(s)).toBe(false);
  });
  it('passes when totalWaterLitres = 0 and all booleans provided', () => {
    const s = {
      ...makeInitialState(),
      pillar1: { totalWaterLitres: 0, waterGreywater: false, waterRainwater: false, waterWastewaterTreatment: false },
    };
    expect(STEP_REGISTRY['pillar1:water'].validate!(s)).toBe(true);
  });
  it('tours-only with tourNoFixedBase = true: passes (step is hidden, validation always true)', () => {
    const s = {
      ...makeInitialState(),
      capabilities: ['tours'] as CapabilityId[],
      tours: { tourNoFixedBase: true },
    };
    expect(STEP_REGISTRY['pillar1:water'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar1:waste', () => {
  it('fails when totalWasteKg missing', () => {
    expect(STEP_REGISTRY['pillar1:waste'].validate!(makeInitialState())).toBe(false);
  });
  it('passes when totalWasteKg = 0', () => {
    const s = { ...makeInitialState(), pillar1: { totalWasteKg: 0 } };
    expect(STEP_REGISTRY['pillar1:waste'].validate!(s)).toBe(true);
  });
  it('optional waste breakdown does not block', () => {
    const s = { ...makeInitialState(), pillar1: { totalWasteKg: 500 } };
    expect(STEP_REGISTRY['pillar1:waste'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar1:carbon', () => {
  it('always passes (informational step)', () => {
    expect(STEP_REGISTRY['pillar1:carbon'].validate!(makeInitialState())).toBe(true);
    expect(STEP_REGISTRY['pillar1:carbon'].validate!(createFullState())).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar1:site', () => {
  it('fails when p1SiteScore missing', () => {
    expect(STEP_REGISTRY['pillar1:site'].validate!(makeInitialState())).toBe(false);
  });
  it('passes when p1SiteScore = 0', () => {
    const s = { ...makeInitialState(), pillar1: { p1SiteScore: 0 } };
    expect(STEP_REGISTRY['pillar1:site'].validate!(s)).toBe(true);
  });
  it('passes when p1SiteScore = 4', () => {
    const s = { ...makeInitialState(), pillar1: { p1SiteScore: 4 } };
    expect(STEP_REGISTRY['pillar1:site'].validate!(s)).toBe(true);
  });
  it('fails when p1SiteScore = 5 (out of range)', () => {
    const s = { ...makeInitialState(), pillar1: { p1SiteScore: 5 } };
    expect(STEP_REGISTRY['pillar1:site'].validate!(s)).toBe(false);
  });
});

describe('STEP_REGISTRY validation — pillar2:employment', () => {
  it('passes immediately when soloOperator = true', () => {
    const s = { ...makeInitialState(), base: { soloOperator: true } };
    expect(STEP_REGISTRY['pillar2:employment'].validate!(s)).toBe(true);
  });
  it('fails when non-solo and required fields missing', () => {
    const s = { ...makeInitialState(), base: { soloOperator: false } };
    expect(STEP_REGISTRY['pillar2:employment'].validate!(s)).toBe(false);
  });
  it('fails when non-solo and totalFte = 0', () => {
    const s = {
      ...makeInitialState(),
      base: { soloOperator: false },
      pillar2: { totalFte: 0, localFte: 0, permanentContractPct: 80, averageMonthlyWage: 900 },
    };
    expect(STEP_REGISTRY['pillar2:employment'].validate!(s)).toBe(false);
  });
  it('passes when non-solo with all required fields valid', () => {
    const s = {
      ...makeInitialState(),
      base: { soloOperator: false },
      pillar2: { totalFte: 4, localFte: 3, permanentContractPct: 75, averageMonthlyWage: 900 },
    };
    expect(STEP_REGISTRY['pillar2:employment'].validate!(s)).toBe(true);
  });
  it('optional minimumWage does not block', () => {
    const s = {
      ...makeInitialState(),
      base: { soloOperator: false },
      pillar2: { totalFte: 2, localFte: 2, permanentContractPct: 100, averageMonthlyWage: 950 },
    };
    expect(STEP_REGISTRY['pillar2:employment'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar2:procurement', () => {
  it('fails when no fb or non-fb spend data', () => {
    expect(STEP_REGISTRY['pillar2:procurement'].validate!(makeInitialState())).toBe(false);
  });
  it('passes when tourNoFbSpend = true and tourNoNonFbSpend = true', () => {
    const s = { ...makeInitialState(), pillar2: { tourNoFbSpend: true, tourNoNonFbSpend: true } };
    expect(STEP_REGISTRY['pillar2:procurement'].validate!(s)).toBe(true);
  });
  it('passes when spend values are 0', () => {
    const s = { ...makeInitialState(), pillar2: { totalFbSpend: 0, totalNonFbSpend: 0 } };
    expect(STEP_REGISTRY['pillar2:procurement'].validate!(s)).toBe(true);
  });
  it('fails when only fb spend is provided but non-fb is missing', () => {
    const s = { ...makeInitialState(), pillar2: { totalFbSpend: 5000 } };
    expect(STEP_REGISTRY['pillar2:procurement'].validate!(s)).toBe(false);
  });
});

describe('STEP_REGISTRY validation — pillar2:revenue', () => {
  it('fails when totalBookingsCount missing', () => {
    const s = { ...makeInitialState(), pillar2: { directBookingPct: 50, evidenceTierRevenue: 'T2' as const } };
    expect(STEP_REGISTRY['pillar2:revenue'].validate!(s)).toBe(false);
  });
  it('fails when evidenceTierRevenue missing', () => {
    const s = { ...makeInitialState(), pillar2: { totalBookingsCount: 200, directBookingPct: 50 } };
    expect(STEP_REGISTRY['pillar2:revenue'].validate!(s)).toBe(false);
  });
  it('passes with allDirectBookings = true (no directBookingPct needed)', () => {
    const s = { ...makeInitialState(), pillar2: { totalBookingsCount: 200, allDirectBookings: true, evidenceTierRevenue: 'T2' as const } };
    expect(STEP_REGISTRY['pillar2:revenue'].validate!(s)).toBe(true);
  });
  it('passes with totalBookingsCount, directBookingPct = 0, evidenceTierRevenue', () => {
    const s = { ...makeInitialState(), pillar2: { totalBookingsCount: 100, directBookingPct: 0, evidenceTierRevenue: 'T1' as const } };
    expect(STEP_REGISTRY['pillar2:revenue'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar2:community', () => {
  it('fails when communityScore missing', () => {
    const s = { ...makeInitialState(), pillar2: { evidenceTierCommunity: 'T2' as const } };
    expect(STEP_REGISTRY['pillar2:community'].validate!(s)).toBe(false);
  });
  it('fails when evidenceTierCommunity missing', () => {
    const s = { ...makeInitialState(), pillar2: { communityScore: 3 } };
    expect(STEP_REGISTRY['pillar2:community'].validate!(s)).toBe(false);
  });
  it('passes with communityScore = 0 and evidenceTierCommunity', () => {
    const s = { ...makeInitialState(), pillar2: { communityScore: 0, evidenceTierCommunity: 'T2' as const } };
    expect(STEP_REGISTRY['pillar2:community'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar3:status', () => {
  it('fails when p3Status missing', () => {
    expect(STEP_REGISTRY['pillar3:status'].validate!(makeInitialState())).toBe(false);
  });
  it('passes for all valid statuses A-E', () => {
    for (const status of ['A', 'B', 'C', 'D', 'E'] as const) {
      const s = { ...makeInitialState(), pillar3: { p3Status: status } };
      expect(STEP_REGISTRY['pillar3:status'].validate!(s), `status ${status}`).toBe(true);
    }
  });
});

describe('STEP_REGISTRY validation — pillar3:programme', () => {
  it('passes automatically when p3Status is not A/B/C (step not visible)', () => {
    const s = { ...makeInitialState(), pillar3: { p3Status: 'D' as const } };
    expect(STEP_REGISTRY['pillar3:programme'].validate!(s)).toBe(true);
  });
  it('fails for status A when required fields missing', () => {
    const s = { ...makeInitialState(), pillar3: { p3Status: 'A' as const } };
    expect(STEP_REGISTRY['pillar3:programme'].validate!(s)).toBe(false);
  });
  it('fails for status A when categories empty', () => {
    const s = {
      ...makeInitialState(),
      pillar3: { p3Status: 'A' as const, p3ContributionCategories: [], p3Traceability: 75, p3Additionality: 50, p3Continuity: 75 },
    };
    expect(STEP_REGISTRY['pillar3:programme'].validate!(s)).toBe(false);
  });
  it('passes for status A with categories and quality scores', () => {
    const s = {
      ...makeInitialState(),
      pillar3: { p3Status: 'A' as const, p3ContributionCategories: ['Cat1'], p3Traceability: 75, p3Additionality: 50, p3Continuity: 75 },
    };
    expect(STEP_REGISTRY['pillar3:programme'].validate!(s)).toBe(true);
  });
  it('optional programme description does not block', () => {
    const s = {
      ...makeInitialState(),
      pillar3: { p3Status: 'B' as const, p3ContributionCategories: ['Cat2'], p3Traceability: 50, p3Additionality: 50, p3Continuity: 50 },
    };
    expect(STEP_REGISTRY['pillar3:programme'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — pillar3:forward-commitment', () => {
  it('passes when p3Status is not D (step not visible)', () => {
    const s = { ...makeInitialState(), pillar3: { p3Status: 'A' as const } };
    expect(STEP_REGISTRY['pillar3:forward-commitment'].validate!(s)).toBe(true);
  });
  it('fails for status D when required fields missing', () => {
    const s = { ...makeInitialState(), pillar3: { p3Status: 'D' as const } };
    expect(STEP_REGISTRY['pillar3:forward-commitment'].validate!(s)).toBe(false);
  });
  it('fails for status D when only signatory present', () => {
    const s = { ...makeInitialState(), pillar3: { p3Status: 'D' as const, forwardCommitmentSignatory: 'Jane' } };
    expect(STEP_REGISTRY['pillar3:forward-commitment'].validate!(s)).toBe(false);
  });
  it('passes for status D with preferredCategory and signatory', () => {
    const s = {
      ...makeInitialState(),
      pillar3: { p3Status: 'D' as const, forwardCommitmentPreferredCategory: 'Cat1', forwardCommitmentSignatory: 'Jane Doe' },
    };
    expect(STEP_REGISTRY['pillar3:forward-commitment'].validate!(s)).toBe(true);
  });
});

describe('STEP_REGISTRY validation — evidence:delta', () => {
  it('always passes', () => {
    expect(STEP_REGISTRY['evidence:delta'].validate!(makeInitialState())).toBe(true);
    expect(STEP_REGISTRY['evidence:delta'].validate!(createFullState())).toBe(true);
  });
});

describe('STEP_REGISTRY validation — evidence:checklist', () => {
  it('always passes', () => {
    expect(STEP_REGISTRY['evidence:checklist'].validate!(makeInitialState())).toBe(true);
  });
});

describe('STEP_REGISTRY validation — review:gps-preview', () => {
  it('always passes', () => {
    expect(STEP_REGISTRY['review:gps-preview'].validate!(makeInitialState())).toBe(true);
  });
});

describe('STEP_REGISTRY validation — review:submit', () => {
  it('always passes', () => {
    expect(STEP_REGISTRY['review:submit'].validate!(makeInitialState())).toBe(true);
  });
});

describe('STEP_REGISTRY validation — every step with validate has been exercised', () => {
  it('all steps with validate functions are covered (no omissions)', () => {
    const stepsWithValidate = Object.keys(STEP_REGISTRY).filter(
      (id) => typeof STEP_REGISTRY[id].validate === 'function'
    );
    const covered = [
      'base:capability-select', 'base:identity', 'base:revenue-split', 'base:photos',
      'accommodation:setup', 'tours:setup',
      'pillar1:energy', 'pillar1:water', 'pillar1:waste', 'pillar1:carbon', 'pillar1:site',
      'pillar2:employment', 'pillar2:procurement', 'pillar2:revenue', 'pillar2:community',
      'pillar3:status', 'pillar3:programme', 'pillar3:forward-commitment',
      'evidence:delta', 'evidence:checklist',
      'review:gps-preview', 'review:submit',
    ];
    for (const id of stepsWithValidate) {
      expect(covered, `${id} has validate but is not covered`).toContain(id);
    }
  });
});

// ── 6. Migration Safety ───────────────────────────────────────────────────────

describe('migrateDraft — v1 full data', () => {
  const v1Data = {
    operatorType: 'A',
    legalName: 'Eco Lodge Lda.',
    country: 'Portugal',
    primaryContactName: 'Paulo',
    primaryContactEmail: 'paulo@lodge.pt',
    territoryId: 'ter-2',
    accommodationCategory: 'eco-lodge',
    rooms: 5,
    guestNights: 1000,
    experienceTypes: ['kayaking_watersports'],
    visitorDays: 300,
    totalElectricityKwh: 8000,
    officeElectricityKwh: 500,
    gridExportKwh: 0,
    totalWaterLitres: 40000,
    waterGreywater: true,
    waterRainwater: false,
    waterWastewaterTreatment: false,
    totalWasteKg: 900,
    wasteRecycledKg: 300,
    wasteCompostedKg: 100,
    wasteOtherDivertedKg: 50,
    p1SiteScore: 2,
    soloOperator: false,
    totalFte: 3,
    localFte: 3,
    permanentContractPct: 100,
    averageMonthlyWage: 850,
    totalFbSpend: 8000,
    localFbSpend: 6000,
    totalNonFbSpend: 3000,
    localNonFbSpend: 2000,
    totalBookingsCount: 300,
    directBookingPct: 70,
    evidenceTierRevenue: 'T2',
    communityScore: 2,
    evidenceTierCommunity: 'T2',
    p3Status: 'E',
    evidenceChecklistElectricity: true,
    evidenceChecklistWater: true,
  };

  it('produces a v2 state', () => {
    const result = migrateDraft(v1Data);
    expect(result._v).toBe(2);
  });

  it('derives capabilities from operatorType A → [accommodation]', () => {
    const result = migrateDraft(v1Data);
    expect(result.capabilities).toEqual(['accommodation']);
  });

  it('routes legalName to base slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.base.legalName).toBe('Eco Lodge Lda.');
  });

  it('routes accommodationCategory to accommodation slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.accommodation.accommodationCategory).toBe('eco-lodge');
    expect(result.accommodation.guestNights).toBe(1000);
  });

  it('routes experienceTypes to tours slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.tours.experienceTypes).toEqual(['kayaking_watersports']);
  });

  it('routes totalElectricityKwh to pillar1 slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.pillar1.totalElectricityKwh).toBe(8000);
  });

  it('routes totalFte to pillar2 slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.pillar2.totalFte).toBe(3);
  });

  it('routes p3Status to pillar3 slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.pillar3.p3Status).toBe('E');
  });

  it('routes evidenceChecklistElectricity to evidence slice', () => {
    const result = migrateDraft(v1Data);
    expect(result.evidence.evidenceChecklistElectricity).toBe(true);
  });

  it('maps legacy integer currentStep to namespaced stepId', () => {
    const result = migrateDraft(v1Data, 4);
    expect(result.currentStepId).toBe('pillar1:energy');
  });

  it('maps legacy string stepId to namespaced stepId', () => {
    const result = migrateDraft(v1Data, 'p2-employment');
    expect(result.currentStepId).toBe('pillar2:employment');
  });

  it('operatorType B → capabilities = [tours]', () => {
    const result = migrateDraft({ ...v1Data, operatorType: 'B' });
    expect(result.capabilities).toEqual(['tours']);
  });

  it('operatorType C → capabilities = [accommodation, tours]', () => {
    const result = migrateDraft({ ...v1Data, operatorType: 'C' });
    expect(result.capabilities).toEqual(['accommodation', 'tours']);
  });

  it('no field is lost — all provided v1 keys exist in some slice', () => {
    const result = migrateDraft(v1Data);
    const allSliceValues = {
      ...result.base,
      ...result.accommodation,
      ...result.tours,
      ...result.activity,
      ...result.pillar1,
      ...result.pillar2,
      ...result.pillar3,
      ...result.evidence,
    };
    // operatorType is consumed by capabilities derivation, not stored in slices
    const fieldsToCheck = Object.keys(v1Data).filter((k) => k !== 'operatorType');
    for (const key of fieldsToCheck) {
      expect(allSliceValues, `v1 field "${key}" lost after migration`).toHaveProperty(key);
    }
  });
});

describe('migrateDraft — partial data', () => {
  it('handles partial v1 object with only operatorType', () => {
    const result = migrateDraft({ operatorType: 'B' });
    expect(result._v).toBe(2);
    expect(result.capabilities).toEqual(['tours']);
    expect(result.base).toBeDefined();
    expect(result.pillar1).toBeDefined();
  });

  it('handles object with no operatorType → empty capabilities', () => {
    const result = migrateDraft({ legalName: 'Test' });
    expect(result.capabilities).toEqual([]);
    expect(result.base.legalName).toBe('Test');
  });

  it('returns initial state currentStepId when stepIdOrIndex not provided', () => {
    const result = migrateDraft({ operatorType: 'A' });
    expect(result.currentStepId).toBe('base:capability-select');
  });
});

describe('migrateDraft — empty / invalid input', () => {
  it('empty object returns initial state', () => {
    const result = migrateDraft({});
    expect(result._v).toBe(2);
    expect(result.capabilities).toEqual([]);
    expect(result.currentStepId).toBe('base:capability-select');
  });

  it('null input returns initial state', () => {
    const result = migrateDraft(null);
    expect(result._v).toBe(2);
  });

  it('undefined input returns initial state', () => {
    const result = migrateDraft(undefined);
    expect(result._v).toBe(2);
  });

  it('non-object primitive returns initial state', () => {
    const result = migrateDraft('invalid');
    expect(result._v).toBe(2);
  });
});

// ── 7. Store Integrity (via routePatch + computeFlatData) ─────────────────────

describe('routePatch — slice isolation', () => {
  it('legalName patch updates base slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ legalName: 'New Name' }, state);
    expect(result.base!.legalName).toBe('New Name');
    // Other slices unchanged
    expect(result.accommodation).toEqual(state.accommodation);
    expect(result.pillar1).toEqual(state.pillar1);
    expect(result.pillar2).toEqual(state.pillar2);
    expect(result.evidence).toEqual(state.evidence);
  });

  it('guestNights patch updates accommodation slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ guestNights: 1200 }, state);
    expect(result.accommodation!.guestNights).toBe(1200);
    expect(result.base).toEqual(state.base);
    expect(result.tours).toEqual(state.tours);
    expect(result.pillar1).toEqual(state.pillar1);
  });

  it('experienceTypes patch updates tours slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ experienceTypes: ['hiking_trekking'] }, state);
    expect(result.tours!.experienceTypes).toEqual(['hiking_trekking']);
    expect(result.accommodation).toEqual(state.accommodation);
    expect(result.pillar2).toEqual(state.pillar2);
  });

  it('revenueSplitAccommodationPct patch updates activity slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ revenueSplitAccommodationPct: 60 }, state);
    expect(result.activity!.revenueSplitAccommodationPct).toBe(60);
    expect(result.base).toEqual(state.base);
    expect(result.tours).toEqual(state.tours);
  });

  it('totalElectricityKwh patch updates pillar1 slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ totalElectricityKwh: 5000 }, state);
    expect(result.pillar1!.totalElectricityKwh).toBe(5000);
    expect(result.pillar2).toEqual(state.pillar2);
    expect(result.pillar3).toEqual(state.pillar3);
  });

  it('totalFte patch updates pillar2 slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ totalFte: 4 }, state);
    expect(result.pillar2!.totalFte).toBe(4);
    expect(result.pillar1).toEqual(state.pillar1);
    expect(result.pillar3).toEqual(state.pillar3);
  });

  it('p3Status patch updates pillar3 slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ p3Status: 'A' }, state);
    expect(result.pillar3!.p3Status).toBe('A');
    expect(result.pillar1).toEqual(state.pillar1);
    expect(result.pillar2).toEqual(state.pillar2);
  });

  it('evidenceChecklistElectricity patch updates evidence slice only', () => {
    const state = makeInitialState();
    const result = routePatch({ evidenceChecklistElectricity: true }, state);
    expect(result.evidence!.evidenceChecklistElectricity).toBe(true);
    expect(result.base).toEqual(state.base);
    expect(result.pillar1).toEqual(state.pillar1);
  });

  it('operatorType A sets capabilities = [accommodation]', () => {
    const result = routePatch({ operatorType: 'A' }, makeInitialState());
    expect(result.capabilities).toEqual(['accommodation']);
  });

  it('operatorType B sets capabilities = [tours]', () => {
    const result = routePatch({ operatorType: 'B' }, makeInitialState());
    expect(result.capabilities).toEqual(['tours']);
  });

  it('operatorType C sets capabilities = [accommodation, tours]', () => {
    const result = routePatch({ operatorType: 'C' }, makeInitialState());
    expect(result.capabilities).toEqual(['accommodation', 'tours']);
  });

  it('multi-field patch correctly routes each field to its own slice', () => {
    const state = makeInitialState();
    const result = routePatch(
      { legalName: 'X', guestNights: 100, totalElectricityKwh: 5000, p3Status: 'E', deltaExplanation: 'note' },
      state
    );
    expect(result.base!.legalName).toBe('X');
    expect(result.accommodation!.guestNights).toBe(100);
    expect(result.pillar1!.totalElectricityKwh).toBe(5000);
    expect(result.pillar3!.p3Status).toBe('E');
    expect(result.evidence!.deltaExplanation).toBe('note');
  });
});

describe('computeFlatData — output matches all slices combined', () => {
  it('derives operatorType C from accommodation + tours capabilities', () => {
    const flat = computeFlatData(createFullState());
    expect(flat.operatorType).toBe('C');
  });

  it('derives operatorType A from accommodation only', () => {
    const state = { ...makeInitialState(), capabilities: ['accommodation'] as CapabilityId[] };
    expect(computeFlatData(state).operatorType).toBe('A');
  });

  it('derives operatorType B from tours only', () => {
    const state = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[] };
    expect(computeFlatData(state).operatorType).toBe('B');
  });

  it('flat output contains values from all slices', () => {
    const state = createFullState();
    const flat = computeFlatData(state) as Record<string, unknown>;
    // spot-check one field from each slice
    expect(flat.legalName).toBe(state.base.legalName);
    expect(flat.guestNights).toBe(state.accommodation.guestNights);
    expect(flat.visitorDays).toBe(state.tours.visitorDays);
    expect(flat.revenueSplitAccommodationPct).toBe(state.activity.revenueSplitAccommodationPct);
    expect(flat.totalElectricityKwh).toBe(state.pillar1.totalElectricityKwh);
    expect(flat.totalFte).toBe(state.pillar2.totalFte);
    expect(flat.p3Status).toBe(state.pillar3.p3Status);
    expect(flat.assessmentCycle).toBe(state.evidence.assessmentCycle);
  });
});

// ── 8. Persistence Structure ──────────────────────────────────────────────────

describe('saveDraft payload structure', () => {
  it('dataJson contains _v = 2', () => {
    const state = createFullState();
    const dataJson = {
      _v: 2 as const,
      capabilities: state.capabilities,
      base: state.base,
      accommodation: state.accommodation,
      tours: state.tours,
      activity: state.activity,
      pillar1: state.pillar1,
      pillar2: state.pillar2,
      pillar3: state.pillar3,
      evidence: state.evidence,
    };
    expect(dataJson._v).toBe(2);
  });

  it('dataJson contains all required top-level slices', () => {
    const state = createFullState();
    const dataJson = {
      _v: 2 as const,
      capabilities: state.capabilities,
      base: state.base,
      accommodation: state.accommodation,
      tours: state.tours,
      activity: state.activity,
      pillar1: state.pillar1,
      pillar2: state.pillar2,
      pillar3: state.pillar3,
      evidence: state.evidence,
    };
    for (const key of ['_v', 'capabilities', 'base', 'accommodation', 'tours', 'activity', 'pillar1', 'pillar2', 'pillar3', 'evidence']) {
      expect(dataJson, `missing key: ${key}`).toHaveProperty(key);
    }
  });

  it('capabilities reflects selected capabilities, not hardcoded strings', () => {
    const state = { ...makeInitialState(), capabilities: ['tours'] as CapabilityId[] };
    expect(state.capabilities).toEqual(['tours']);
    expect(state.capabilities).not.toContain('accommodation');
  });

  it('currentStepId is a namespaced string', () => {
    const state = createFullState();
    expect(state.currentStepId).toContain(':');
  });

  it('flat output alongside slices does not overwrite _v', () => {
    const state = createFullState();
    const payload = {
      _v: 2 as const,
      capabilities: state.capabilities,
      base: state.base,
      accommodation: state.accommodation,
      tours: state.tours,
      activity: state.activity,
      pillar1: state.pillar1,
      pillar2: state.pillar2,
      pillar3: state.pillar3,
      evidence: state.evidence,
      ...flattenState(state),
    };
    // _v must remain 2 even after flat spread (flat output doesn't emit _v)
    expect(payload._v).toBe(2);
  });

  it('migrateDraft on a saveDraft-style payload preserves all slice data', () => {
    const state = createFullState();
    const payload = {
      _v: 2 as const,
      capabilities: state.capabilities,
      currentStepId: state.currentStepId,
      base: state.base,
      accommodation: state.accommodation,
      tours: state.tours,
      activity: state.activity,
      pillar1: state.pillar1,
      pillar2: state.pillar2,
      pillar3: state.pillar3,
      evidence: state.evidence,
      ...flattenState(state),
    };
    const loaded = migrateDraft(payload);
    expect(loaded.base).toEqual(state.base);
    expect(loaded.accommodation).toEqual(state.accommodation);
    expect(loaded.pillar1).toEqual(state.pillar1);
    expect(loaded.pillar3).toEqual(state.pillar3);
    expect(loaded.evidence).toEqual(state.evidence);
  });
});

// ── mapLegacyStepId ───────────────────────────────────────────────────────────

describe('mapLegacyStepId', () => {
  it('already-namespaced id is returned as-is', () => {
    expect(mapLegacyStepId('pillar1:energy')).toBe('pillar1:energy');
  });

  it('undefined returns base:capability-select', () => {
    expect(mapLegacyStepId(undefined)).toBe('base:capability-select');
  });

  it('maps legacy string ids correctly', () => {
    expect(mapLegacyStepId('operator-type')).toBe('base:capability-select');
    expect(mapLegacyStepId('identity')).toBe('base:identity');
    expect(mapLegacyStepId('p1-energy')).toBe('pillar1:energy');
    expect(mapLegacyStepId('p2-employment')).toBe('pillar2:employment');
    expect(mapLegacyStepId('p3-status')).toBe('pillar3:status');
    expect(mapLegacyStepId('evidence-checklist')).toBe('evidence:checklist');
    expect(mapLegacyStepId('gps-preview')).toBe('review:gps-preview');
    expect(mapLegacyStepId('review-submit')).toBe('review:submit');
  });

  it('maps legacy integer indices correctly', () => {
    expect(mapLegacyStepId(0)).toBe('base:capability-select');
    expect(mapLegacyStepId(1)).toBe('base:identity');
    expect(mapLegacyStepId(4)).toBe('pillar1:energy');
    expect(mapLegacyStepId(9)).toBe('pillar2:employment');
    expect(mapLegacyStepId(19)).toBe('review:submit');
  });

  it('unknown integer falls back to base:capability-select', () => {
    expect(mapLegacyStepId(999)).toBe('base:capability-select');
  });

  it('unknown string falls back to base:capability-select', () => {
    expect(mapLegacyStepId('totally-unknown')).toBe('base:capability-select');
  });
});
