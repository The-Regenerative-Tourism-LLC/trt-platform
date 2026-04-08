/**
 * Onboarding Persistence — Real Integration Tests
 *
 * Tests the full DB roundtrip using real Prisma calls (no mocks).
 * Requires DATABASE_URL pointing to a live database.
 *
 * Coverage (all gaps vs existing mocked/unit tests):
 *   1. Real roundtrip: state → upsertDraft → findDraft → migrateDraft → original slices
 *   2. DB record validation: _v === 2, all slices present after upsert
 *   3. Partial update safety: single-field change does not corrupt other slices
 *   4. Idempotency: saving same state twice yields one record, no corruption
 *   5. Capability change: capabilities update correctly, other data intact
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/db/prisma';
import {
  upsertDraft,
  findDraftByOperatorId,
} from '@/lib/db/repositories/onboarding-draft.repo';
import { migrateDraft } from '@/lib/onboarding/engine/draft-migration';
import { flattenState } from '@/lib/onboarding/engine/compat';
import type { OnboardingState, CapabilityId } from '@/lib/onboarding/types';

// ── Test operator ─────────────────────────────────────────────────────────────

let operatorId: string;

beforeAll(async () => {
  const op = await prisma.operator.create({
    data: { legalName: '__persistence_test_operator__' },
  });
  operatorId = op.id;
});

afterAll(async () => {
  // Cascade deletes the draft too
  await prisma.operator.delete({ where: { id: operatorId } });
  await prisma.$disconnect();
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

function buildFullState(): OnboardingState {
  return {
    _v: 2,
    capabilities: ['accommodation', 'tours'],
    currentStepId: 'pillar1:energy',
    base: {
      legalName: 'Quinta Persistence Lda.',
      tradingName: 'Persistence Lodge',
      country: 'Portugal',
      destinationRegion: 'Alentejo',
      territoryId: 'ter-persist-1',
      referenceDpi: false,
      yearOperationStart: 2018,
      website: 'https://persistence.pt',
      primaryContactName: 'Maria Test',
      primaryContactEmail: 'maria@persistence.pt',
      address: 'Rua da Persistência 42, Évora',
      latitude: 38.5,
      longitude: -9.2,
      pricePerNight: 95,
      ownershipType: 'sole-proprietor',
      localEquityPct: 100,
      isChainMember: false,
      soloOperator: false,
      ownerLivesLocally: true,
      assessmentPeriodEnd: '2024-12-31',
      photoRefs: [],
      _accomGateShown: false,
      _confirmsNoAccommodation: false,
      _accomGateWarn: false,
    },
    accommodation: {
      accommodationCategory: 'guesthouse',
      rooms: 6,
      bedCapacity: 12,
      guestNights: 1200,
    },
    tours: {
      experienceTypes: ['hiking_trekking'],
      visitorDays: 300,
      tourNoFixedBase: false,
      tourNoTransport: false,
    },
    activity: {
      revenueSplitAccommodationPct: 60,
      revenueSplitExperiencePct: 40,
    },
    pillar1: {
      totalElectricityKwh: 12000,
      renewableOnsitePct: 50,
      totalWaterLitres: 400000,
      wasteRecycledKg: 120,
    },
    pillar2: {
      totalFte: 5,
      localFte: 4,
      averageMonthlyWage: 1200,
    },
    pillar3: {
      p3Status: 'B',
    },
    evidence: {
      assessmentCycle: 1,
      deltaExplanation: '',
    },
  };
}

/** Builds the dataJson payload exactly as saveDraft() does in the store. */
function buildDataJson(state: OnboardingState): Record<string, unknown> {
  return {
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
}

// ── 1. Real roundtrip ─────────────────────────────────────────────────────────

describe('real roundtrip: state → upsertDraft → findDraft → migrateDraft', () => {
  it('restores all slices with deep equality after DB roundtrip', async () => {
    const original = buildFullState();
    const dataJson = buildDataJson(original);

    await upsertDraft(operatorId, 4, dataJson);

    const record = await findDraftByOperatorId(operatorId);
    expect(record).not.toBeNull();

    const loaded = migrateDraft(record!.dataJson, record!.currentStep);

    expect(loaded.base).toEqual(original.base);
    expect(loaded.accommodation).toEqual(original.accommodation);
    expect(loaded.tours).toEqual(original.tours);
    expect(loaded.activity).toEqual(original.activity);
    expect(loaded.pillar1).toEqual(original.pillar1);
    expect(loaded.pillar2).toEqual(original.pillar2);
    expect(loaded.pillar3).toEqual(original.pillar3);
    expect(loaded.evidence).toEqual(original.evidence);
    expect(loaded.capabilities).toEqual(original.capabilities);
  });
});

// ── 2. DB record validation ───────────────────────────────────────────────────

describe('database record validation after upsertDraft', () => {
  it('raw record has _v === 2', async () => {
    const state = buildFullState();
    await upsertDraft(operatorId, 3, buildDataJson(state));

    const record = await findDraftByOperatorId(operatorId);
    const raw = record!.dataJson as Record<string, unknown>;

    expect(raw._v).toBe(2);
  });

  it('raw record contains all required slices', async () => {
    const state = buildFullState();
    await upsertDraft(operatorId, 3, buildDataJson(state));

    const record = await findDraftByOperatorId(operatorId);
    const raw = record!.dataJson as Record<string, unknown>;

    for (const key of ['base', 'accommodation', 'tours', 'activity', 'pillar1', 'pillar2', 'pillar3', 'evidence']) {
      expect(raw, `missing slice: ${key}`).toHaveProperty(key);
    }
  });

  it('raw record capabilities matches what was saved', async () => {
    const state = buildFullState();
    await upsertDraft(operatorId, 3, buildDataJson(state));

    const record = await findDraftByOperatorId(operatorId);
    const raw = record!.dataJson as Record<string, unknown>;

    expect(raw.capabilities).toEqual(['accommodation', 'tours']);
  });
});

// ── 3. Partial update safety ──────────────────────────────────────────────────

describe('partial update safety', () => {
  it('updating one field does not corrupt other slices', async () => {
    const state = buildFullState();
    await upsertDraft(operatorId, 3, buildDataJson(state));

    // Update only guestNights in accommodation
    const updated: OnboardingState = {
      ...state,
      accommodation: { ...state.accommodation, guestNights: 9999 },
    };
    await upsertDraft(operatorId, 3, buildDataJson(updated));

    const record = await findDraftByOperatorId(operatorId);
    const loaded = migrateDraft(record!.dataJson, record!.currentStep);

    expect(loaded.accommodation.guestNights).toBe(9999);

    // All other slices unchanged
    expect(loaded.base).toEqual(state.base);
    expect(loaded.tours).toEqual(state.tours);
    expect(loaded.activity).toEqual(state.activity);
    expect(loaded.pillar1).toEqual(state.pillar1);
    expect(loaded.pillar2).toEqual(state.pillar2);
    expect(loaded.pillar3).toEqual(state.pillar3);
    expect(loaded.evidence).toEqual(state.evidence);
  });
});

// ── 4. Idempotency ────────────────────────────────────────────────────────────

describe('idempotency', () => {
  it('saving same state twice yields exactly one record without corruption', async () => {
    const state = buildFullState();
    const dataJson = buildDataJson(state);

    await upsertDraft(operatorId, 5, dataJson);
    await upsertDraft(operatorId, 5, dataJson);

    const record = await findDraftByOperatorId(operatorId);
    expect(record).not.toBeNull();

    // Exactly one row (unique constraint on operatorId)
    const count = await prisma.onboardingDraft.count({ where: { operatorId } });
    expect(count).toBe(1);

    const loaded = migrateDraft(record!.dataJson, record!.currentStep);
    expect(loaded.base).toEqual(state.base);
    expect(loaded.capabilities).toEqual(state.capabilities);
  });
});

// ── 5. Capability change ──────────────────────────────────────────────────────

describe('capability change', () => {
  it('saves with accommodation only, updates to tours only, loads correctly', async () => {
    const accomState: OnboardingState = {
      ...buildFullState(),
      capabilities: ['accommodation'] as CapabilityId[],
    };
    await upsertDraft(operatorId, 1, buildDataJson(accomState));

    const toursState: OnboardingState = {
      ...buildFullState(),
      capabilities: ['tours'] as CapabilityId[],
    };
    await upsertDraft(operatorId, 1, buildDataJson(toursState));

    const record = await findDraftByOperatorId(operatorId);
    const loaded = migrateDraft(record!.dataJson, record!.currentStep);

    expect(loaded.capabilities).toEqual(['tours']);
    expect(loaded.capabilities).not.toContain('accommodation');

    // Other data intact
    expect(loaded.base.legalName).toBe(buildFullState().base.legalName);
    expect(loaded.pillar1).toEqual(buildFullState().pillar1);
    expect(loaded.pillar2).toEqual(buildFullState().pillar2);
  });
});

// ── 6. Full object equality ───────────────────────────────────────────────────

/**
 * Pure-slice dataJson (no flattenState) so migrateDraft returns a state that
 * structurally matches the original OnboardingState exactly.
 * Fails if ANY field is missing, renamed, or added unexpectedly.
 */
function buildPureDataJson(state: OnboardingState): Record<string, unknown> {
  return {
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
  };
}

describe('full object equality: expect(loaded).toEqual(original)', () => {
  it('loaded state equals original state in every field', async () => {
    const original = buildFullState();
    // currentStep 4 → mapLegacyStepId(4) === 'pillar1:energy' === original.currentStepId
    await upsertDraft(operatorId, 4, buildPureDataJson(original));

    const record = await findDraftByOperatorId(operatorId);
    const loaded = migrateDraft(record!.dataJson, record!.currentStep);

    expect(loaded).toEqual(original);
  });
});

// ── 7. Bypass flattenState (anti-false-positive) ──────────────────────────────

/**
 * flattenState() spreads every slice field to the top level of dataJson.
 * When migrateDraft reads that back for v2, it spreads everything into the
 * returned state — potentially masking bugs where a slice field is silently
 * clobbered or duplicated. This test bypasses flattenState entirely and
 * stores currentStepId inside the payload so migrateDraft can recover it
 * without the step-index mapping path.
 */
describe('bypass flattenState: structured slices only, full equality', () => {
  it('pure-slice roundtrip without flattenState preserves all state fields', async () => {
    const original = buildFullState();
    const pureJson = buildPureDataJson(original);

    await upsertDraft(operatorId, 4, pureJson);

    const record = await findDraftByOperatorId(operatorId);
    // Call migrateDraft WITHOUT passing step index — currentStepId must come
    // from the stored payload itself (tests the else branch of migrateDraft).
    const loaded = migrateDraft(record!.dataJson);

    expect(loaded).toEqual(original);
  });
});

// ── 8. Corrupted data safety ──────────────────────────────────────────────────

describe('corrupted data safety: migrateDraft does not throw on bad DB state', () => {
  it('handles missing slices without throwing and returns valid OnboardingState', async () => {
    const state = buildFullState();
    await upsertDraft(operatorId, 0, buildPureDataJson(state));

    // Manually corrupt the stored record — only partial/unknown data
    await prisma.onboardingDraft.update({
      where: { operatorId },
      data: { dataJson: { random_key: 'garbage', nested: { x: 1 } } as Record<string, unknown> },
    });

    const record = await findDraftByOperatorId(operatorId);
    let loaded: ReturnType<typeof migrateDraft> | undefined;
    expect(() => { loaded = migrateDraft(record!.dataJson, record!.currentStep); }).not.toThrow();

    expect(loaded!._v).toBe(2);
    for (const key of ['base', 'accommodation', 'tours', 'activity', 'pillar1', 'pillar2', 'pillar3', 'evidence']) {
      expect(loaded!, `missing slice after corrupt load: ${key}`).toHaveProperty(key);
    }
  });

  it('handles empty object dataJson without throwing', async () => {
    await prisma.onboardingDraft.update({
      where: { operatorId },
      data: { dataJson: {} },
    });

    const record = await findDraftByOperatorId(operatorId);
    let loaded: ReturnType<typeof migrateDraft> | undefined;
    expect(() => { loaded = migrateDraft(record!.dataJson, record!.currentStep); }).not.toThrow();
    expect(loaded!._v).toBe(2);
  });

  it('handles partial v2 object (some slices missing) without throwing', async () => {
    // v2 data with only capabilities — migrateDraft returns it as-is (no slice population)
    await prisma.onboardingDraft.update({
      where: { operatorId },
      data: { dataJson: { _v: 2, capabilities: ['accommodation'] } as Record<string, unknown> },
    });

    const record = await findDraftByOperatorId(operatorId);
    let loaded: ReturnType<typeof migrateDraft> | undefined;
    expect(() => { loaded = migrateDraft(record!.dataJson, record!.currentStep); }).not.toThrow();
    // v2 is returned as-is; _v and capabilities are preserved
    expect(loaded!._v).toBe(2);
    expect(loaded!.capabilities).toEqual(['accommodation']);
  });
});

// ── 9. Concurrency safety (race condition) ────────────────────────────────────

describe('concurrency safety: concurrent upserts resolve to one valid record', () => {
  it('two concurrent writes leave exactly one valid record', async () => {
    const stateA: OnboardingState = {
      ...buildFullState(),
      base: { ...buildFullState().base, legalName: 'Concurrent A Lda.' },
    };
    const stateB: OnboardingState = {
      ...buildFullState(),
      base: { ...buildFullState().base, legalName: 'Concurrent B Lda.' },
    };

    await Promise.all([
      upsertDraft(operatorId, 2, buildPureDataJson(stateA)),
      upsertDraft(operatorId, 7, buildPureDataJson(stateB)),
    ]);

    // Exactly one row (unique constraint on operatorId)
    const count = await prisma.onboardingDraft.count({ where: { operatorId } });
    expect(count).toBe(1);

    // Record is not corrupted
    const record = await findDraftByOperatorId(operatorId);
    expect(record).not.toBeNull();

    const raw = record!.dataJson as Record<string, unknown>;
    expect(raw._v).toBe(2);

    // migrateDraft works on whatever won the race
    let loaded: ReturnType<typeof migrateDraft> | undefined;
    expect(() => { loaded = migrateDraft(record!.dataJson, record!.currentStep); }).not.toThrow();
    expect(loaded!._v).toBe(2);
    expect(loaded!).toHaveProperty('base');
    expect(loaded!).toHaveProperty('capabilities');
  });
});
