/**
 * Email system public API.
 *
 * High-level functions that compose: render template → send → log.
 * Callers import from here, not from individual internal modules.
 *
 * Pattern:
 *   import { sendVerifyEmail } from "@/lib/email"
 *   await sendVerifyEmail({ to, userId, name, verifyUrl })
 */

import { sendEmail } from "./send-email";
import {
  renderVerifyEmail,
  renderResetPassword,
  renderWelcome,
  renderInvitation,
  renderAssessmentSubmitted,
  renderEvidenceStatus,
  renderScoreUpdated,
  renderReminder,
  renderAdminNewOperator,
} from "./templates";
import type {
  VerifyEmailProps,
  ResetPasswordProps,
  WelcomeEmailProps,
  InvitationEmailProps,
  AssessmentSubmittedProps,
  EvidenceStatusProps,
  ScoreUpdatedProps,
  ReminderEmailProps,
  AdminNewOperatorProps,
  SendEmailResult,
} from "./types";

// ── Auth emails ───────────────────────────────────────────────────────────────

export async function sendVerifyEmail(
  params: { to: string; userId?: string } & VerifyEmailProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderVerifyEmail(props);
  return sendEmail({ to, userId, type: "email_verification", subject, html });
}

export async function sendResetPasswordEmail(
  params: { to: string; userId?: string } & ResetPasswordProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderResetPassword(props);
  return sendEmail({ to, userId, type: "password_reset", subject, html });
}

export async function sendWelcomeEmail(
  params: { to: string; userId?: string } & WelcomeEmailProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderWelcome(props);
  return sendEmail({ to, userId, type: "welcome", subject, html });
}

export async function sendPasswordChangedEmail(params: {
  to: string;
  userId?: string;
  recipientName?: string;
}): Promise<SendEmailResult> {
  const { to, userId, recipientName } = params;
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const html = `
    <p>${greeting}</p>
    <p>The password on your TRT Platform account was successfully changed.</p>
    <p>If you did not make this change, please contact support immediately.</p>
  `;
  return sendEmail({
    to,
    userId,
    type: "password_changed",
    subject: "Your password was changed — TRT Platform",
    html,
  });
}

export async function sendInvitationEmail(
  params: { to: string; userId?: string } & InvitationEmailProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderInvitation(props);
  return sendEmail({ to, userId, type: "invitation", subject, html });
}

// ── Product emails ────────────────────────────────────────────────────────────

export async function sendAssessmentSubmittedEmail(
  params: { to: string; userId?: string } & AssessmentSubmittedProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderAssessmentSubmitted(props);
  return sendEmail({ to, userId, type: "assessment_submitted", subject, html, metadata: { operatorName: props.operatorName } });
}

export async function sendEvidenceStatusEmail(
  params: { to: string; userId?: string } & EvidenceStatusProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderEvidenceStatus(props);
  const type = props.status === "approved" ? "evidence_approved" : "evidence_rejected";
  return sendEmail({ to, userId, type, subject, html, metadata: { indicatorId: props.indicatorId } });
}

export async function sendScoreUpdatedEmail(
  params: { to: string; userId?: string } & ScoreUpdatedProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderScoreUpdated(props);
  return sendEmail({ to, userId, type: "score_updated", subject, html, metadata: { gpsBand: props.gpsBand, gpsTotal: props.gpsTotal } });
}

export async function sendReminderEmail(
  params: { to: string; userId?: string } & ReminderEmailProps
): Promise<SendEmailResult> {
  const { to, userId, ...props } = params;
  const { html, subject } = await renderReminder(props);
  const typeMap = {
    incomplete_onboarding: "reminder_incomplete_onboarding",
    missing_evidence: "reminder_missing_evidence",
    forward_commitment: "reminder_forward_commitment",
  } as const;
  return sendEmail({ to, userId, type: typeMap[props.reminderType], subject, html });
}

// ── Admin emails ──────────────────────────────────────────────────────────────

export async function sendAdminNewOperatorEmail(
  params: { to: string } & AdminNewOperatorProps
): Promise<SendEmailResult> {
  const { to, ...props } = params;
  const { html, subject } = await renderAdminNewOperator(props);
  return sendEmail({ to, type: "admin_new_operator_registered", subject, html, metadata: { operatorEmail: props.operatorEmail } });
}

// Re-export core for advanced usage
export { sendEmail } from "./send-email";
export type { SendEmailResult, SendEmailOptions } from "./types";
