/**
 * Email system types.
 *
 * EmailType mirrors the Prisma enum — both must stay in sync.
 * Using a TypeScript const enum here gives us compile-time safety
 * without importing Prisma types into every consumer.
 */

import type { EmailType, EmailStatus, Prisma } from "@prisma/client";
export type { EmailType, EmailStatus };
export type { Prisma };

// ── Payload shapes ───────────────────────────────────────────────────────────

export interface SendEmailOptions {
  /** Recipient email address */
  to: string;
  /** Optional user ID for logging correlation */
  userId?: string;
  /** Email type — used for logging and preference checks */
  type: EmailType;
  /** Subject line */
  subject: string;
  /** Rendered HTML body */
  html: string;
  /** Plain-text fallback */
  text?: string;
  /** Optional: override reply-to address */
  replyTo?: string;
  /** Arbitrary metadata persisted in EmailLog for debugging */
  metadata?: Prisma.InputJsonValue;
}

export interface SendEmailResult {
  success: boolean;
  providerId?: string;
  error?: string;
}

// ── Template prop contracts ──────────────────────────────────────────────────

export interface BaseEmailProps {
  recipientName?: string;
  previewText?: string;
}

export interface VerifyEmailProps extends BaseEmailProps {
  verifyUrl: string;
  expiresInHours?: number;
}

export interface ResetPasswordProps extends BaseEmailProps {
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface WelcomeEmailProps extends BaseEmailProps {
  role: "operator" | "traveler" | "institution_partner";
  dashboardUrl: string;
}

export interface InvitationEmailProps extends BaseEmailProps {
  invitedBy: string;
  inviteUrl: string;
  role: string;
  expiresInDays?: number;
}

export interface AssessmentSubmittedProps extends BaseEmailProps {
  operatorName: string;
  assessmentCycle: number;
  dashboardUrl: string;
}

export interface EvidenceStatusProps extends BaseEmailProps {
  operatorName: string;
  indicatorId: string;
  status: "approved" | "rejected";
  reason?: string;
  dashboardUrl: string;
}

export interface ScoreUpdatedProps extends BaseEmailProps {
  operatorName: string;
  gpsBand: string;
  gpsTotal: number;
  dashboardUrl: string;
}

export interface ReminderEmailProps extends BaseEmailProps {
  operatorName: string;
  reminderType:
    | "incomplete_onboarding"
    | "missing_evidence"
    | "forward_commitment";
  ctaUrl: string;
  daysRemaining?: number;
}

export interface AdminNewOperatorProps extends BaseEmailProps {
  operatorName: string;
  operatorEmail: string;
  role: string;
  adminUrl: string;
}
