/**
 * Public Operator Profile API Tests
 *
 * Tests for GET /api/v1/public/operators/:id
 *
 * Verifies:
 *   - Published operator data is returned correctly
 *   - 404 when operator does not exist
 *   - 404 when operator has no published ScoreSnapshot
 *   - Private fields are excluded from the response
 *   - Evidence summaries include only verified items
 *   - Score fields are correctly shaped and typed
 *   - Delta data is exposed from the linked AssessmentSnapshot
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/v1/public/operators/[id]/route";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";

vi.mock("@/lib/db/repositories/operator.repo");

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeProfile(overrides: Partial<ReturnType<typeof baseProfile>> = {}) {
  return { ...baseProfile(), ...overrides };
}

function baseProfile() {
  return {
    operator: {
      id: "op-1",
      legalName: "Quinta das Levadas Lda.",
      tradingName: "Quinta das Levadas",
      country: "Portugal",
      destinationRegion: "Douro Valley",
      operatorType: "A",
      tagline: "Authentic Douro wine experience.",
      website: "https://example.com",
      territory: {
        id: "ter-1",
        name: "Douro Protected Landscape",
        compositeDpi: 62 as any,
        pressureLevel: "high",
      },
      scoreSnapshots: [
        {
          id: "score-1",
          methodologyVersion: "1.0.0",
          computedAt: new Date("2024-12-31T10:00:00Z"),
          gpsTotal: 68 as any,
          gpsBand: "advancing",
          p1Score: 72 as any,
          p2Score: 65 as any,
          p3Score: 67 as any,
          dpsTotal: null,
          dps1: null,
          dps2: null,
          dps3: null,
          dpsBand: null,
          assessmentSnapshot: {
            id: "snap-1",
            assessmentCycle: 1,
            assessmentPeriodEnd: new Date("2024-12-31"),
            deltaPriorCycle: null,
            deltaExplanation: null,
          },
        },
      ],
    },
    latestScore: {
      id: "score-1",
      methodologyVersion: "1.0.0",
      computedAt: new Date("2024-12-31T10:00:00Z"),
      gpsTotal: 68,
      gpsBand: "advancing",
      p1Score: 72,
      p2Score: 65,
      p3Score: 67,
      dpsTotal: null,
      dps1: null,
      dps2: null,
      dps3: null,
      dpsBand: null,
      assessmentSnapshot: {
        id: "snap-1",
        assessmentCycle: 1,
        assessmentPeriodEnd: new Date("2024-12-31"),
        deltaPriorCycle: null,
        deltaExplanation: null,
      },
    },
    evidence: [
      {
        indicatorId: "p1_energy_intensity",
        tier: "T1",
        verificationState: "verified",
        proxyMethod: null,
        proxyCorrectionFactor: null,
        verifiedAt: new Date("2024-12-15T08:00:00Z"),
      },
      {
        indicatorId: "p2_local_employment",
        tier: "T1",
        verificationState: "verified",
        proxyMethod: null,
        proxyCorrectionFactor: null,
        verifiedAt: new Date("2024-12-15T08:00:00Z"),
      },
      {
        indicatorId: "p3_budget",
        tier: "T3",
        verificationState: "verified",
        proxyMethod: null,
        proxyCorrectionFactor: null,
        verifiedAt: new Date("2024-12-15T08:00:00Z"),
      },
    ],
  };
}

function getReq() {
  return new Request("http://localhost", { method: "GET" }) as any;
}

function params(id = "op-1") {
  return { params: Promise.resolve({ id }) };
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/v1/public/operators/:id", () => {
  it("returns operator profile with score and evidence on success", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.operator.id).toBe("op-1");
    expect(json.operator.name).toBe("Quinta das Levadas");
    expect(json.operator.legalName).toBe("Quinta das Levadas Lda.");
    expect(json.score.gpsTotal).toBe(68);
    expect(json.score.gpsBand).toBe("advancing");
    expect(json.evidence).toHaveLength(3);
  });

  it("uses tradingName as name when available", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const json = await res.json();

    expect(json.operator.name).toBe("Quinta das Levadas");
  });

  it("falls back to legalName when tradingName is null", async () => {
    const profile = makeProfile();
    profile.operator.tradingName = null as any;
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      profile as any
    );

    const res = await GET(getReq(), params());
    const json = await res.json();

    expect(json.operator.name).toBe("Quinta das Levadas Lda.");
  });

  it("returns 404 when operator does not exist", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(null);

    const res = await GET(getReq(), params("nonexistent"));
    expect(res.status).toBe(404);

    const json = await res.json();
    expect(json.error).toMatch(/not found/i);
  });

  it("returns 404 when operator has no published score (findPublishedOperatorProfile returns null)", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(null);

    const res = await GET(getReq(), params());
    expect(res.status).toBe(404);
  });

  it("includes pillar scores as numbers", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.p1Score).toBe(72);
    expect(score.p2Score).toBe(65);
    expect(score.p3Score).toBe(67);
    expect(typeof score.p1Score).toBe("number");
  });

  it("includes assessment cycle and methodology version", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.assessmentCycle).toBe(1);
    expect(score.methodologyVersion).toBe("1.0.0");
    expect(score.scoreSnapshotId).toBe("score-1");
  });

  it("includes delta.priorCycle and delta.explanation from AssessmentSnapshot", async () => {
    const profile = makeProfile();
    (profile.latestScore.assessmentSnapshot as any).deltaPriorCycle = 1;
    (profile.latestScore.assessmentSnapshot as any).deltaExplanation = "Improved water management.";
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      profile as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.delta.priorCycle).toBe(1);
    expect(score.delta.explanation).toBe("Improved water management.");
  });

  it("exposes delta as null on Cycle 1 (no prior cycle)", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.delta.priorCycle).toBeNull();
    expect(score.delta.explanation).toBeNull();
  });

  it("includes territory with compositeDpi as number", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { operator } = await res.json();

    expect(operator.territory.id).toBe("ter-1");
    expect(operator.territory.name).toBe("Douro Protected Landscape");
    expect(typeof operator.territory.compositeDpi).toBe("number");
    expect(operator.territory.compositeDpi).toBe(62);
    expect(operator.territory.pressureLevel).toBe("high");
  });

  it("returns null for territory when operator has no territory", async () => {
    const profile = makeProfile();
    profile.operator.territory = null as any;
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      profile as any
    );

    const res = await GET(getReq(), params());
    const { operator } = await res.json();

    expect(operator.territory).toBeNull();
  });

  it("includes only verified evidence items in the response", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { evidence } = await res.json();

    // All returned evidence should be verified (repo filters at query level)
    evidence.forEach((e: any) => {
      expect(e.verificationState).toBe("verified");
    });
  });

  it("does not include private file fields in evidence", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { evidence } = await res.json();

    evidence.forEach((e: any) => {
      expect(e).not.toHaveProperty("fileName");
      expect(e).not.toHaveProperty("storagePath");
      expect(e).not.toHaveProperty("checksum");
    });
  });

  it("evidence items include indicatorId, tier, and verifiedAt", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { evidence } = await res.json();

    const p1Item = evidence.find((e: any) => e.indicatorId === "p1_energy_intensity");
    expect(p1Item).toBeDefined();
    expect(p1Item.tier).toBe("T1");
    expect(p1Item.verifiedAt).toBeDefined();
  });

  it("returns empty evidence array when no verified evidence exists", async () => {
    const profile = makeProfile();
    profile.evidence = [];
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      profile as any
    );

    const res = await GET(getReq(), params());
    const { evidence } = await res.json();

    expect(evidence).toHaveLength(0);
  });

  it("returns null dpsTotal and dpsBand for Cycle 1 (no DPS)", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      makeProfile() as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.dpsTotal).toBeNull();
    expect(score.dps1).toBeNull();
    expect(score.dps2).toBeNull();
    expect(score.dps3).toBeNull();
    expect(score.dpsBand).toBeNull();
  });

  it("includes DPS data when present (Cycle 2+)", async () => {
    const profile = makeProfile();
    profile.latestScore.dpsTotal = 4.5 as any;
    profile.latestScore.dps1 = 3 as any;
    profile.latestScore.dps2 = 1 as any;
    profile.latestScore.dps3 = 0.5 as any;
    profile.latestScore.dpsBand = "progressing" as any;
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockResolvedValue(
      profile as any
    );

    const res = await GET(getReq(), params());
    const { score } = await res.json();

    expect(score.dpsTotal).toBe(4.5);
    expect(score.dps1).toBe(3);
    expect(score.dpsBand).toBe("progressing");
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(operatorRepo.findPublishedOperatorProfile).mockRejectedValue(
      new Error("Database connection lost")
    );

    const res = await GET(getReq(), params());
    expect(res.status).toBe(500);

    const json = await res.json();
    expect(json.error).toBe("Internal server error");
  });
});
