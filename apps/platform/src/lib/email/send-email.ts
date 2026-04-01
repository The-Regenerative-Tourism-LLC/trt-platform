/**
 * Core email dispatch function.
 *
 * Responsibilities:
 *  1. Check user notification preferences (for non-mandatory email types)
 *  2. Delegate to the active provider (Resend)
 *  3. Write an audit log entry regardless of outcome
 *
 * This function NEVER throws. Errors are logged and returned in the result
 * so callers can decide whether to surface them to users.
 */

import { sendViaResend } from "./providers/resend";
import { createEmailLog } from "./log";
import type { SendEmailOptions, SendEmailResult } from "./types";

// Email types that are mandatory and bypass preference checks.
// Users cannot opt out of these.
const MANDATORY_EMAIL_TYPES = new Set([
  "email_verification",
  "password_reset",
  "password_changed",
  "welcome",
  "invitation",
  "new_login_alert",
  "partner_invitation",
  "admin_new_operator_registered",
  "admin_assessment_submitted",
  "admin_evidence_requires_review",
  "admin_system_error",
]);

export async function sendEmail(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const { to, userId, type, subject, html, text, replyTo, metadata } = options;

  // Skip preference check for mandatory emails
  if (!MANDATORY_EMAIL_TYPES.has(type) && userId) {
    const shouldSend = await checkNotificationPreference(userId, type);
    if (!shouldSend) {
      return { success: true }; // Silently suppressed per user preference
    }
  }

  let result: SendEmailResult;

  try {
    result = await sendViaResend({ to, userId, type, subject, html, text, replyTo, metadata });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    result = { success: false, error: errorMessage };
  }

  // Persist audit log entry — fire and forget, never blocks send
  void createEmailLog({
    userId,
    email: to,
    type,
    subject,
    status: result.success ? "sent" : "failed",
    providerId: result.providerId,
    sentAt: result.success ? new Date() : undefined,
    errorMessage: result.error,
    metadata,
  });

  if (!result.success) {
    console.error(
      `[sendEmail] Failed to send ${type} to ${to}: ${result.error}`
    );
  }

  return result;
}

// ── Preference resolution ────────────────────────────────────────────────────

async function checkNotificationPreference(
  userId: string,
  type: string
): Promise<boolean> {
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (!pref) return true; // No preference row = all enabled (default)

    const preferenceMap: Record<string, boolean> = {
      assessment_submitted: pref.assessmentUpdates,
      onboarding_completed: pref.assessmentUpdates,
      evidence_uploaded: pref.evidenceUpdates,
      evidence_approved: pref.evidenceUpdates,
      evidence_rejected: pref.evidenceUpdates,
      score_updated: pref.scoreUpdates,
      report_ready: pref.reportReady,
      reminder_incomplete_onboarding: pref.onboardingReminders,
      reminder_missing_evidence: pref.evidenceReminders,
      reminder_forward_commitment: pref.commitmentReminders,
      weekly_summary: pref.weeklySummary,
      monthly_report: pref.monthlyReport,
    };

    return preferenceMap[type] ?? true;
  } catch {
    return true; // On DB error, default to sending
  }
}
