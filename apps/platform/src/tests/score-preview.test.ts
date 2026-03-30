/**
 * Score Preview API Tests
 *
 * Tests for POST /api/v1/score/preview
 *
 * The preview route exercises the real computation pipeline
 * (computeP1Intensities, computeP2Rates, buildAssessmentSnapshot, computeScore).
 * Only the session and DPI repository are mocked.
 * Nothing is written to the database.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/score/preview/route";
import * as sessionLib from "@/lib/auth/session";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";
import * as prismaModule from "@/lib/db/prisma";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/dpi.repo");
// Ensure prisma is never called during preview
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    scoreSnapshot: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    assessmentSnapshot: { create: vi.fn() },
  },
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { userId: "user-preview", email: "preview@test.com", role: "operator" as const };

const MOCK_DPI_SNAPSHOT = {
  id: "dpi-1",
  territoryId: "ter-1",
  methodologyVersion: "1.0.0",
  touristIntensity: 75,
  ecologicalSensitivity: 80,
  economicLeakageRate: 60,
  regenerativePerf: 0,
  compositeDpi: 77,
  pressureLevel: "high",
  operatorCohortSize: 0,
  snapshotHash: "abc123",
  createdAt: new Date("2024-01-01"),
} as any;

/** Minimal valid payload for a Type A solo operator */
function minimalPayload(overrides: Record<string, unknown> = {}) {
  return {
    operatorType: "A",
    activityUnit: { guestNights: 1000 },
    p1Raw: {
      operatorType: "A",
      guestNights: 1000,
      totalElectricityKwh: 10000,
      totalWaterLitres: 50000,
      totalWasteKg: 1000,
      siteScore: 2,
    },
    p2Raw: {
      soloOperator: true,
      tourNoFbSpend: true,
      tourNoNonFbSpend: true,
      directBookingPct: 50,
      communityScore: 3,
    },
    p3: {
      categoryScope: null,
      traceability: null,
      additionality: null,
      continuity: null,
    },
    p3Status: "E",
    recirculationScore: 1,
    ...overrides,
  };
}

function postReq(body: unknown) {
  return new Request("http://localhost/api/v1/score/preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/v1/score/preview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null); // use fallback DPI
  });

  it("returns a GPS score in the valid range", async () => {
    const res = await POST(postReq(minimalPayload()));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.gpsScore).toBeTypeOf("number");
    expect(json.gpsScore).toBeGreaterThanOrEqual(0);
    expect(json.gpsScore).toBeLessThanOrEqual(100);
  });

  it("returns all three pillar scores", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();

    expect(json.pillar1Score).toBeTypeOf("number");
    expect(json.pillar2Score).toBeTypeOf("number");
    expect(json.pillar3Score).toBeTypeOf("number");
  });

  it("sets preview: true in the response", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();
    expect(json.preview).toBe(true);
  });

  it("returns a gpsBand string", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();
    expect(json.gpsBand).toBeTypeOf("string");
    expect(["regenerative_leader", "regenerative_practice", "advancing", "developing", "not_yet_published"]).toContain(
      json.gpsBand
    );
  });

  it("returns indicator sub-scores for all three pillars", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();

    expect(json.indicatorScores).toBeDefined();
    expect(json.indicatorScores.p1).toBeDefined();
    expect(json.indicatorScores.p2).toBeDefined();
    expect(json.indicatorScores.p3).toBeDefined();
  });

  it("returns derived indicators for P1 and P2", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();

    expect(json.derivedIndicators.p1).toBeDefined();
    expect(json.derivedIndicators.p1.energyIntensity).toBeTypeOf("number");
    expect(json.derivedIndicators.p2).toBeDefined();
  });

  it("returns methodologyVersion", async () => {
    const res = await POST(postReq(minimalPayload()));
    const json = await res.json();
    expect(json.methodologyVersion).toBeTypeOf("string");
    expect(json.methodologyVersion.length).toBeGreaterThan(0);
  });

  it("does not call prisma.scoreSnapshot.create — no DB writes", async () => {
    await POST(postReq(minimalPayload()));
    expect(vi.mocked(prismaModule.prisma.scoreSnapshot.create)).not.toHaveBeenCalled();
    expect(vi.mocked(prismaModule.prisma.assessmentSnapshot.create)).not.toHaveBeenCalled();
  });

  it("uses territory DPI when territoryId is provided", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(MOCK_DPI_SNAPSHOT);

    const res = await POST(postReq(minimalPayload({ territoryId: "ter-1" })));
    expect(res.status).toBe(200);
    expect(vi.mocked(dpiRepo.findLatestDpiByTerritory)).toHaveBeenCalledWith("ter-1");
  });

  it("falls back to default DPI when territory has no snapshot", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);

    const res = await POST(postReq(minimalPayload({ territoryId: "ter-no-dpi" })));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.gpsScore).toBeTypeOf("number");
  });

  it("works with minimal valid data (only required fields)", async () => {
    // p3 status E with no programme data — just verifies engine doesn't throw
    const res = await POST(
      postReq({
        operatorType: "B",
        p1Raw: { operatorType: "B", visitorDays: 500 },
        p2Raw: { soloOperator: true, tourNoFbSpend: true, tourNoNonFbSpend: true },
        p3: { categoryScope: null, traceability: null, additionality: null, continuity: null },
        p3Status: "E",
        recirculationScore: 0,
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.preview).toBe(true);
    expect(json.gpsScore).toBeTypeOf("number");
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(sessionLib.requireSession).mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(postReq(minimalPayload()));
    expect(res.status).toBe(401);
  });

  it("returns 400 on invalid request body", async () => {
    const res = await POST(postReq({ operatorType: "INVALID" }));
    expect(res.status).toBe(400);
  });

  it("Type C operator with revenue split computes without error", async () => {
    const res = await POST(
      postReq(
        minimalPayload({
          operatorType: "C",
          activityUnit: { guestNights: 600, visitorDays: 400 },
          revenueSplit: { accommodationPct: 60, experiencePct: 40 },
          p1Raw: {
            operatorType: "C",
            guestNights: 600,
            visitorDays: 400,
            revenueSplitAccommodationPct: 60,
            revenueSplitExperiencePct: 40,
            totalElectricityKwh: 15000,
            totalWaterLitres: 70000,
            totalWasteKg: 1500,
            siteScore: 3,
          },
        })
      )
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.gpsScore).toBeTypeOf("number");
  });
});
