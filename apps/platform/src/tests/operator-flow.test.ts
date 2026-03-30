/**
 * Operator Flow — End-to-End Integration Test
 *
 * Tests the full operator lifecycle using the real Prisma client and the
 * real scoring orchestrator. No mocks are used — this exercises all layers:
 * repository → orchestrator → engine → database.
 *
 * Skipped automatically when DATABASE_URL is not set (CI without DB).
 *
 * Test data is tagged with a unique TEST_ID and deleted in afterAll.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { upsertDraft, findDraftByOperatorId } from "@/lib/db/repositories/onboarding-draft.repo";
import {
  findLatestScoreByOperator,
  findPreviousScoreByOperator,
} from "@/lib/db/repositories/score.repo";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import { computeP1Intensities } from "@/lib/computation/p1-derive";
import { computeP2Rates } from "@/lib/computation/p2-derive";

// ── Skip guard ────────────────────────────────────────────────────────────────

const DB_AVAILABLE = !!process.env.DATABASE_URL;
const describeFlow = DB_AVAILABLE ? describe : describe.skip;

// ── Test state ────────────────────────────────────────────────────────────────

const TEST_ID = `e2e-${Date.now()}`;

let userId: string;
let operatorId: string;
let territoryId: string;

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a ScoringInput using real derivation functions — mirrors what
 * POST /api/v1/score does server-side.
 */
function buildScoringInput(overrides: { assessmentCycle?: number; delta?: any; evidence?: any[] } = {}) {
  const rawP1 = {
    operatorType: "A" as const,
    guestNights: 1000,
    totalElectricityKwh: 10000,
    totalWaterLitres: 50000,
    totalWasteKg: 1000,
    wasteRecycledKg: 200,
  };

  const rawP2 = {
    soloOperator: true,
    tourNoFbSpend: true,
    tourNoNonFbSpend: true,
    directBookingPct: 60,
    localOwnershipPct: 100,
    communityScore: 3,
  };

  const derivedP1 = computeP1Intensities(rawP1);
  const derivedP2 = computeP2Rates(rawP2);

  return {
    operatorId,
    territoryId,
    actorUserId: userId,
    snapshotInput: {
      operatorId,
      operatorType: "A" as const,
      activityUnit: { guestNights: 1000 },
      assessmentCycle: overrides.assessmentCycle ?? 1,
      assessmentPeriodEnd: "2024-12-31",
      pillar1: {
        energyIntensity: derivedP1.energyIntensity,
        renewablePct: derivedP1.renewablePct,
        waterIntensity: derivedP1.waterIntensity,
        recirculationScore: 1,
        wasteDiversionPct: derivedP1.wasteDiversionPct,
        carbonIntensity: derivedP1.carbonIntensity,
        siteScore: 2,
      },
      pillar2: {
        localEmploymentRate: derivedP2.localEmploymentRate,
        employmentQuality: derivedP2.employmentQuality,
        localFbRate: derivedP2.localFbRate,
        localNonfbRate: derivedP2.localNonFbRate,
        directBookingRate: derivedP2.directBookingRate,
        localOwnershipPct: derivedP2.localOwnershipPct,
        communityScore: derivedP2.communityScore,
      },
      pillar3: {
        categoryScope: null,
        traceability: null,
        additionality: null,
        continuity: null,
      },
      p3Status: "E" as const,
      delta: overrides.delta ?? null,
      evidence: overrides.evidence ?? [],
    },
  };
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  if (!DB_AVAILABLE) return;

  // 1. Territory (no FK dependencies)
  const territory = await prisma.territory.create({
    data: {
      name: `Test Territory ${TEST_ID}`,
      slug: `test-territory-${TEST_ID}`,
      country: "Portugal",
      countryCode: "PRT",
      isAvailable: false,
      displayOrder: 999,
    },
  });
  territoryId = territory.id;

  // 2. User
  const user = await prisma.user.create({
    data: {
      email: `${TEST_ID}@test.local`,
      name: "E2E Test Operator",
    },
  });
  userId = user.id;

  // 3. Operator (linked to user + territory)
  const operator = await prisma.operator.create({
    data: {
      userId,
      legalName: `E2E Operator ${TEST_ID}`,
      tradingName: "E2E Test Stay",
      country: "Portugal",
      destinationRegion: "Test Region",
      territoryId,
      operatorType: "A",
      operatorCode: `E2E-${TEST_ID}`,
      yearOperationStart: 2020,
      rooms: 8,
      bedCapacity: 16,
      ownershipType: "family",
      localEquityPct: 100,
      primaryContactName: "E2E Contact",
      primaryContactEmail: `${TEST_ID}@test.local`,
      experienceTypes: [],
      photos: [],
      amenities: [],
    },
  });
  operatorId = operator.id;
});

