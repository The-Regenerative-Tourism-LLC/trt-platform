/**
 * Secure token creation.
 *
 * Security model:
 *  - Raw token: 32 cryptographically random bytes → 64-char hex string.
 *    Returned once, embedded in the email URL. Never persisted.
 *  - Stored token: SHA-256(rawToken). Even if the DB is leaked, tokens
 *    cannot be reversed or reused without the original raw value.
 *  - Expiry enforced at both creation (expiresAt) and verification.
 *  - Soft single-use: usedAt is set on first consumption.
 */

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { TokenType, Prisma } from "@prisma/client";
import { TOKEN_TTL_SECONDS } from "./types";
import type { CreateTokenResult } from "./types";

export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

interface CreateTokenOptions {
  type: TokenType;
  email: string;
  userId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createToken(
  options: CreateTokenOptions
): Promise<CreateTokenResult> {
  const { type, email, userId, metadata } = options;

  // 1. Invalidate any existing unused tokens of the same type for this email.
  //    Prevents token accumulation and confusion when a user requests multiple times.
  await prisma.secureToken.updateMany({
    where: {
      email,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  // 2. Generate raw token and compute hash
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);

  const ttlSeconds = TOKEN_TTL_SECONDS[type];
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  // 3. Persist hashed token only
  await prisma.secureToken.create({
    data: {
      userId,
      tokenHash,
      type,
      email,
      expiresAt,
      metadata: metadata ?? undefined,
    },
  });

  return { rawToken, expiresAt };
}
