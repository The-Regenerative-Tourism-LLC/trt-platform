/**
 * Operator Photos — API Route Tests
 *
 * Covers:
 *   POST   /api/v1/storage/presign  — photo limit enforced before upload
 *   DELETE /api/v1/storage/presign  — orphan cleanup (no DB record required)
 *   POST   /api/v1/operator/photos  — confirm + limit enforcement in transaction
 *   GET    /api/v1/operator/photos  — returns all photos unconditionally
 *
 * All DB and storage dependencies are mocked.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST as presignPost, DELETE as presignDelete } from "@/app/api/v1/storage/presign/route";
import { POST as photosPost, GET as photosGet } from "@/app/api/v1/operator/photos/route";
import * as sessionLib from "@/lib/auth/session";
import * as operatorRepo from "@/lib/db/repositories/operator.repo";
import * as auditLogger from "@/lib/audit/logger";

vi.mock("@/lib/auth/session");
vi.mock("@/lib/db/repositories/operator.repo");
vi.mock("@/lib/audit/logger");
vi.mock("@/lib/storage");
vi.mock("@/lib/db/prisma");

// ── Fixtures ──────────────────────────────────────────────────────────────────

const SESSION = { userId: "user-1", email: "op@test.com", role: "operator" as const };
// CUID-style ID: only alphanumeric, required by key validation patterns
const OPERATOR = { id: "cmohhv99v0006k01c3fhsjyv", userId: "user-1" } as unknown as import("@prisma/client").Operator;

const PHOTO_KEY = `operators/${OPERATOR.id}/photos/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg`;

const PHOTO_RECORD = {
  id: "photo-1",
  operatorId: OPERATOR.id,
  storageKey: PHOTO_KEY,
  url: PHOTO_KEY,
  fileName: "test.jpg",
  mimeType: "image/jpeg",
  sizeBytes: 512000,
  checksum: "a".repeat(64),
  isCover: false,
  sortOrder: 0,
  createdAt: new Date("2026-04-27"),
} as unknown as import("@prisma/client").OperatorPhoto;

// ── Mock helpers ──────────────────────────────────────────────────────────────

function postReq(url: string, body: unknown): Parameters<typeof presignPost>[0] {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as Parameters<typeof presignPost>[0];
}

function deleteReq(url: string): Parameters<typeof presignDelete>[0] {
  return new Request(url, { method: "DELETE" }) as Parameters<typeof presignDelete>[0];
}

function getReq(url: string): Parameters<typeof photosGet>[0] {
  return new Request(url, { method: "GET" }) as Parameters<typeof photosGet>[0];
}

// ── Setup ─────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockPrisma: Record<string, unknown> & { operatorPhoto: Record<string, ReturnType<typeof vi.fn>>; $transaction: ReturnType<typeof vi.fn> };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockStorage: Record<string, ReturnType<typeof vi.fn>>;

beforeEach(async () => {
  vi.clearAllMocks();

  vi.mocked(sessionLib.requireSession).mockResolvedValue(SESSION);
  vi.mocked(operatorRepo.findOperatorByUserId).mockResolvedValue(OPERATOR);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(auditLogger.logAuditEvent).mockResolvedValue(undefined as any);

  // Mock prisma
  const prismaMod = await import("@/lib/db/prisma");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mockPrisma = (prismaMod as any).prisma;
  mockPrisma.operatorPhoto = {
    count: vi.fn(),
    create: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  };
  mockPrisma.$transaction = vi.fn();

  // Mock storage
  const storageMod = await import("@/lib/storage");
  mockStorage = {
    getSignedUrl: vi.fn().mockResolvedValue("https://storage.example.com/signed"),
    verifyObject: vi.fn().mockResolvedValue({ exists: true, sizeBytes: 512000 }),
    delete: vi.fn().mockResolvedValue(undefined),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked((storageMod as any).getStorageProvider).mockReturnValue(mockStorage);
});

// ── presign POST: photo limit enforcement ─────────────────────────────────────

describe("POST /api/v1/storage/presign — photo limit", () => {
  const presignBody = {
    resourceType: "photo",
    contentType: "image/jpeg",
    sizeBytes: 512000,
  };

  it("allows presign when operator has 9 photos (below limit)", async () => {
    mockPrisma.operatorPhoto.count.mockResolvedValue(9);

    const res = await presignPost(postReq("http://localhost/api/v1/storage/presign", presignBody));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("key");
    expect(body).toHaveProperty("signedUrl");
    expect(mockPrisma.operatorPhoto.count).toHaveBeenCalledWith({
      where: { operatorId: OPERATOR.id },
    });
  });

  it("blocks presign when operator has exactly 10 photos (at limit)", async () => {
    mockPrisma.operatorPhoto.count.mockResolvedValue(10);

    const res = await presignPost(postReq("http://localhost/api/v1/storage/presign", presignBody));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/Photo limit reached/);
    // Critically: no signed URL was issued, so no file can reach storage
    expect(mockStorage.getSignedUrl).not.toHaveBeenCalled();
  });

  it("blocks presign when operator has 11 photos (over limit — defensive)", async () => {
    mockPrisma.operatorPhoto.count.mockResolvedValue(11);

    const res = await presignPost(postReq("http://localhost/api/v1/storage/presign", presignBody));

    expect(res.status).toBe(422);
  });

  it("allows presign for evidence regardless of photo count", async () => {
    // Evidence presign should not be gated by photo count
    const evidenceBody = {
      resourceType: "evidence",
      contentType: "application/pdf",
      sizeBytes: 1024000,
    };

    const res = await presignPost(postReq("http://localhost/api/v1/storage/presign", evidenceBody));

    // Should not call photo count for evidence
    expect(mockPrisma.operatorPhoto.count).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
  });

  it("regression: allows single photo upload from 0", async () => {
    mockPrisma.operatorPhoto.count.mockResolvedValue(0);

    const res = await presignPost(postReq("http://localhost/api/v1/storage/presign", presignBody));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.key).toMatch(new RegExp(`^operators/${OPERATOR.id}/photos/.+\\.jpg$`));
  });
});

// ── presign DELETE: orphan cleanup ────────────────────────────────────────────

describe("DELETE /api/v1/storage/presign — orphan cleanup", () => {
  it("deletes orphaned photo (not in DB) from storage", async () => {
    mockPrisma.operatorPhoto.findFirst.mockResolvedValue(null); // not registered

    const res = await presignDelete(
      deleteReq(`http://localhost/api/v1/storage/presign?key=${encodeURIComponent(PHOTO_KEY)}`)
    );

    expect(res.status).toBe(204);
    expect(mockStorage.delete).toHaveBeenCalledWith(PHOTO_KEY, "public");
  });

  it("rejects cleanup when key is registered in DB (409)", async () => {
    mockPrisma.operatorPhoto.findFirst.mockResolvedValue({ id: "photo-1" });

    const res = await presignDelete(
      deleteReq(`http://localhost/api/v1/storage/presign?key=${encodeURIComponent(PHOTO_KEY)}`)
    );

    expect(res.status).toBe(409);
    expect(mockStorage.delete).not.toHaveBeenCalled();
  });

  it("rejects cleanup for evidence keys (wrong pattern)", async () => {
    const evidenceKey = `operators/${OPERATOR.id}/evidence/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.pdf`;

    const res = await presignDelete(
      deleteReq(`http://localhost/api/v1/storage/presign?key=${encodeURIComponent(evidenceKey)}`)
    );

    expect(res.status).toBe(400);
  });

  it("rejects cleanup for keys belonging to a different operator", async () => {
    // Must use alphanumeric ID to pass key pattern validation before reaching ownership check
    const foreignKey = "operators/cforeign0000000000000000/photos/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.jpg";

    const res = await presignDelete(
      deleteReq(`http://localhost/api/v1/storage/presign?key=${encodeURIComponent(foreignKey)}`)
    );

    expect(res.status).toBe(403);
  });
});

// ── photos POST: confirm + limit enforcement ──────────────────────────────────

describe("POST /api/v1/operator/photos — confirm", () => {
  const confirmBody = {
    key: PHOTO_KEY,
    fileName: "test.jpg",
    mimeType: "image/jpeg",
    sizeBytes: 512000,
    checksum: "a".repeat(64),
  };

  it("regression: creates photo record when below limit", async () => {
    mockPrisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const txClient = {
        operatorPhoto: {
          count: vi.fn().mockResolvedValue(0),
          create: vi.fn().mockResolvedValue({ ...PHOTO_RECORD, id: "photo-new" }),
        },
      };
      return fn(txClient);
    });

    const res = await photosPost(postReq("http://localhost/api/v1/operator/photos", confirmBody));

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.id).toBe("photo-new");
    expect(body.storageKey).toBe(PHOTO_KEY);
  });

  it("rejects confirm at limit (422) — DB-level safety net", async () => {
    mockPrisma.$transaction.mockImplementation(async () => {
      throw Object.assign(new Error("PHOTO_LIMIT"), { code: "PHOTO_LIMIT" });
    });

    const res = await photosPost(postReq("http://localhost/api/v1/operator/photos", confirmBody));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/Photo limit reached/);
  });

  it("rejects confirm when object not found in storage (422)", async () => {
    mockStorage.verifyObject.mockResolvedValue({ exists: false, sizeBytes: null });

    const res = await photosPost(postReq("http://localhost/api/v1/operator/photos", confirmBody));

    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toMatch(/not found in storage/i);
  });
});

// ── photos GET: unconditional sync ────────────────────────────────────────────

describe("GET /api/v1/operator/photos — hydration", () => {
  it("returns all photos when operator has 10", async () => {
    const photos = Array.from({ length: 10 }, (_, i) => ({
      id: `photo${i}`,
      storageKey: `operators/${OPERATOR.id}/photos/photo${i}.jpg`,
      fileName: `photo-${i}.jpg`,
      mimeType: "image/jpeg",
      sizeBytes: 512000,
      isCover: i === 0,
      sortOrder: i,
      createdAt: new Date(),
    }));

    mockPrisma.operatorPhoto.findMany.mockResolvedValue(photos);

    const res = await photosGet(getReq("http://localhost/api/v1/operator/photos"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(10);
    expect(body[0].isCover).toBe(true);
    expect(body[0]).toHaveProperty("signedUrl");
  });

  it("returns empty array when operator has 0 photos", async () => {
    mockPrisma.operatorPhoto.findMany.mockResolvedValue([]);

    const res = await photosGet(getReq("http://localhost/api/v1/operator/photos"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("omits photos whose storage object is missing (orphan filter)", async () => {
    const photos = [
      { id: "photo-ok", storageKey: `operators/${OPERATOR.id}/photos/ok.jpg`, fileName: "ok.jpg", mimeType: "image/jpeg", sizeBytes: 512000, isCover: true, sortOrder: 0, createdAt: new Date() },
      { id: "photo-missing", storageKey: `operators/${OPERATOR.id}/photos/missing.jpg`, fileName: "missing.jpg", mimeType: "image/jpeg", sizeBytes: 512000, isCover: false, sortOrder: 1, createdAt: new Date() },
    ];
    mockPrisma.operatorPhoto.findMany.mockResolvedValue(photos);

    mockStorage.verifyObject
      .mockResolvedValueOnce({ exists: true, sizeBytes: 512000 })  // photo-ok
      .mockResolvedValueOnce({ exists: false, sizeBytes: null });   // photo-missing

    const res = await photosGet(getReq("http://localhost/api/v1/operator/photos"));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0].id).toBe("photo-ok");
  });
});

// ── onboarding step validation ────────────────────────────────────────────────

describe("photos step validator", () => {
  it("passes when photoRefs has at least 1 entry", async () => {
    const { validateStep } = await import("@/lib/onboarding/onboarding-steps");
    expect(
      validateStep("photos", {
        photoRefs: [{ id: "p1", url: "k", storageKey: "k", isCover: true }],
      })
    ).toBe(true);
  });

  it("fails when photoRefs is empty", async () => {
    const { validateStep } = await import("@/lib/onboarding/onboarding-steps");
    expect(validateStep("photos", { photoRefs: [] })).toBe(false);
  });

  it("fails when photoRefs is undefined (fresh draft)", async () => {
    const { validateStep } = await import("@/lib/onboarding/onboarding-steps");
    expect(validateStep("photos", {})).toBe(false);
  });
});
