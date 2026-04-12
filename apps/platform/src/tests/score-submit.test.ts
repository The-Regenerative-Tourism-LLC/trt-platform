/**
 * Score Submit API Tests
 *
 * Tests for POST /api/v1/score
 *
 * Mocks: session, operator repo, scoring orchestrator.
 * Verifies that the route derives indicators server-side,
 * delegates to runScoring, and marks onboarding completed.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/score/route";
import * as sessionLib from "@/lib/auth/session";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as draftRepo from "@/lib/db/repositories/onboarding-draft.repo";
import * as orchestrator from "@/lib/orchestration/scoring-orchestrator";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/db/repositories/onboarding-draft.repo");
vi.mock("@/lib/orchestration/scoring-orchestrator");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { userId: "user-1", email: "op@test.com", role: "operator" as const };

const OPERATOR = {
  id: "op-1",
  userId: "user-1",
  legalName: "Quinta das Levadas Lda.",
  assessmentCycleCount: 0,
  onboardingCompleted: false,
  territoryId: "ter-1",
} as any;

const SCORING_RESULT = {
  assessmentSnapshotId: "snap-1",
  scoreSnapshotId: "score-1",
  gpsTotal: 62.5,
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
  referenceDpi: false,
  methodologyVersion: "1.0.0",
  isPublished: false,
  publicationBlockedReason: null,
};

/** Minimal valid request body for a Type A operator, Cycle 1 */
function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    operatorId: "op-1",
    territoryId: "ter-1",
    assessmentPeriodEnd: "2024-12-31",
    operatorType: "A",
    activityUnit: { guestNights: 1000 },
    p1Raw: {
      totalElectricityKwh: 10000,
      totalWaterLitres: 50000,
      totalWasteKg: 1000,
      recirculationScore: 1,
      siteScore: 2,
    },
    p2Raw: {
      soloOperator: true,
      tourNoFbSpend: true,
      tourNoNonFbSpend: true,
      directBookingPct: 50,
      communityScore: 3,
    },
    pillar3: null,
    p3Status: "E",
    delta: null,
    evidence: [],
    onboardingSnapshot: {},
    ...overrides,
  };
}

