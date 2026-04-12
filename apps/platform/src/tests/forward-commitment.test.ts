/**
 * ForwardCommitmentRecord Persistence Tests
 *
 * Verifies that when p3Status = "D", the orchestrator creates a complete
 * ForwardCommitmentRecord — not just operatorId + assessmentCycle.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import * as forwardCommitmentRepo from "@/lib/db/repositories/forward-commitment.repo";
import * as assessmentRepo from "@/lib/db/repositories/assessment.repo";
import * as scoreRepo from "@/lib/db/repositories/score.repo";
import * as evidenceRepo from "@/lib/db/repositories/evidence.repo";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";
import * as methodologyBundle from "@/lib/methodology/methodology-bundle.loader";
import * as auditLogger from "@/lib/audit/logger";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import { DEFAULT_METHODOLOGY_BUNDLE } from "@/lib/methodology/default-bundle";

vi.mock("@/lib/db/repositories/forward-commitment.repo");
vi.mock("@/lib/db/repositories/assessment.repo");
vi.mock("@/lib/db/repositories/score.repo");
vi.mock("@/lib/db/repositories/evidence.repo");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/db/repositories/dpi.repo");
vi.mock("@/lib/methodology/methodology-bundle.loader");
vi.mock("@/lib/audit/logger");

const MOCK_ASSESSMENT = {
  id: "assess-1",
  operatorId: "op-1",
  assessmentCycle: 1,
  createdAt: new Date(),
};

const MOCK_SCORE = {
  id: "score-1",
  gpsTotal: { toFixed: () => "55" },
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
  methodologyVersion: "1.0.0",
  isPublished: false,
  publicationBlockedReason: null,
};

const MOCK_FCR = {
  id: "fcr-1",
  operatorId: "op-1",
  assessmentCycle: 1,
  preferredCategory: "biodiversity",
  territoryContext: "ter-1",
  preferredInstitutionType: "NGO",
  targetActivationCycle: 2,
  authorisedSignatory: "Maria Silva",
  signedAt: new Date("2026-03-01"),
  status: "pending",
  createdAt: new Date(),
  matchedInstitution: null,
  activatedAt: null,
  lapsedAt: null,
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

    vi.mocked(assessmentRepo.createAssessmentSnapshot).mockResolvedValue(
      MOCK_ASSESSMENT as any
    );
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue(
      MOCK_SCORE as any
    );
    vi.mocked(scoreRepo.findCycle1ScoreByOperator).mockResolvedValue(null);
    vi.mocked(scoreRepo.findLatestScoreByOperator).mockResolvedValue(null);
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(null as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: false,
      p2: false,
      p3: false,
    });
    vi.mocked(operatorRepo.incrementAssessmentCycle).mockResolvedValue({} as any);
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);
    vi.mocked(methodologyBundle.loadActiveBundle).mockResolvedValue({
      bundle: DEFAULT_METHODOLOGY_BUNDLE as any,
      hash: "bundle-hash",
    });
    vi.mocked(auditLogger.logAuditEvent).mockResolvedValue(undefined as any);
    vi.mocked(forwardCommitmentRepo.createForwardCommitmentRecord).mockResolvedValue(
      MOCK_FCR as any
    );
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

    expect(forwardCommitmentRepo.createForwardCommitmentRecord).toHaveBeenCalledOnce();
    const call = vi.mocked(
      forwardCommitmentRepo.createForwardCommitmentRecord
    ).mock.calls[0][0];

    expect(call.operatorId).toBe("op-1");
    expect(call.assessmentCycle).toBe(1);
    expect(call.preferredCategory).toBe("biodiversity");
    expect(call.preferredInstitutionType).toBe("NGO");
    expect(call.targetActivationCycle).toBe(2);
    expect(call.authorisedSignatory).toBe("Maria Silva");
    expect(call.signedAt).toBeInstanceOf(Date);
    // territoryContext defaults to territoryId when not explicitly provided
    expect(call.territoryContext).toBe("ter-1");
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

    const call = vi.mocked(
      forwardCommitmentRepo.createForwardCommitmentRecord
    ).mock.calls[0][0];
    expect(call.territoryContext).toBe("Douro Valley");
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

    expect(forwardCommitmentRepo.createForwardCommitmentRecord).not.toHaveBeenCalled();
  });

  it("record is NOT created when p3Status is A", async () => {
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

    expect(forwardCommitmentRepo.createForwardCommitmentRecord).not.toHaveBeenCalled();
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

    const call = vi.mocked(
      forwardCommitmentRepo.createForwardCommitmentRecord
    ).mock.calls[0][0];
    expect(call.territoryContext).toBe("ter-default");
  });
});
