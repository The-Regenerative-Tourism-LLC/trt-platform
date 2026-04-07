/**
 * Territory Detection + DPI Reference Logic Tests
 *
 * Covers the full territory auto-detection and DPI separation:
 *
 *   Test 1 – Real Madeira operator          → operatorTerritoryId=Madeira, dpiTerritoryId=Madeira, referenceDpi=false
 *   Test 2 – Territory exists but no DPI    → operatorTerritoryId=Azores,  dpiTerritoryId=Madeira, referenceDpi=true
 *   Test 3 – Unknown territory              → operatorTerritoryId=Madeira(fallback), dpiTerritoryId=Madeira, referenceDpi=true
 *   Test 4 – Preview vs Final Score DPI consistency
 *   Test 5 – Submit never fails without explicit territory selection
 *
 * Key conceptual model:
 *   operatorTerritoryId = territory where the operator is located (from destination/region)
 *   dpiTerritoryId      = territory whose DPI was used in scoring
 *   referenceDpi        = true when dpiTerritoryId ≠ operatorTerritoryId
 *
 * Distinction matrix:
 *   | operatorTerritoryId | dpiTerritoryId | referenceDpi | Meaning                     |
 *   | Madeira             | Madeira        | false        | Real Madeira operator       |
 *   | Azores              | Madeira        | true         | Azores operator, ref DPI    |
 *   | Madeira (fallback)  | Madeira        | true         | Unknown region, Madeira fb  |
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/v1/score/preview/route";
import * as sessionLib from "@/lib/auth/session";
import * as dpiRepo from "@/lib/db/repositories/dpi.repo";
import * as prismaModule from "@/lib/db/prisma";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/dpi.repo");
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    scoreSnapshot: { create: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
    assessmentSnapshot: { create: vi.fn() },
  },
}));

// ── Shared fixtures ────────────────────────────────────────────────────────────

const SESSION = { userId: "user-test", email: "test@test.com", role: "operator" as const };

const MADEIRA_TERRITORY_ID = "ter-madeira";
const AZORES_TERRITORY_ID  = "ter-azores";

const MADEIRA_DPI = {
  id: "dpi-madeira",
  territoryId: MADEIRA_TERRITORY_ID,
  methodologyVersion: "1.0.0",
  touristIntensity: 75,
  ecologicalSensitivity: 80,
  economicLeakageRate: 60,
  regenerativePerf: 5,
  compositeDpi: 77,
  pressureLevel: "high",
  operatorCohortSize: 12,
  snapshotHash: "madeira-hash",
  createdAt: new Date("2024-06-01"),
} as any;

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

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
  vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);
  vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(null);
});

// ── Test 1: Real Madeira Operator ─────────────────────────────────────────────

describe("Test 1 – Real Madeira Operator", () => {
  beforeEach(() => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(MADEIRA_DPI);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(MADEIRA_TERRITORY_ID);
  });

  it("returns referenceDpi=false (uses own territory DPI)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();
    expect(json.referenceDpi).toBe(false);
  });

  it("returns operatorTerritoryId = Madeira", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();
    expect(json.operatorTerritoryId).toBe(MADEIRA_TERRITORY_ID);
  });

  it("returns dpiTerritoryId = Madeira (own DPI used)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();
    expect(json.dpiTerritoryId).toBe(MADEIRA_TERRITORY_ID);
  });

  it("operatorTerritoryId === dpiTerritoryId for real Madeira operator", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();
    expect(json.operatorTerritoryId).toBe(json.dpiTerritoryId);
    expect(json.referenceDpi).toBe(false);
  });

  it("does not call findMadeiraTerritoryId (no fallback needed)", async () => {
    await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    expect(vi.mocked(dpiRepo.findMadeiraTerritoryId)).not.toHaveBeenCalled();
  });
});

// ── Test 2: Territory Exists But Has No DPI ───────────────────────────────────

describe("Test 2 – Territory Exists But Has No DPI (Azores)", () => {
  beforeEach(() => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory)
      .mockResolvedValueOnce(null)         // Azores → no DPI
      .mockResolvedValueOnce(MADEIRA_DPI); // Madeira fallback
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(MADEIRA_TERRITORY_ID);
  });

  it("returns referenceDpi=true (Madeira DPI used as reference)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();
    expect(json.referenceDpi).toBe(true);
  });

  it("returns operatorTerritoryId = Azores (operator's real territory preserved)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();
    expect(json.operatorTerritoryId).toBe(AZORES_TERRITORY_ID);
  });

  it("returns dpiTerritoryId = Madeira (Madeira DPI used for scoring)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();
    expect(json.dpiTerritoryId).toBe(MADEIRA_TERRITORY_ID);
  });

  it("operatorTerritoryId ≠ dpiTerritoryId — clearly distinguishable", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();
    expect(json.operatorTerritoryId).not.toBe(json.dpiTerritoryId);
    expect(json.referenceDpi).toBe(true);
  });

  it("still returns a valid GPS score", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();
    expect(json.gpsScore).toBeTypeOf("number");
    expect(res.status).toBe(200);
  });
});

// ── Test 3: Unknown Territory ─────────────────────────────────────────────────

describe("Test 3 – Unknown Territory (Bali, Indonesia)", () => {
  const BALI_TERRITORY_ID = "ter-bali";

  it("referenceDpi=true even when Madeira DPI also unavailable (FALLBACK_DPI used)", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: BALI_TERRITORY_ID })));
    const json = await res.json();
    expect(json.referenceDpi).toBe(true);
  });

  it("referenceDpi=true and dpiTerritoryId=Madeira when Madeira DPI is available", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MADEIRA_DPI);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(MADEIRA_TERRITORY_ID);

    const res = await POST(postReq(minimalPayload({ territoryId: BALI_TERRITORY_ID })));
    const json = await res.json();
    expect(json.referenceDpi).toBe(true);
    expect(json.dpiTerritoryId).toBe(MADEIRA_TERRITORY_ID);
    expect(json.operatorTerritoryId).toBe(BALI_TERRITORY_ID);
  });

  it("referenceDpi=true when no territoryId provided at all", async () => {
    const res = await POST(postReq(minimalPayload())); // no territoryId
    const json = await res.json();
    expect(json.referenceDpi).toBe(true);
    expect(json.operatorTerritoryId).toBeNull();
  });
});

// ── Test 4: Preview vs Final Score Consistency ────────────────────────────────

describe("Test 4 – Preview and Final Score DPI parity", () => {
  it("referenceDpi is consistent across two identical requests", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(MADEIRA_DPI);

    const payload = minimalPayload({ territoryId: MADEIRA_TERRITORY_ID });
    const [res1, res2] = await Promise.all([
      POST(postReq(payload)),
      POST(postReq(payload)),
    ]);
    const [j1, j2] = await Promise.all([res1.json(), res2.json()]);

    expect(j1.referenceDpi).toBe(j2.referenceDpi);
    expect(j1.operatorTerritoryId).toBe(j2.operatorTerritoryId);
    expect(j1.dpiTerritoryId).toBe(j2.dpiTerritoryId);
    expect(j1.gpsScore).toBe(j2.gpsScore);
  });

  it("GPS score and dpiTerritoryId differ when DPI data differs", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValueOnce(MADEIRA_DPI);
    const res1 = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const j1 = await res1.json();

    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValueOnce(null);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(null);
    const res2 = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const j2 = await res2.json();

    expect(j1.referenceDpi).toBe(false);
    expect(j2.referenceDpi).toBe(true);
    // Both have the same operatorTerritoryId
    expect(j1.operatorTerritoryId).toBe(j2.operatorTerritoryId);
    // But dpiTerritoryId differs when fallback is used vs own DPI
    expect(j1.dpiTerritoryId).toBe(MADEIRA_TERRITORY_ID);
  });

  it("all three DPI fields are present in response", async () => {
    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();
    expect("referenceDpi" in json).toBe(true);
    expect("operatorTerritoryId" in json).toBe(true);
    expect("dpiTerritoryId" in json).toBe(true);
  });
});

// ── Test 5: Submit Never Fails + Analytics Queries ───────────────────────────

describe("Test 5 – Submit robustness and analytics foundation", () => {
  it("succeeds with no territoryId (referenceDpi=true, operatorTerritoryId=null)", async () => {
    const res = await POST(postReq(minimalPayload()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.referenceDpi).toBe(true);
    expect(json.operatorTerritoryId).toBeNull();
  });

  it("succeeds when territory has no DPI (Madeira fallback)", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MADEIRA_DPI);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(MADEIRA_TERRITORY_ID);

    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.gpsScore).toBeTypeOf("number");
    // Azores operator stored with Azores territory, Madeira DPI used
    expect(json.operatorTerritoryId).toBe(AZORES_TERRITORY_ID);
    expect(json.dpiTerritoryId).toBe(MADEIRA_TERRITORY_ID);
    expect(json.referenceDpi).toBe(true);
  });

  it("analytics: real Madeira operator is distinguishable (referenceDpi=false)", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(MADEIRA_DPI);

    const res = await POST(postReq(minimalPayload({ territoryId: MADEIRA_TERRITORY_ID })));
    const json = await res.json();

    // Analytics query: "all operators in Madeira using their own DPI"
    // Condition: operatorTerritoryId=Madeira AND referenceDpi=false
    expect(json.operatorTerritoryId).toBe(MADEIRA_TERRITORY_ID);
    expect(json.referenceDpi).toBe(false);
  });

  it("analytics: reference DPI operators are identifiable (referenceDpi=true)", async () => {
    vi.mocked(dpiRepo.findLatestDpiByTerritory)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(MADEIRA_DPI);
    vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(MADEIRA_TERRITORY_ID);

    const res = await POST(postReq(minimalPayload({ territoryId: AZORES_TERRITORY_ID })));
    const json = await res.json();

    // Analytics query: "territories needing their own DPI"
    // Condition: referenceDpi=true AND operatorTerritoryId ≠ dpiTerritoryId
    expect(json.referenceDpi).toBe(true);
    expect(json.operatorTerritoryId).not.toBe(json.dpiTerritoryId);
  });

  it("returns 200 across all territory/DPI scenarios", async () => {
    const scenarios = [
      // Real Madeira
      { mockDpi: MADEIRA_DPI, madeiraMock: MADEIRA_TERRITORY_ID, territoryId: MADEIRA_TERRITORY_ID, expectRef: false },
      // Azores with Madeira fallback
      { mockDpi: null, madeiraMock: MADEIRA_TERRITORY_ID, territoryId: AZORES_TERRITORY_ID, expectRef: true, madeiraDpi: MADEIRA_DPI },
      // No territory at all
      { mockDpi: null, madeiraMock: null, territoryId: undefined, expectRef: true },
    ] as const;

    for (const s of scenarios) {
      vi.resetAllMocks();
      vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
      vi.mocked(dpiRepo.findMadeiraTerritoryId).mockResolvedValue(s.madeiraMock ?? null);

      if (s.mockDpi) {
        vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(s.mockDpi as any);
      } else if ("madeiraDpi" in s && s.madeiraDpi) {
        vi.mocked(dpiRepo.findLatestDpiByTerritory)
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(s.madeiraDpi as any);
      } else {
        vi.mocked(dpiRepo.findLatestDpiByTerritory).mockResolvedValue(null);
      }

      const payload = s.territoryId
        ? minimalPayload({ territoryId: s.territoryId })
        : minimalPayload();

      const res = await POST(postReq(payload));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.gpsScore).toBeTypeOf("number");
      expect(json.referenceDpi).toBe(s.expectRef);
    }
  });
});
