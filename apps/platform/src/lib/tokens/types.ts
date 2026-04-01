import type { TokenType } from "@prisma/client";
export type { TokenType };

export const TOKEN_TTL_SECONDS = {
  email_verification: 60 * 60 * 24,     // 24 hours
  password_reset: 60 * 60,              // 1 hour
  invitation: 60 * 60 * 24 * 7,         // 7 days
  partner_invitation: 60 * 60 * 24 * 14, // 14 days
} as const satisfies Record<TokenType, number>;

export interface CreateTokenResult {
  /** Raw token — include in the email link, never log or store */
  rawToken: string;
  expiresAt: Date;
}

export interface VerifyTokenResult {
  valid: true;
  tokenId: string;
  userId?: string;
  email: string;
  metadata?: Record<string, unknown> | null;
}

export interface InvalidTokenResult {
  valid: false;
  reason: "not_found" | "expired" | "already_used";
}

export type TokenVerificationResult = VerifyTokenResult | InvalidTokenResult;
