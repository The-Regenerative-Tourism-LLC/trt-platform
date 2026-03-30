/**
 * Onboarding Draft API Tests
 *
 * Tests for GET/POST /api/v1/onboarding/draft
 * Mocks: session, operator repo, draft repo.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "@/app/api/v1/onboarding/draft/route";
import * as sessionLib from "@/lib/auth/session";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as draftRepo from "@/lib/db/repositories/onboarding-draft.repo";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/db/repositories/onboarding-draft.repo");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { userId: "user-1", email: "op@test.com", role: "operator" as const };

const OPERATOR = {
  id: "op-1",
  userId: "user-1",
  legalName: "Test Operator Lda.",
  assessmentCycleCount: 0,
  onboardingCompleted: false,
  onboardingStep: 0,
  onboardingData: {},
} as any;

function makeDraft(currentStep: number, dataJson: Record<string, unknown>) {
  return {
    id: "draft-1",
    operatorId: "op-1",
    currentStep,
    dataJson,
    updatedAt: new Date("2024-12-01T10:00:00.000Z"),
  } as any;
}

function postReq(body: unknown) {
  return new Request("http://localhost/api/v1/onboarding/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

// ── POST tests ────────────────────────────────────────────────────────────────

describe("POST /api/v1/onboarding/draft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(OPERATOR);
  });

  it("saves step and data, returns draft", async () => {
    const data = { operatorType: "A", legalName: "Test Operator Lda." };
    vi.mocked(draftRepo.upsertDraft).mockResolvedValue(makeDraft(3, data));

    const res = await POST(postReq({ currentStep: 3, dataJson: data }));
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.draft.currentStep).toBe(3);
    expect(json.draft.dataJson).toEqual(data);
    expect(vi.mocked(draftRepo.upsertDraft)).toHaveBeenCalledWith("op-1", 3, data);
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(sessionLib.requireSession).mockRejectedValue(new Error("Unauthorized"));
    const res = await POST(postReq({ currentStep: 0, dataJson: {} }));
    expect(res.status).toBe(401);
  });

  it("returns 404 when operator profile not found", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(null);
    const res = await POST(postReq({ currentStep: 0, dataJson: {} }));
    expect(res.status).toBe(404);
  });

  it("returns 400 on invalid input (missing dataJson)", async () => {
    const res = await POST(postReq({ currentStep: 2 }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when currentStep is not an integer", async () => {
    const res = await POST(postReq({ currentStep: "not-a-number", dataJson: {} }));
    expect(res.status).toBe(400);
  });

  it("updating draft twice calls upsertDraft twice with latest values", async () => {
    const firstData = { operatorType: "A" };
    const secondData = { operatorType: "A", legalName: "Updated Name" };

    vi.mocked(draftRepo.upsertDraft)
      .mockResolvedValueOnce(makeDraft(2, firstData))
      .mockResolvedValueOnce(makeDraft(5, secondData));

    await POST(postReq({ currentStep: 2, dataJson: firstData }));
    const res2 = await POST(postReq({ currentStep: 5, dataJson: secondData }));

    expect(vi.mocked(draftRepo.upsertDraft)).toHaveBeenCalledTimes(2);
    expect(vi.mocked(draftRepo.upsertDraft)).toHaveBeenNthCalledWith(1, "op-1", 2, firstData);
    expect(vi.mocked(draftRepo.upsertDraft)).toHaveBeenNthCalledWith(2, "op-1", 5, secondData);

    const json = await res2.json();
    expect(json.draft.currentStep).toBe(5);
    expect(json.draft.dataJson).toEqual(secondData);
  });
});

// ── GET tests ─────────────────────────────────────────────────────────────────

describe("GET /api/v1/onboarding/draft", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(OPERATOR);
  });

  it("returns saved draft with correct step and data", async () => {
    const data = { operatorType: "B", destinationRegion: "Madeira" };
    vi.mocked(draftRepo.findDraftByOperatorId).mockResolvedValue(makeDraft(7, data));

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.draft.currentStep).toBe(7);
    expect(json.draft.dataJson).toEqual(data);
    expect(json.draft.updatedAt).toBe("2024-12-01T10:00:00.000Z");
  });

  it("returns empty draft shell when no draft exists", async () => {
    vi.mocked(draftRepo.findDraftByOperatorId).mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();
    expect(json.draft.currentStep).toBe(0);
    expect(json.draft.dataJson).toEqual({});
    expect(json.draft.updatedAt).toBeNull();
  });

  it("returns 401 when session is missing", async () => {
    vi.mocked(sessionLib.requireSession).mockRejectedValue(new Error("Unauthorized"));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 404 when operator profile not found", async () => {
    vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(404);
  });

  it("persists step index correctly across high step numbers", async () => {
    vi.mocked(draftRepo.findDraftByOperatorId).mockResolvedValue(makeDraft(19, {}));
    const res = await GET();
    const json = await res.json();
    expect(json.draft.currentStep).toBe(19);
  });
});
