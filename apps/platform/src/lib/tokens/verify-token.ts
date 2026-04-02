/**
 * Secure token verification and consumption.
 *
 * Verification is a two-phase operation:
 *  1. Look up the hashed token — reject if not found.
 *  2. Check expiry and usedAt — reject if expired or consumed.
 *  3. Mark as used atomically — enforces single-use guarantee.
 *
 * The raw token is NEVER stored, so this function accepts the raw token
 * from the URL, hashes it, and queries by hash.
 */

import { prisma } from "@/lib/db/prisma";
import type { TokenType } from "@prisma/client";
import { hashToken } from "./create-token";
import type { TokenVerificationResult } from "./types";

export async function verifyToken(
  rawToken: string,
  expectedType: TokenType
): Promise<TokenVerificationResult> {
  const tokenHash = hashToken(rawToken);

  const record = await prisma.secureToken.findUnique({
    where: { tokenHash },
  });

  if (!record || record.type !== expectedType) {
    return { valid: false, reason: "not_found" };
  }

  if (record.usedAt !== null) {
    return { valid: false, reason: "already_used" };
  }

  if (record.expiresAt < new Date()) {
    return { valid: false, reason: "expired" };
  }

  // Mark consumed — atomic update with a version guard on usedAt
  const updated = await prisma.secureToken.updateMany({
    where: { id: record.id, usedAt: null }, // guard against race condition
    data: { usedAt: new Date() },
  });

  if (updated.count === 0) {
    // Another request consumed the token between our read and update
    return { valid: false, reason: "already_used" };
  }

  return {
    valid: true,
    tokenId: record.id,
    userId: record.userId ?? undefined,
    email: record.email,
    metadata: record.metadata as Record<string, unknown> | null,
  };
}
