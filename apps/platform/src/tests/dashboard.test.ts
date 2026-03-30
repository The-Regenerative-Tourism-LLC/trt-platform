/**
 * Operator Dashboard API Tests
 *
 * Tests for GET /api/v1/operator/dashboard
 *
 * Mocks: session, operator repo, score repo, DPI repo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/operator/dashboard/route";
import * as sessionLib from "@/lib/auth/session";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as scoreRepo from "@/lib/db/repositories/score.repo";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/db/repositories/score.repo");
vi.mock("@/lib/db/repositories/dpi.repo");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { userId: "user-1", email: "op@test.com", role: "operator" as const };

const OPERATOR = {
  id: "op-1",
  userId: "user-1",
  legalName: "Quinta das Levadas Lda.",
  tradingName: "Quinta das Levadas",
  country: "Portugal",
  destinationRegion: "Madeira",
  operatorType: "A",
  operatorCode: "QDL-MAD-001",
  assessmentCycleCount: 1,
  onboardingCompleted: true,
  onboardingStep: 19,
  onboardingData: {},
  territoryId: "ter-1",
} as any;

function makeScore(id: string, gpsTotal: number, computedAt: Date) {
  return {
    id,
    assessmentSnapshotId: "snap-1",
    operatorId: "op-1",
    dpiSnapshotId: null,
    methodologyVersion: "1.0.0",
    inputHash: null,
    bundleHash: null,
    p1Score: 72,
    p2Score: 68,
    p3Score: 0,
    gpsTotal,
    gpsBand: "advancing",
    dpsTotal: null,
    dps1: null,
    dps2: null,
    dps3: null,
    dpsBand: null,
    dpiScore: null,
    dpiPressureLevel: null,
    computationTrace: null,
    isPublished: false,
    publicationBlockedReason: null,
    computedAt,
  } as any;
}

const LATEST_SCORE = makeScore("score-2", 62.5, new Date("2025-06-01"));
const PREVIOUS_SCORE = makeScore("score-1", 55, new Date("2024-12-01"));

const TERRITORY = {
  id: "ter-1",
  name: "Madeira",
  country: "Portugal",
  slug: "madeira",
  isAvailable: true,
  compositeDpi: 77,
  pressureLevel: "high",
  touristIntensity: 75,
  ecologicalSensitivity: 80,
  economicLeakageRate: 60,
  regenerativePerformance: 0,
  dpiComputedAt: new Date("2024-01-01"),
} as any;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/operator/dashboard", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(OPERATOR);
    vi.mocked(scoreRepo.findLatestScoreByOperator).mockResolvedValue(LATEST_SCORE);
    vi.mocked(scoreRepo.findPreviousScoreByOperator).mockResolvedValue(PREVIOUS_SCORE);
    vi.mocked(dpiRepo.findTerritoryById).mockResolvedValue(TERRITORY);
  });

  it("returns 200 with operator data", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.operator.id).toBe("op-1");
    expect(json.operator.legalName).toBe("Quinta das Levadas Lda.");
  });

  it("returns the latest score with all fields", async () => {
    const res = await GET();
    const json = await res.json();

    expect(json.operator.latestScore).not.toBeNull();
    expect(json.operator.latestScore.gpsTotal).toBe(62.5);
    expect(json.operator.latestScore.gpsBand).toBe("advancing");
    expect(json.operator.latestScore.p1Score).toBe(72);
    expect(json.operator.latestScore.p2Score).toBe(68);
    expect(json.operator.latestScore.p3Score).toBe(0);
    expect(json.operator.latestScore.isPublished).toBe(false);
  });

  it("returns the previous score for delta comparison", async () => {
    const res = await GET();
    const json = await res.json();

    expect(json.operator.previousScore).not.toBeNull();
    expect(json.operator.previousScore.gpsScore).toBe(55);
    expect(json.operator.previousScore.pillar1Score).toBe(72);
    expect(json.operator.previousScore.createdAt).toBe("2024-12-01T00:00:00.000Z");
  });

  it("returns null latestScore when operator has no assessment", async () => {
    vi.mocked(scoreRepo.findLatestScoreByOperator).mockResolvedValue(null);
    vi.mocked(scoreRepo.findPreviousScoreByOperator).mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(json.operator.latestScore).toBeNull();
    expect(json.operator.previousScore).toBeNull();
  });

  it("returns null previousScore when only one assessment exists", async () => {
    vi.mocked(scoreRepo.findPreviousScoreByOperator).mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(json.operator.latestScore).not.toBeNull();
    expect(json.operator.previousScore).toBeNull();
  });

  it("returns onboardingCompleted flag", async () => {
    const res = await GET();
    const json = await res.json();
    expect(json.operator.onboardingCompleted).toBe(true);
  });

  it("returns false for onboardingCompleted when not yet completed", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue({
      ...OPERATOR,
      onboardingCompleted: false,
    });
    const res = await GET();
    const json = await res.json();
    expect(json.operator.onboardingCompleted).toBe(false);
  });

  it("returns territory DPI data", async () => {
    const res = await GET();
    const json = await res.json();

    const territory = json.operator.territory;
    expect(territory).not.toBeNull();
    expect(territory.name).toBe("Madeira");
    expect(territory.compositeDpi).toBe(77);
    expect(territory.pressureLevel).toBe("high");
    expect(territory.touristIntensity).toBe(75);
  });

  it("returns null territory when operator has no territoryId", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue({
      ...OPERATOR,
      territoryId: null,
    });

    const res = await GET();
    const json = await res.json();
    expect(json.operator.territory).toBeNull();
    expect(vi.mocked(dpiRepo.findTerritoryById)).not.toHaveBeenCalled();
  });

  it("returns { operator: null } when no operator profile found", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(null);
    const res = await GET();
    const json = await res.json();
    expect(json.operator).toBeNull();
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(sessionLib.requireSession).mockRejectedValue(new Error("Unauthorized"));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("fetches latest and previous scores in parallel for the same operator", async () => {
    await GET();
    expect(vi.mocked(scoreRepo.findLatestScoreByOperator)).toHaveBeenCalledWith("op-1");
    expect(vi.mocked(scoreRepo.findPreviousScoreByOperator)).toHaveBeenCalledWith("op-1");
  });
});
