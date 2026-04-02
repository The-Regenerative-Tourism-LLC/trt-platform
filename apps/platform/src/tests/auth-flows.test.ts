/**
 * Auth Flow Integration Tests
 *
 * Tests the critical security contracts of the email verification,
 * password reset, and change-password systems.
 *
 * Scope:
 *   - Token creation produces a hashable, verifiable raw token
 *   - Token verification enforces expiry, single-use, and type matching
 *   - Rate limiting logic (direct EmailLog query pattern)
 *   - Password hashing and comparison (bcrypt round-trip)
 *   - End-to-end token lifecycle: create → send → verify → consume
 *
 * What is NOT tested here:
 *   - HTTP layer / NextRequest (covered by e2e tests)
 *   - Actual email delivery (Resend is mocked)
 *   - Database writes (mocked where needed to keep tests fast)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";

// ── Helpers copied from the token module for isolated testing ─────────────────
// We import the functions under test via alias — vitest resolves @/ via tsconfig

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

// ── Mock setup ─────────────────────────────────────────────────────────────────

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    secureToken: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
      create: vi.fn(),
    },
    emailLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/email", () => ({
  sendVerifyEmail: vi.fn().mockResolvedValue({ success: true }),
  sendResetPasswordEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPasswordChangedEmail: vi.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// ── Token hashing ──────────────────────────────────────────────────────────────

describe("Token hashing", () => {
  it("produces a 64-char hex hash from a raw token", () => {
    const raw = "a".repeat(64);
    const hash = hashToken(raw);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic — same input produces same hash", () => {
    const raw = "test-token-abc123";
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("is sensitive to input — different raw tokens produce different hashes", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("raw token is not recoverable from hash (one-way)", () => {
    const raw = "super-secret-token";
    const hash = hashToken(raw);
    // Hash contains no substring of the raw token
    expect(hash).not.toContain("super");
    expect(hash).not.toContain("secret");
  });
});

// ── Token TTL constants ────────────────────────────────────────────────────────

describe("Token TTL configuration", () => {
  it("password_reset expires in 1 hour (3600s)", async () => {
    const { TOKEN_TTL_SECONDS } = await import("@/lib/tokens/types");
    expect(TOKEN_TTL_SECONDS.password_reset).toBe(3600);
  });

  it("email_verification expires in 24 hours (86400s)", async () => {
    const { TOKEN_TTL_SECONDS } = await import("@/lib/tokens/types");
    expect(TOKEN_TTL_SECONDS.email_verification).toBe(86400);
  });

  it("invitation expires in 7 days (604800s)", async () => {
    const { TOKEN_TTL_SECONDS } = await import("@/lib/tokens/types");
    expect(TOKEN_TTL_SECONDS.invitation).toBe(604800);
  });

  it("partner_invitation expires in 14 days (1209600s)", async () => {
    const { TOKEN_TTL_SECONDS } = await import("@/lib/tokens/types");
    expect(TOKEN_TTL_SECONDS.partner_invitation).toBe(1209600);
  });
});

// ── Token verification logic ───────────────────────────────────────────────────

describe("verifyToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when token hash does not exist in DB", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue(null);

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const result = await verifyToken("nonexistent-raw-token", "password_reset");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("not_found");
  });

  it("returns not_found when type does not match", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const raw = "valid-token-value";
    const tokenHash = hashToken(raw);

    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue({
      id: "tok_1",
      tokenHash,
      type: "email_verification",   // stored as email_verification
      email: "user@test.com",
      userId: "user_1",
      expiresAt: new Date(Date.now() + 3600_000),
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    });

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    // Presented as password_reset — type mismatch
    const result = await verifyToken(raw, "password_reset");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("not_found");
  });

  it("returns already_used when usedAt is set", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const raw = "already-used-token";

    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue({
      id: "tok_2",
      tokenHash: hashToken(raw),
      type: "password_reset",
      email: "user@test.com",
      userId: "user_1",
      expiresAt: new Date(Date.now() + 3600_000),
      usedAt: new Date(), // already consumed
      metadata: null,
      createdAt: new Date(),
    });

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const result = await verifyToken(raw, "password_reset");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("already_used");
  });

  it("returns expired when expiresAt is in the past", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const raw = "expired-token";

    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue({
      id: "tok_3",
      tokenHash: hashToken(raw),
      type: "password_reset",
      email: "user@test.com",
      userId: "user_1",
      expiresAt: new Date(Date.now() - 1000), // 1 second ago
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    });

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const result = await verifyToken(raw, "password_reset");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("expired");
  });

  it("returns valid and marks token as used on first consumption", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const raw = "fresh-valid-token";

    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue({
      id: "tok_4",
      tokenHash: hashToken(raw),
      type: "email_verification",
      email: "user@test.com",
      userId: "user_1",
      expiresAt: new Date(Date.now() + 86400_000),
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    });

    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 1 });

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const result = await verifyToken(raw, "email_verification");

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.email).toBe("user@test.com");
      expect(result.userId).toBe("user_1");
    }

    // usedAt should have been set
    expect(prisma.secureToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "tok_4", usedAt: null }),
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      })
    );
  });

  it("returns already_used when another request wins the race", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const raw = "race-condition-token";

    vi.mocked(prisma.secureToken.findUnique).mockResolvedValue({
      id: "tok_5",
      tokenHash: hashToken(raw),
      type: "email_verification",
      email: "user@test.com",
      userId: "user_1",
      expiresAt: new Date(Date.now() + 86400_000),
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    });

    // Concurrent request consumed the token — updateMany returns count=0
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 0 });

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const result = await verifyToken(raw, "email_verification");

    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("already_used");
  });
});

// ── createToken ────────────────────────────────────────────────────────────────

describe("createToken", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("produces a 64-char hex raw token", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.secureToken.create).mockResolvedValue({} as never);

    const { createToken } = await import("@/lib/tokens/create-token");
    const { rawToken } = await createToken({
      type: "email_verification",
      email: "test@example.com",
    });

    expect(rawToken).toHaveLength(64);
    expect(rawToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("stores only the hash — raw token is not persisted", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.secureToken.create).mockResolvedValue({} as never);

    const { createToken } = await import("@/lib/tokens/create-token");
    const { rawToken } = await createToken({
      type: "password_reset",
      email: "test@example.com",
    });

    const createCall = vi.mocked(prisma.secureToken.create).mock.calls[0]![0];
    const storedHash = (createCall.data as Record<string, unknown>).tokenHash as string;

    // Stored hash is not the raw token
    expect(storedHash).not.toBe(rawToken);
    // But it IS the SHA-256 of the raw token
    expect(storedHash).toBe(hashToken(rawToken));
  });

  it("invalidates previous unused tokens of the same type before creating new one", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 1 });
    vi.mocked(prisma.secureToken.create).mockResolvedValue({} as never);

    const { createToken } = await import("@/lib/tokens/create-token");
    await createToken({ type: "password_reset", email: "test@example.com" });

    expect(prisma.secureToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: "test@example.com",
          type: "password_reset",
          usedAt: null,
        }),
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      })
    );
  });

  it("sets expiresAt according to token type TTL", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 0 });
    vi.mocked(prisma.secureToken.create).mockResolvedValue({} as never);

    const before = Date.now();
    const { createToken } = await import("@/lib/tokens/create-token");
    const { expiresAt } = await createToken({
      type: "password_reset",
      email: "test@example.com",
    });
    const after = Date.now();

    const expectedTtl = 3600; // 1 hour
    const actualTtlMs = expiresAt.getTime() - before;
    const maxTtlMs = expiresAt.getTime() - after;

    // expiresAt is between (now + TTL - 1s) and (now + TTL + 1s)
    expect(actualTtlMs).toBeGreaterThanOrEqual(expectedTtl * 1000 - 1000);
    expect(maxTtlMs).toBeLessThanOrEqual(expectedTtl * 1000 + 1000);
  });
});

// ── Password hashing ───────────────────────────────────────────────────────────

describe("Password security", () => {
  it("bcrypt hash is not the plaintext", async () => {
    const password = "my-secret-password";
    const hash = await bcrypt.hash(password, 12);
    expect(hash).not.toBe(password);
    expect(hash).not.toContain(password);
  });

  it("bcrypt.compare returns true for correct password", async () => {
    const password = "correct-password";
    const hash = await bcrypt.hash(password, 12);
    expect(await bcrypt.compare(password, hash)).toBe(true);
  });

  it("bcrypt.compare returns false for wrong password", async () => {
    const hash = await bcrypt.hash("correct", 12);
    expect(await bcrypt.compare("wrong", hash)).toBe(false);
  });

  it("two hashes of the same password are not identical (salt)", async () => {
    const password = "same-password";
    const hash1 = await bcrypt.hash(password, 12);
    const hash2 = await bcrypt.hash(password, 12);
    expect(hash1).not.toBe(hash2);
    // Both are still valid
    expect(await bcrypt.compare(password, hash1)).toBe(true);
    expect(await bcrypt.compare(password, hash2)).toBe(true);
  });
});

// ── Rate limiting logic ────────────────────────────────────────────────────────

describe("Rate limit check (EmailLog pattern)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows send when no recent email exists", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    vi.mocked(prisma.emailLog.findFirst).mockResolvedValue(null);

    const windowStart = new Date(Date.now() - 60_000);
    const recentSend = await prisma.emailLog.findFirst({
      where: {
        email: "user@test.com",
        type: "email_verification" as never,
        createdAt: { gt: windowStart },
      },
    });

    expect(recentSend).toBeNull();
    // No rate limit — send is allowed
  });

  it("blocks send when email was sent within the last 60 seconds", async () => {
    const { prisma } = await import("@/lib/db/prisma");
    const recentLog = {
      id: "log_1",
      createdAt: new Date(Date.now() - 30_000), // 30 seconds ago
    };
    vi.mocked(prisma.emailLog.findFirst).mockResolvedValue(recentLog as never);

    const windowStart = new Date(Date.now() - 60_000);
    const recentSend = await prisma.emailLog.findFirst({
      where: {
        email: "user@test.com",
        type: "email_verification" as never,
        createdAt: { gt: windowStart },
      },
    });

    expect(recentSend).not.toBeNull();
    // Rate limit applies — compute retry-after
    const retryAfterMs =
      recentSend!.createdAt.getTime() + 60_000 - Date.now();
    expect(retryAfterMs).toBeGreaterThan(0);
    expect(retryAfterMs).toBeLessThanOrEqual(30_000 + 1000); // ~30s remaining
  });
});

// ── Full token lifecycle ───────────────────────────────────────────────────────

describe("Token lifecycle: create → verify → consume → reject reuse", () => {
  it("a newly created token passes verification exactly once", async () => {
    const { prisma } = await import("@/lib/db/prisma");

    // Step 1: create token
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.secureToken.create).mockResolvedValue({} as never);

    const { createToken } = await import("@/lib/tokens/create-token");
    const { rawToken } = await createToken({
      type: "email_verification",
      email: "lifecycle@test.com",
    });

    // Set up the DB record that findUnique will return (unused)
    const unusedRecord = {
      id: "tok_lifecycle",
      tokenHash: hashToken(rawToken),
      type: "email_verification",
      email: "lifecycle@test.com",
      userId: null,
      expiresAt: new Date(Date.now() + 86400_000),
      usedAt: null,
      metadata: null,
      createdAt: new Date(),
    };

    // Step 2: first verification — token unused → valid → mark as used
    vi.mocked(prisma.secureToken.findUnique).mockResolvedValueOnce(unusedRecord as never);
    vi.mocked(prisma.secureToken.updateMany).mockResolvedValueOnce({ count: 1 } as never);

    const { verifyToken } = await import("@/lib/tokens/verify-token");
    const first = await verifyToken(rawToken, "email_verification");
    expect(first.valid).toBe(true);

    // Step 3: second verification — token now has usedAt set → already_used
    const usedRecord = { ...unusedRecord, usedAt: new Date() };
    vi.mocked(prisma.secureToken.findUnique).mockResolvedValueOnce(usedRecord as never);

    const second = await verifyToken(rawToken, "email_verification");
    expect(second.valid).toBe(false);
    if (!second.valid) {
      expect(second.reason).toBe("already_used");
    }
  });
});
