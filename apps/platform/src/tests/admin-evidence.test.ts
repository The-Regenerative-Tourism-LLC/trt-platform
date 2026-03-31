/**
 * Admin Evidence Verification Tests
 *
 * Tests for:
 *   GET  /api/v1/admin/evidence/pending
 *   GET  /api/v1/admin/evidence/:id
 *   POST /api/v1/admin/evidence/:id/verify
 *   POST /api/v1/admin/evidence/:id/reject
 *   POST /api/v1/admin/evidence/:id/lapse
 *
 * Publication re-evaluation after each state change is tested via
 * the shared publication-evaluator service (separately at the bottom).
 *
 * All DB repositories and the session layer are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET as getPending } from "@/app/api/v1/admin/evidence/pending/route";
import { GET as getById } from "@/app/api/v1/admin/evidence/[id]/route";
import { POST as verifyEvidence } from "@/app/api/v1/admin/evidence/[id]/verify/route";
import { POST as rejectEvidence } from "@/app/api/v1/admin/evidence/[id]/reject/route";
import { POST as lapseEvidence } from "@/app/api/v1/admin/evidence/[id]/lapse/route";
import { reevaluateScorePublication } from "@/lib/publication/publication-evaluator";
import * as sessionLib from "@/lib/auth/session";
import * as evidenceRepo from "@/lib/db/repositories/evidence.repo";
import * as scoreRepo from "@/lib/db/repositories/score.repo";
import * as assessmentRepo from "@/lib/db/repositories/assessment.repo";
import * as auditLogger from "@/lib/audit/logger";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/evidence.repo");
vi.mock("@/lib/db/repositories/score.repo");
vi.mock("@/lib/db/repositories/assessment.repo");
vi.mock("@/lib/audit/logger");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const ADMIN_SESSION = { userId: "admin-1", email: "admin@trt.com", role: "admin" as const };
const OPERATOR_SESSION = { userId: "op-user-1", email: "op@trt.com", role: "operator" as const };

const EVIDENCE_ID = "ev-001";
const SNAPSHOT_ID = "snap-001";
const OPERATOR_ID = "op-001";

function makeEvidence(state: "pending" | "verified" | "rejected" | "lapsed" = "pending") {
  return {
    id: EVIDENCE_ID,
    assessmentSnapshotId: SNAPSHOT_ID,
    operatorId: OPERATOR_ID,
    indicatorId: "p1_energy_intensity",
    tier: "T1",
    verificationState: state,
    checksum: null,
    fileName: null,
    storagePath: null,
    proxyMethod: null,
    proxyCorrectionFactor: null,
    submittedAt: new Date(),
    verifiedAt: null,
    verifiedBy: null,
    operator: { id: OPERATOR_ID, legalName: "Quinta das Levadas Lda.", tradingName: null },
    assessmentSnapshot: { id: SNAPSHOT_ID, assessmentCycle: 1, operatorId: OPERATOR_ID },
  } as any;
}

function postReq(body: unknown = {}) {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as any;
}

function getReq() {
  return new Request("http://localhost", { method: "GET" }) as any;
}

function params(id = EVIDENCE_ID) {
  return { params: Promise.resolve({ id }) };
}

// ── Shared setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(sessionLib.requireRole).mockResolvedValue(ADMIN_SESSION);
  vi.mocked(auditLogger.logAuditEvent).mockResolvedValue(undefined as any);
  vi.mocked(evidenceRepo.updateVerificationState).mockResolvedValue({} as any);
});

// ── GET /pending ──────────────────────────────────────────────────────────────

describe("GET /api/v1/admin/evidence/pending", () => {
  it("returns pending evidence queue for admin", async () => {
    const queue = [makeEvidence("pending")];
    vi.mocked(evidenceRepo.findPendingEvidenceQueue).mockResolvedValue(queue as any);

    const res = await getPending();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(1);
    expect(json.count).toBe(1);
  });

  it("returns empty array when queue is empty", async () => {
    vi.mocked(evidenceRepo.findPendingEvidenceQueue).mockResolvedValue([]);

    const res = await getPending();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items).toHaveLength(0);
    expect(json.count).toBe(0);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Unauthorized"));
    const res = await getPending();
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not admin", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Forbidden: requires admin role"));
    const res = await getPending();
    expect(res.status).toBe(403);
  });
});

// ── GET /[id] ─────────────────────────────────────────────────────────────────

describe("GET /api/v1/admin/evidence/[id]", () => {
  it("returns evidence ref with operator and snapshot context", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("pending"));

    const res = await getById(getReq(), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.evidence.id).toBe(EVIDENCE_ID);
    expect(json.evidence.operator.legalName).toBe("Quinta das Levadas Lda.");
    expect(json.evidence.assessmentSnapshot.assessmentCycle).toBe(1);
  });

  it("returns 404 when evidence does not exist", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(null);

    const res = await getById(getReq(), params("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Unauthorized"));
    const res = await getById(getReq(), params());
    expect(res.status).toBe(401);
  });
});

// ── POST /[id]/verify ─────────────────────────────────────────────────────────

describe("POST /api/v1/admin/evidence/[id]/verify", () => {
  beforeEach(() => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("pending"));
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001",
      isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    } as any);
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID,
      p3Status: "E",
    } as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: true,
    });
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(true);
    vi.mocked(scoreRepo.publishScoreSnapshot).mockResolvedValue({
      id: "score-001",
      isPublished: true,
      publicationBlockedReason: null,
    } as any);
    vi.mocked(scoreRepo.blockScorePublication).mockResolvedValue({} as any);
  });

  it("transitions pending evidence to verified", async () => {
    const res = await verifyEvidence(postReq({}), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.state).toBe("verified");
    expect(vi.mocked(evidenceRepo.updateVerificationState)).toHaveBeenCalledWith(
      EVIDENCE_ID, "verified", ADMIN_SESSION.userId
    );
  });

  it("returns 409 when evidence is already verified", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("verified"));

    const res = await verifyEvidence(postReq({}), params());
    expect(res.status).toBe(409);

    const json = await res.json();
    expect(json.error).toBe("Invalid state transition");
  });

  it("returns 409 when evidence is rejected", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("rejected"));

    const res = await verifyEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("publishes score when T1 coverage becomes complete after verification", async () => {
    const res = await verifyEvidence(postReq({}), params());
    const json = await res.json();

    expect(json.publication.isPublished).toBe(true);
    expect(json.publication.publicationBlockedReason).toBeNull();
    expect(vi.mocked(scoreRepo.publishScoreSnapshot)).toHaveBeenCalledWith("score-001");
  });

  it("leaves score blocked when T1 coverage is still incomplete after verification", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: false, p3: true,
    });
    vi.mocked(scoreRepo.blockScorePublication).mockResolvedValue({
      id: "score-001", isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    } as any);

    const res = await verifyEvidence(postReq({}), params());
    const json = await res.json();

    expect(json.publication.isPublished).toBe(false);
    expect(json.publication.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
  });

  it("logs audit event for evidence.verified", async () => {
    await verifyEvidence(postReq({ notes: "Document looks authentic" }), params());

    const calls = vi.mocked(auditLogger.logAuditEvent).mock.calls;
    const evidenceAudit = calls.find((c) => c[0].action === "evidence.verified");
    expect(evidenceAudit).toBeDefined();
    expect(evidenceAudit![0].payload?.notes).toBe("Document looks authentic");
  });

  it("returns 404 when evidence does not exist", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(null);
    const res = await verifyEvidence(postReq({}), params("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Unauthorized"));
    const res = await verifyEvidence(postReq({}), params());
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not admin", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Forbidden: requires admin role"));
    const res = await verifyEvidence(postReq({}), params());
    expect(res.status).toBe(403);
  });
});

// ── POST /[id]/reject ─────────────────────────────────────────────────────────

describe("POST /api/v1/admin/evidence/[id]/reject", () => {
  beforeEach(() => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("pending"));
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001",
      isPublished: false,
      publicationBlockedReason: null,
    } as any);
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID,
      p3Status: "E",
    } as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: false, p2: true, p3: true,
    });
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(true);
    vi.mocked(scoreRepo.blockScorePublication).mockResolvedValue({
      id: "score-001", isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    } as any);
    vi.mocked(scoreRepo.publishScoreSnapshot).mockResolvedValue({} as any);
  });

  it("transitions pending evidence to rejected", async () => {
    const res = await rejectEvidence(postReq({}), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.state).toBe("rejected");
    expect(vi.mocked(evidenceRepo.updateVerificationState)).toHaveBeenCalledWith(
      EVIDENCE_ID, "rejected", ADMIN_SESSION.userId
    );
  });

  it("returns 409 when evidence is already rejected", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("rejected"));
    const res = await rejectEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("returns 409 when evidence is verified (cannot reject verified)", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("verified"));
    const res = await rejectEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("blocks score publication when rejection removes T1 coverage", async () => {
    const res = await rejectEvidence(postReq({}), params());
    const json = await res.json();

    expect(json.publication.isPublished).toBe(false);
    expect(json.publication.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
    expect(vi.mocked(scoreRepo.blockScorePublication)).toHaveBeenCalledWith(
      "score-001", "Insufficient Tier 1 evidence coverage"
    );
  });

  it("keeps score published when sufficient T1 coverage remains after rejection", async () => {
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: true,
    });
    vi.mocked(scoreRepo.publishScoreSnapshot).mockResolvedValue({
      id: "score-001", isPublished: true, publicationBlockedReason: null,
    } as any);

    const res = await rejectEvidence(postReq({}), params());
    const json = await res.json();

    expect(json.publication.isPublished).toBe(true);
  });

  it("logs audit event for evidence.rejected with notes", async () => {
    await rejectEvidence(postReq({ notes: "Forged document" }), params());

    const calls = vi.mocked(auditLogger.logAuditEvent).mock.calls;
    const evidenceAudit = calls.find((c) => c[0].action === "evidence.rejected");
    expect(evidenceAudit).toBeDefined();
    expect(evidenceAudit![0].payload?.notes).toBe("Forged document");
  });

  it("returns 404 when evidence does not exist", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(null);
    const res = await rejectEvidence(postReq({}), params("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Unauthorized"));
    const res = await rejectEvidence(postReq({}), params());
    expect(res.status).toBe(401);
  });
});

// ── POST /[id]/lapse ──────────────────────────────────────────────────────────

describe("POST /api/v1/admin/evidence/[id]/lapse", () => {
  beforeEach(() => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("verified"));
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001",
      isPublished: true,
      publicationBlockedReason: null,
    } as any);
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID,
      p3Status: "E",
    } as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: false, p2: true, p3: true,
    });
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(true);
    vi.mocked(scoreRepo.blockScorePublication).mockResolvedValue({
      id: "score-001", isPublished: false,
      publicationBlockedReason: "Insufficient Tier 1 evidence coverage",
    } as any);
    vi.mocked(scoreRepo.publishScoreSnapshot).mockResolvedValue({} as any);
  });

  it("transitions verified evidence to lapsed", async () => {
    const res = await lapseEvidence(postReq({}), params());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.state).toBe("lapsed");
    expect(vi.mocked(evidenceRepo.updateVerificationState)).toHaveBeenCalledWith(
      EVIDENCE_ID, "lapsed", ADMIN_SESSION.userId
    );
  });

  it("returns 409 when evidence is pending (cannot lapse pending)", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("pending"));
    const res = await lapseEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("returns 409 when evidence is already lapsed", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("lapsed"));
    const res = await lapseEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("returns 409 when evidence is rejected (cannot lapse rejected)", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(makeEvidence("rejected"));
    const res = await lapseEvidence(postReq({}), params());
    expect(res.status).toBe(409);
  });

  it("unpublishes a previously published score when lapsing removes T1 coverage", async () => {
    const res = await lapseEvidence(postReq({}), params());
    const json = await res.json();

    expect(json.publication.isPublished).toBe(false);
    expect(json.publication.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
    expect(vi.mocked(scoreRepo.blockScorePublication)).toHaveBeenCalledWith(
      "score-001", "Insufficient Tier 1 evidence coverage"
    );
  });

  it("logs audit event for evidence.lapsed", async () => {
    await lapseEvidence(postReq({ notes: "Certificate expired" }), params());

    const calls = vi.mocked(auditLogger.logAuditEvent).mock.calls;
    const evidenceAudit = calls.find((c) => c[0].action === "evidence.lapsed");
    expect(evidenceAudit).toBeDefined();
    expect(evidenceAudit![0].payload?.notes).toBe("Certificate expired");
  });

  it("returns 404 when evidence does not exist", async () => {
    vi.mocked(evidenceRepo.findEvidenceRefById).mockResolvedValue(null);
    const res = await lapseEvidence(postReq({}), params("nonexistent"));
    expect(res.status).toBe(404);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(sessionLib.requireRole).mockRejectedValue(new Error("Unauthorized"));
    const res = await lapseEvidence(postReq({}), params());
    expect(res.status).toBe(401);
  });
});

// ── Publication evaluator unit tests ──────────────────────────────────────────

describe("reevaluateScorePublication", () => {
  beforeEach(() => {
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID,
      p3Status: "E",
    } as any);
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(true);
    vi.mocked(scoreRepo.publishScoreSnapshot).mockResolvedValue({
      id: "score-001", isPublished: true, publicationBlockedReason: null,
    } as any);
    vi.mocked(scoreRepo.blockScorePublication).mockResolvedValue({} as any);
  });

  it("publishes score when all three pillars have T1 coverage", async () => {
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001", isPublished: false,
    } as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: true,
    });

    const result = await reevaluateScorePublication(SNAPSHOT_ID, OPERATOR_ID);

    expect(result.isPublished).toBe(true);
    expect(result.publicationBlockedReason).toBeNull();
    expect(vi.mocked(scoreRepo.publishScoreSnapshot)).toHaveBeenCalledWith("score-001");
  });

  it("blocks score when T1 coverage is missing for any pillar", async () => {
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001", isPublished: true,
    } as any);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: false,
    });

    const result = await reevaluateScorePublication(SNAPSHOT_ID, OPERATOR_ID);

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("Insufficient Tier 1 evidence coverage");
    expect(vi.mocked(scoreRepo.blockScorePublication)).toHaveBeenCalledWith(
      "score-001", "Insufficient Tier 1 evidence coverage"
    );
  });

  it("blocks score with T3 reason when p3Status requires T3 and none verified", async () => {
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001", isPublished: false,
    } as any);
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID, p3Status: "A",
    } as any);
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(false);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: true,
    });

    const result = await reevaluateScorePublication(SNAPSHOT_ID, OPERATOR_ID);

    expect(result.isPublished).toBe(false);
    expect(result.publicationBlockedReason).toBe("T3 evidence required for P3 scoring");
    // T1 check was skipped because T3 gate already blocked
    expect(vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot)).not.toHaveBeenCalled();
  });

  it("returns no-op result when no ScoreSnapshot exists for the snapshot", async () => {
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue(null);

    const result = await reevaluateScorePublication(SNAPSHOT_ID, OPERATOR_ID);

    expect(result.scoreSnapshotId).toBeNull();
    expect(vi.mocked(scoreRepo.publishScoreSnapshot)).not.toHaveBeenCalled();
    expect(vi.mocked(scoreRepo.blockScorePublication)).not.toHaveBeenCalled();
  });

  it("skips T3 gate when p3Status is D (forward commitment)", async () => {
    vi.mocked(scoreRepo.findScoreByAssessmentSnapshot).mockResolvedValue({
      id: "score-001", isPublished: false,
    } as any);
    vi.mocked(assessmentRepo.findAssessmentSnapshotById).mockResolvedValue({
      id: SNAPSHOT_ID, p3Status: "D",
    } as any);
    vi.mocked(evidenceRepo.findVerifiedT3Evidence).mockResolvedValue(false);
    vi.mocked(evidenceRepo.findT1EvidenceCoverageBySnapshot).mockResolvedValue({
      p1: true, p2: true, p3: true,
    });

    const result = await reevaluateScorePublication(SNAPSHOT_ID, OPERATOR_ID);

    // T3 gate skipped for status D; T1 check passes → published
    expect(result.isPublished).toBe(true);
    expect(vi.mocked(evidenceRepo.findVerifiedT3Evidence)).not.toHaveBeenCalled();
  });
});