function postReq(body: unknown) {
  return new Request("http://localhost/api/v1/score", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/v1/score", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(OPERATOR);
    vi.mocked(operatorRepo.markOnboardingCompleted).mockResolvedValue({
      ...OPERATOR,
      onboardingCompleted: true,
    });
    vi.mocked(operatorRepo.updateOperator).mockResolvedValue(OPERATOR);
    vi.mocked(draftRepo.findDraftByOperatorId).mockResolvedValue(null);
    vi.mocked(orchestrator.runScoring).mockResolvedValue(SCORING_RESULT);
  });

  it("returns 201 with scoring result on valid payload", async () => {
    const res = await POST(postReq(validPayload()));
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.result.gpsTotal).toBe(62.5);
    expect(json.result.gpsBand).toBe("advancing");
  });

  it("calls runScoring with derived P1/P2 indicators (not raw values)", async () => {
    await POST(postReq(validPayload()));

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    const p1 = call.snapshotInput.pillar1;
    const p2 = call.snapshotInput.pillar2;

    // Derived P1 fields — not the raw kWh/litres/kg numbers from the client
    expect(p1.energyIntensity).toBeTypeOf("number");
    expect(p1.waterIntensity).toBeTypeOf("number");
    expect(p1.wasteDiversionPct).toBeTypeOf("number");
    expect(p1.carbonIntensity).toBeTypeOf("number");

    // Derived P2 rates — not raw FTE counts / spend amounts
    expect(p2.localEmploymentRate).toBeTypeOf("number");
    expect(p2.directBookingRate).toBe(50); // directBookingPct passes through as rate
  });

  it("marks onboarding as completed after successful scoring", async () => {
    await POST(postReq(validPayload()));
    expect(vi.mocked(operatorRepo.markOnboardingCompleted)).toHaveBeenCalledWith("op-1");
  });

  it("increments assessment cycle correctly (Cycle 1 → cycle arg = 1)", async () => {
    await POST(postReq(validPayload()));
    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    // assessmentCycleCount is 0 → route passes cycle 1
    expect(call.snapshotInput.assessmentCycle).toBe(1);
  });

  it("passes cycle 2 when operator has completed one prior cycle", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue({
      ...OPERATOR,
      assessmentCycleCount: 1,
    });
    await POST(postReq(validPayload()));
    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.assessmentCycle).toBe(2);
  });

  it("stores delta explanation when delta is provided", async () => {
    const delta = { explanation: "Second cycle — improved water management" };
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue({
      ...OPERATOR,
      assessmentCycleCount: 1,
    });

    await POST(postReq(validPayload({ delta })));

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.delta).not.toBeNull();
    expect(call.snapshotInput.delta!.explanation).toBe(delta.explanation);
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(sessionLib.requireSession).mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(postReq(validPayload()));
    expect(res.status).toBe(401);
  });

  it("returns 403 when operatorId does not belong to session user", async () => {
    const res = await POST(postReq(validPayload({ operatorId: "op-OTHER" })));
    expect(res.status).toBe(403);
  });

  it("returns 400 on invalid payload (missing required fields)", async () => {
    const res = await POST(postReq({ operatorType: "A" }));
    expect(res.status).toBe(400);
  });

  it("does not mark onboarding completed when runScoring throws", async () => {
    vi.mocked(orchestrator.runScoring).mockRejectedValue(new Error("Engine failure"));
    const res = await POST(postReq(validPayload()));
    expect(res.status).toBe(500);
    expect(vi.mocked(operatorRepo.markOnboardingCompleted)).not.toHaveBeenCalled();
  });

  it("passes evidence array to runScoring", async () => {
    const evidence = [
      { indicatorId: "p3_budget", tier: "T2" as const, checksum: "abc", verificationState: "pending" as const },
    ];
    await POST(postReq(validPayload({ evidence })));

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.evidence).toHaveLength(1);
    expect(call.snapshotInput.evidence[0].indicatorId).toBe("p3_budget");
  });

  // ── Evidence tier metadata tests ────────────────────────────────────────

  it("accepts T1, T2, T3, and Proxy evidence tiers", async () => {
    const evidence = [
      { indicatorId: "energy_kwh", tier: "T1" },
      { indicatorId: "water_litres", tier: "T2" },
      { indicatorId: "p3_budget", tier: "T3" },
      { indicatorId: "p2_local_spend", tier: "Proxy" },
    ];
    const res = await POST(postReq(validPayload({ evidence })));
    expect(res.status).toBe(201);

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    const tiers = call.snapshotInput.evidence.map((e: any) => e.tier);
    expect(tiers).toEqual(["T1", "T2", "T3", "Proxy"]);
  });

  it("normalizes PROXY (uppercase alias) to Proxy before passing to orchestrator", async () => {
    const evidence = [{ indicatorId: "p2_local_spend", tier: "PROXY" }];
    const res = await POST(postReq(validPayload({ evidence })));
    expect(res.status).toBe(201);

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.evidence[0].tier).toBe("Proxy");
  });

  it("passes proxyMethod and proxyCorrectionFactor through to orchestrator", async () => {
    const evidence = [
      {
        indicatorId: "p2_local_spend",
        tier: "Proxy",
        proxyMethod: "industry_benchmark",
        proxyCorrectionFactor: 0.85,
      },
    ];
    await POST(postReq(validPayload({ evidence })));

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    const e = call.snapshotInput.evidence[0];
    expect(e.proxyMethod).toBe("industry_benchmark");
    expect(e.proxyCorrectionFactor).toBe(0.85);
  });

  it("defaults verificationState to pending when omitted", async () => {
    const evidence = [{ indicatorId: "energy_kwh", tier: "T1" }];
    await POST(postReq(validPayload({ evidence })));

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.evidence[0].verificationState).toBe("pending");
  });

  it("submission succeeds with no evidence (empty array)", async () => {
    const res = await POST(postReq(validPayload({ evidence: [] })));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
  });

  it("submission succeeds when evidence field is omitted entirely", async () => {
    const { evidence: _omit, ...payloadWithoutEvidence } = validPayload();
    const res = await POST(postReq(payloadWithoutEvidence));
    expect(res.status).toBe(201);
  });

  it("returns 400 when an evidence item has an invalid tier", async () => {
    const evidence = [{ indicatorId: "energy_kwh", tier: "INVALID_TIER" }];
    const res = await POST(postReq(validPayload({ evidence })));
    expect(res.status).toBe(400);
  });

  it("returns 400 when proxyCorrectionFactor is not positive", async () => {
    const evidence = [
      { indicatorId: "p2_local_spend", tier: "Proxy", proxyCorrectionFactor: -0.5 },
    ];
    const res = await POST(postReq(validPayload({ evidence })));
    expect(res.status).toBe(400);
  });

  it("multiple evidence items with mixed tiers and proxy metadata all pass through", async () => {
    const evidence = [
      { indicatorId: "energy_kwh", tier: "T1", checksum: "sha256-abc" },
      { indicatorId: "water_litres", tier: "T2" },
      { indicatorId: "p2_local_spend", tier: "PROXY", proxyMethod: "national_stats", proxyCorrectionFactor: 1.1 },
    ];
    const res = await POST(postReq(validPayload({ evidence })));
    expect(res.status).toBe(201);

    const call = vi.mocked(orchestrator.runScoring).mock.calls[0][0];
    expect(call.snapshotInput.evidence).toHaveLength(3);
    expect(call.snapshotInput.evidence[2].tier).toBe("Proxy"); // PROXY normalized
    expect(call.snapshotInput.evidence[2].proxyMethod).toBe("national_stats");
  });
});
