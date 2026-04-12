/**
 * ForwardCommitmentRecord Persistence Tests
 *
 * Verifies that when p3Status = "D", the orchestrator creates a complete
 * ForwardCommitmentRecord — not just operatorId + assessmentCycle.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";
import * as scoreRepo from "@/lib/db/repositories/score.repo";
import * as methodologyBundle from "@/lib/methodology/methodology-bundle.loader";
import * as auditLogger from "@/lib/audit/logger";
import * as assessmentSchema from "@/lib/validation/assessment.schema";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import { DEFAULT_METHODOLOGY_BUNDLE } from "@/lib/methodology/default-bundle";

// ── Hoisted prisma mock ───────────────────────────────────────────────────────

const { mockTx } = vi.hoisted(() => {
  const mockTx = {
    assessmentSnapshot: { create: vi.fn() },
    evidenceRef: { create: vi.fn(), count: vi.fn(), findMany: vi.fn() },
    scoreSnapshot: { create: vi.fn() },
    forwardCommitmentRecord: { create: vi.fn() },
    operator: { update: vi.fn() },
  };
  return { mockTx };
});

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    $transaction: vi.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
  },
}));

vi.mock("@/lib/db/repositories/dpi.repo");
vi.mock("@/lib/db/repositories/score.repo");
vi.mock("@/lib/methodology/methodology-bundle.loader");
vi.mock("@/lib/audit/logger");
vi.mock("@/lib/validation/assessment.schema");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_ASSESSMENT = {
  id: "assess-1",
  operatorId: "op-1",
  assessmentCycle: 1,
  createdAt: new Date(),
};

const MOCK_SCORE = {
  id: "score-1",
  gpsTotal: 55,
  gpsBand: "advancing",
  p1Score: 70,
  p2Score: 65,
  p3Score: 0,
  dpsTotal: null,
  dps1: null,
  dps2: null,
  dps3: null,
  dpsBand: null,
  dpiScore: 50,
  dpiPressureLevel: "moderate",
  dpiTerritoryId: "ter-1",
  referenceDpi: true,
  methodologyVersion: "1.0.0",
  isPublished: false,
  publicationBlockedReason: null,
};

const BASE_SNAPSHOT_INPUT = {
  operatorId: "op-1",
  operatorType: "A" as const,
  activityUnit: { guestNights: 1000 },
  assessmentCycle: 1,
  assessmentPeriodEnd: "2025-12-31",
  pillar1: {
    energyIntensity: 20,
    renewablePct: 50,
    waterIntensity: 100,
    recirculationScore: 1,
    wasteDiversionPct: 60,
    carbonIntensity: 10,
    siteScore: 2,
  },
  pillar2: {
    localEmploymentRate: 60,
    employmentQuality: 70,
    localFbRate: 50,
    localNonfbRate: 45,
    directBookingRate: 55,
    localOwnershipPct: 60,
    communityScore: 3,
  },
  pillar3: {
    categoryScope: null,
    traceability: null,
    additionality: null,
    continuity: null,
  },
  p3Status: "D" as const,
  delta: null,
  evidence: [],
};

describe("ForwardCommitmentRecord — Status D persistence", () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.mocked(assessmentSchema.validateTypeCRevenueSplit).mockReturnValue(null);
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(null);
    vi.mocked(scoreRepo.findCycle1ScoreByOperator).mockResolvedValue(null);
    vi.mocked(scoreRepo.findLatestScoreByOperator).mockResolvedValue(null);
    vi.mocked(methodologyBundle.loadActiveBundle).mockResolvedValue({
      bundle: DEFAULT_METHODOLOGY_BUNDLE as any,
      hash: "bundle-hash",
    });
    vi.mocked(auditLogger.logAuditEvent).mockResolvedValue(undefined as any);

    mockTx.assessmentSnapshot.create.mockResolvedValue(MOCK_ASSESSMENT);
    mockTx.evidenceRef.create.mockResolvedValue({});
    // T3 gate is skipped for status D — evidenceRef.count won't be called
    mockTx.evidenceRef.count.mockResolvedValue(0);
    // T1 coverage check — no T1 evidence → isPublished = false
    mockTx.evidenceRef.findMany.mockResolvedValue([]);
    mockTx.scoreSnapshot.create.mockResolvedValue(MOCK_SCORE);
    mockTx.forwardCommitmentRecord.create.mockResolvedValue({
      id: "fcr-1",
      operatorId: "op-1",
    });
    mockTx.operator.update.mockResolvedValue({});
  });

  it("creates ForwardCommitmentRecord with all provided fields (not just operatorId + assessmentCycle)", async () => {
    const input = {
      operatorId: "op-1",
      territoryId: "ter-1",
      actorUserId: "user-1",
      snapshotInput: BASE_SNAPSHOT_INPUT,
      rawSubmissionJson: {},
      forwardCommitment: {
        preferredCategory: "biodiversity",
        preferredInstitutionType: "NGO",
        targetActivationCycle: 2,
        authorisedSignatory: "Maria Silva",
        signedAt: "2026-03-01",
      },
    };

    await runScoring(input);

    expect(mockTx.forwardCommitmentRecord.create).toHaveBeenCalledOnce();
    const call = mockTx.forwardCommitmentRecord.create.mock.calls[0][0];

    expect(call.data.operator.connect.id).toBe("op-1");
    expect(call.data.assessmentCycle).toBe(1);
    expect(call.data.preferredCategory).toBe("biodiversity");
    expect(call.data.preferredInstitutionType).toBe("NGO");
    expect(call.data.targetActivationCycle).toBe(2);
    expect(call.data.authorisedSignatory).toBe("Maria Silva");
    expect(call.data.signedAt).toBeInstanceOf(Date);
    // territoryContext defaults to territoryId when not explicitly provided
    expect(call.data.territoryContext).toBe("ter-1");
  });

  it("uses explicit territoryContext when provided in forwardCommitment", async () => {
    const input = {
      operatorId: "op-1",
      territoryId: "ter-1",
      actorUserId: "user-1",
      snapshotInput: BASE_SNAPSHOT_INPUT,
      rawSubmissionJson: {},
      forwardCommitment: {
        preferredCategory: "water",
        territoryContext: "Douro Valley",
        authorisedSignatory: "João Costa",
      },
    };

    await runScoring(input);

    const call = mockTx.forwardCommitmentRecord.create.mock.calls[0][0];
    expect(call.data.territoryContext).toBe("Douro Valley");
  });

  it("record is NOT created when p3Status is not D", async () => {
    const input = {
      operatorId: "op-1",
      territoryId: "ter-1",
      actorUserId: "user-1",
      snapshotInput: { ...BASE_SNAPSHOT_INPUT, p3Status: "E" as const },
      rawSubmissionJson: {},
    };

    await runScoring(input);

    expect(mockTx.forwardCommitmentRecord.create).not.toHaveBeenCalled();
  });

  it("record is NOT created when p3Status is A", async () => {
    // T3 gate fires for status A — mock count = 0 so publicationBlockedReason is set
    mockTx.evidenceRef.count.mockResolvedValue(0);

    const input = {
      operatorId: "op-1",
      territoryId: "ter-1",
      actorUserId: "user-1",
      snapshotInput: {
        ...BASE_SNAPSHOT_INPUT,
        p3Status: "A" as const,
        pillar3: {
          categoryScope: 75,
          traceability: 75,
          additionality: 50,
          continuity: 75,
        },
      },
      rawSubmissionJson: {},
    };

    await runScoring(input);

    expect(mockTx.forwardCommitmentRecord.create).not.toHaveBeenCalled();
  });

  it("territoryContext defaults to territoryId when forwardCommitment has none", async () => {
    const input = {
      operatorId: "op-1",
      territoryId: "ter-default",
      actorUserId: "user-1",
      snapshotInput: BASE_SNAPSHOT_INPUT,
      rawSubmissionJson: {},
      forwardCommitment: {
        preferredCategory: "biodiversity",
      },
    };

    await runScoring(input);

    const call = mockTx.forwardCommitmentRecord.create.mock.calls[0][0];
    expect(call.data.territoryContext).toBe("ter-default");
  });
});
