/**
 * Publication Logic Tests
 *
 * Tests for ScoreSnapshot publication eligibility in the scoring orchestrator.
 *
 * Rules under test:
 *   - isPublished = true  when T1 evidence exists for all three pillars
 *   - isPublished = false with "Insufficient Tier 1 evidence coverage" when any pillar is missing T1
 *   - publicationBlockedReason is stored correctly in both cases
 *
 * The orchestrator and all DB repositories are mocked; the scoring engine
 * is real to ensure scoring math is not affected.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { runScoring } from "@/lib/orchestration/scoring-orchestrator";
import * as assessmentRepo from "@/lib/db/repositories/assessment.repo";
import * as scoreRepo from "@/lib/db/repositories/score.repo";
import * as evidenceRepo from "@/lib/db/repositories/evidence.repo";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as forwardCommitmentRepo from "@/lib/db/repositories/forward-commitment.repo";
import * as auditLogger from "@/lib/audit/logger";
import * as methodologyLoader from "@/lib/methodology/methodology-bundle.loader";
import * as assessmentSchema from "@/lib/validation/assessment.schema";
import { DEFAULT_METHODOLOGY_BUNDLE } from "@/lib/methodology/default-bundle";
import type { ScoringInput } from "@/lib/orchestration/scoring-orchestrator";

vi.mock("@/lib/db/repositories/assessment.repo");
vi.mock("@/lib/db/repositories/score.repo");
vi.mock("@/lib/db/repositories/evidence.repo");
vi.mock("@/lib/db/repositories/dpi.repo");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/db/repositories/forward-commitment.repo");
vi.mock("@/lib/audit/logger");
vi.mock("@/lib/methodology/methodology-bundle.loader");
vi.mock("@/lib/validation/assessment.schema");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ASSESSMENT_SNAPSHOT_ID = "snap-pub-test";

const MOCK_ASSESSMENT = { id: ASSESSMENT_SNAPSHOT_ID } as any;

const MOCK_SCORE_BASE = {
  id: "score-pub-test",
  methodologyVersion: "1.0.0",
  p1Score: { toNumber: () => 60 },
  p2Score: { toNumber: () => 55 },
  p3Score: { toNumber: () => 0 },
  gpsTotal: { toNumber: () => 50 },
  gpsBand: "developing",
  dpsTotal: null,
  dps1: null,
  dps2: null,
  dps3: null,
  dpsBand: null,
  dpiScore: null,
  dpiPressureLevel: null,
  isPublished: false,
  publicationBlockedReason: null,
} as any;

/** Minimal Cycle 1 scoring input for a Type A operator */
function baseScoringInput(evidence: ScoringInput["snapshotInput"]["evidence"] = []): ScoringInput {
  return {
    operatorId: "op-pub-1",
    territoryId: "ter-pub-1",
    actorUserId: "user-pub-1",
    snapshotInput: {
      operatorId: "op-pub-1",
      operatorType: "A",
      activityUnit: { guestNights: 1000 },
      assessmentCycle: 1,
      assessmentPeriodEnd: "2024-12-31",
      pillar1: {
        energyIntensity: 40,
        renewablePct: 30,
        waterIntensity: 200,
        recirculationScore: 1,
        wasteDiversionPct: 30,
        carbonIntensity: 20,
        siteScore: 2,
      },
      pillar2: {
        localEmploymentRate: 50,
        employmentQuality: 60,
        localFbRate: 40,
        localNonfbRate: 30,
        directBookingRate: 50,
        localOwnershipPct: 60,
        communityScore: 3,
      },
      pillar3: {
        categoryScope: 50,
        traceability: 50,
        additionality: 25,
        continuity: 25,
      },
      p3Status: "A",
      delta: null,
      evidence,
    },
  };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();

  vi.mocked(assessmentSchema.validateTypeCRevenueSplit).mockReturnValue(null);
  vi.mocked(assessmentRepo.createAssessmentSnapshot).mockResolvedValue(MOCK_ASSESSMENT);
  vi.mocked(evidenceRepo.createEvidenceRef).mockResolvedValue({} as any);
  vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);
  vi.mocked(methodologyLoader.loadActiveBundle).mockResolvedValue({
    bundle: DEFAULT_METHODOLOGY_BUNDLE as any,
    hash: "bundle-hash",
  });
  vi.mocked(scoreRepo.findCycle1ScoreByOperator).mockResolvedValue(null);
  vi.mocked(scoreRepo.findLatestScoreByOperator).mockResolvedValue(null);
  vi.mocked(operatorRepo.incrementAssessmentCycle).mockResolvedValue({} as any);
  vi.mocked(forwardCommitmentRepo.createForwardCommitmentRecord).mockResolvedValue({} as any);
  vi.mocked(auditLogger.logAuditEvent).mockResolvedValue(undefined as any);

  // Default: T3 gate passes (verified T3 evidence exists)
  vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(true);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("ScoreSnapshot publication logic", () => {
  it("publishes score when T1 evidence exists for all three pillars", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true,
      p2: true,
      p3: true,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: true,
      publicationBlockedReason: null,
    });

    const result = await runScoring(baseScoringInput([
      { indicatorId: "p1_energy_intensity", tier: "T1" },
      { indicatorId: "p2_local_employment", tier: "T1" },
      { indicatorId: "p3_budget", tier: "T1" },
    ]));

    expect(result.isPublished).toBe(true);
    expect(result.publicationBlockedReason).toBeNull();

    const scoreCall = vi.mocked(scoreRepo.createScoreSnapshot).mock.calls[0][0];
    expect(scoreCall.isPublished).toBe(true);
    expect(scoreCall.publicationBlockedReason).toBeNull();
  });

  it("blocks publication when P1 T1 evidence is missing", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: false,
      p2: true,
      p3: true,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    });

    const result = await runScoring(baseScoringInput([
      { indicatorId: "p2_local_employment", tier: "T1" },
      { indicatorId: "p3_budget", tier: "T1" },
    ]));

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");

    const scoreCall = vi.mocked(scoreRepo.createScoreSnapshot).mock.calls[0][0];
    expect(scoreCall.isPublished).toBe(false);
    expect(scoreCall.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
  });

  it("blocks publication when P2 T1 evidence is missing", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true,
      p2: false,
      p3: true,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    });

    const result = await runScoring(baseScoringInput());

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
  });

  it("blocks publication when P3 T1 evidence is missing", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true,
      p2: true,
      p3: false,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    });

    const result = await runScoring(baseScoringInput());

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
  });

  it("blocks publication when no evidence is submitted at all", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: false,
      p2: false,
      p3: false,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    });

    const result = await runScoring(baseScoringInput());

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
  });

  it("stores correct publicationBlockedReason in ScoreSnapshot when T1 coverage is partial", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true,
      p2: false,
      p3: false,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    });

    await runScoring(baseScoringInput([{ indicatorId: "p1_energy_intensity", tier: "T1" }]));

    const scoreCall = vi.mocked(scoreRepo.createScoreSnapshot).mock.calls[0][0];
    expect(scoreCall.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
    expect(scoreCall.isPublished).toBe(false);
  });

  it("T3 gate takes precedence over T1 check when P3 status is scoreable", async () => {
    // T3 gate fires (no verified T3 evidence) → publicationBlockedReason is set early
    // T1 coverage check is skipped
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(false);
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: false,
      publicationBlockedReason: "T3 evidence required for P3 scoring",
    });

    const result = await runScoring(baseScoringInput([
      { indicatorId: "p1_energy_intensity", tier: "T1" },
      { indicatorId: "p2_local_employment", tier: "T1" },
      { indicatorId: "p3_budget", tier: "T1" },
    ]));

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("T3 evidence required for P3 scoring");
    // T1 coverage was never queried because T3 gate already blocked publication
    expect(vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot)).not.toHaveBeenCalled();
  });

  it("includes isPublished and publicationBlockedReason in the audit log", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true,
      p2: true,
      p3: true,
    });
    vi.mocked(scoreRepo.createScoreSnapshot).mockResolvedValue({
      ...MOCK_SCORE_BASE,
      isPublished: true,
      publicationBlockedReason: null,
    });

    await runScoring(baseScoringInput([
      { indicatorId: "p1_energy_intensity", tier: "T1" },
      { indicatorId: "p2_local_employment", tier: "T1" },
      { indicatorId: "p3_budget", tier: "T1" },
    ]));

    const auditCall = vi.mocked(auditLogger.logAuditEvent).mock.calls[0][0];
    expect(auditCall.payload).toMatchObject({
      isPublished: true,
      publicationBlockedReason: null,
    });
  });
});