afterAll(async () => {
  if (!DB_AVAILABLE) return;

  try {
    await prisma.auditLog.deleteMany({ where: { entityId: { startsWith: operatorId } } });
    await prisma.scoreSnapshot.deleteMany({ where: { operatorId } });
    await prisma.evidenceRef.deleteMany({ where: { operatorId } });
    await prisma.assessmentSnapshot.deleteMany({ where: { operatorId } });
    await prisma.onboardingDraft.deleteMany({ where: { operatorId } });
    await prisma.forwardCommitmentRecord.deleteMany({ where: { operatorId } });
    await prisma.operator.deleteMany({ where: { id: operatorId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.territory.deleteMany({ where: { id: territoryId } });
  } catch (err) {
    console.error("[e2e cleanup error]", err);
  } finally {
    await prisma.$disconnect();
  }
});

// ── Flow tests ────────────────────────────────────────────────────────────────

describeFlow("Operator full lifecycle — E2E", () => {
  it("saves and retrieves an onboarding draft", async () => {
    const draftData = { operatorType: "A", legalName: `E2E Operator ${TEST_ID}` };

    await upsertDraft(operatorId, 3, draftData);

    const loaded = await findDraftByOperatorId(operatorId);
    expect(loaded).not.toBeNull();
    expect(loaded!.currentStep).toBe(3);
    expect(loaded!.dataJson).toMatchObject(draftData);
  });

  it("updates draft data on second save (idempotent upsert)", async () => {
    const updatedData = { operatorType: "A", legalName: "Updated Name", country: "Portugal" };
    await upsertDraft(operatorId, 5, updatedData);

    const loaded = await findDraftByOperatorId(operatorId);
    expect(loaded!.currentStep).toBe(5);
    expect(loaded!.dataJson).toMatchObject({ legalName: "Updated Name" });
  });

  it("Cycle 1: runScoring creates a ScoreSnapshot and returns GPS score", async () => {
    const result = await runScoring(
      buildScoringInput({
        assessmentCycle: 1,
        evidence: [
          { indicatorId: "energy_kwh", tier: "T1" as const, checksum: "sha256-abc" },
          { indicatorId: "p2_local_spend", tier: "Proxy" as const, proxyMethod: "industry_avg", proxyCorrectionFactor: 0.9 },
        ],
      })
    );

    expect(result.scoreSnapshotId).toBeTruthy();
    expect(result.gpsTotal).toBeTypeOf("number");
    expect(result.gpsTotal).toBeGreaterThanOrEqual(0);
    expect(result.gpsTotal).toBeLessThanOrEqual(100);
    expect(result.p1Score).toBeTypeOf("number");
    expect(result.p2Score).toBeTypeOf("number");
    expect(result.p3Score).toBe(0); // Status E, no programme
    expect(result.methodologyVersion).toBeTruthy();
  });

  it("Cycle 1: EvidenceRef records persisted with correct tier and proxy metadata", async () => {
    const refs = await prisma.evidenceRef.findMany({
      where: { operatorId },
      orderBy: { submittedAt: "asc" },
    });
    expect(refs).toHaveLength(2);

    const t1 = refs.find((r) => r.tier === "T1");
    expect(t1).toBeDefined();
    expect(t1!.indicatorId).toBe("energy_kwh");
    expect(t1!.checksum).toBe("sha256-abc");
    expect(t1!.verificationState).toBe("pending");

    const proxy = refs.find((r) => r.tier === "Proxy");
    expect(proxy).toBeDefined();
    expect(proxy!.proxyMethod).toBe("industry_avg");
    expect(Number(proxy!.proxyCorrectionFactor)).toBeCloseTo(0.9);
  });

  it("Cycle 1: ScoreSnapshot persisted in database", async () => {
    const score = await findLatestScoreByOperator(operatorId);
    expect(score).not.toBeNull();
    expect(score!.operatorId).toBe(operatorId);
    expect(Number(score!.gpsTotal)).toBeGreaterThanOrEqual(0);
    expect(score!.isPublished).toBe(false);
  });

  it("Cycle 1: assessmentCycleCount incremented to 1", async () => {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    expect(operator!.assessmentCycleCount).toBe(1);
  });

  it("Cycle 1: previousScore is null (only one cycle completed)", async () => {
    const prev = await findPreviousScoreByOperator(operatorId);
    expect(prev).toBeNull();
  });

  it("Cycle 2: runScoring creates a second ScoreSnapshot", async () => {
    const cycle1Score = await findLatestScoreByOperator(operatorId);

    const delta = {
      priorCycle: 1,
      baselineScores: {
        p1Score: Number(cycle1Score!.p1Score),
        p2Score: Number(cycle1Score!.p2Score),
        p3Score: Number(cycle1Score!.p3Score),
        gpsTotal: Number(cycle1Score!.gpsTotal),
      },
      priorScores: {
        p1Score: Number(cycle1Score!.p1Score),
        p2Score: Number(cycle1Score!.p2Score),
        p3Score: Number(cycle1Score!.p3Score),
        gpsTotal: Number(cycle1Score!.gpsTotal),
      },
      currentScores: {},
    };

    const result = await runScoring(buildScoringInput({ assessmentCycle: 2, delta }));

    expect(result.scoreSnapshotId).toBeTruthy();
    expect(result.scoreSnapshotId).not.toBe(cycle1Score!.id);
    expect(result.gpsTotal).toBeTypeOf("number");
  });

  it("Cycle 2: latestScore is Cycle 2 and previousScore is Cycle 1", async () => {
    const latest = await findLatestScoreByOperator(operatorId);
    const previous = await findPreviousScoreByOperator(operatorId);

    expect(latest).not.toBeNull();
    expect(previous).not.toBeNull();

    // Latest is more recent than previous
    expect(latest!.computedAt.getTime()).toBeGreaterThan(previous!.computedAt.getTime());
  });

  it("Cycle 2: assessmentCycleCount incremented to 2", async () => {
    const operator = await prisma.operator.findUnique({ where: { id: operatorId } });
    expect(operator!.assessmentCycleCount).toBe(2);
  });

  it("two distinct ScoreSnapshots exist in the database for this operator", async () => {
    const allScores = await prisma.scoreSnapshot.findMany({
      where: { operatorId },
      orderBy: { computedAt: "asc" },
    });
    expect(allScores).toHaveLength(2);
    expect(allScores[0].id).not.toBe(allScores[1].id);
  });
});
