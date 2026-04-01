/**
 * Template registry.
 *
 * Each exported function renders a template to { html, text, subject }.
 * Callers pass strongly-typed props — the renderer handles the
 * React → HTML conversion internally.
 *
 * Usage:
 *   const { html, subject } = await renderVerifyEmail({ verifyUrl, recipientName })
 *   await sendEmail({ to, userId, type: 'email_verification', subject, html })
 */

import { render } from "@react-email/render";
import { createElement } from "react";

import { VerifyEmailTemplate } from "./auth/verify-email";
import { ResetPasswordTemplate } from "./auth/reset-password";
import { WelcomeEmailTemplate } from "./auth/welcome";
import { InvitationEmailTemplate } from "./auth/invitation";
import { AssessmentSubmittedTemplate } from "./product/assessment-submitted";
import { EvidenceStatusTemplate } from "./product/evidence-status";
import { ScoreUpdatedTemplate } from "./product/score-updated";
import { ReminderEmailTemplate } from "./product/reminder";
import { AdminNewOperatorTemplate } from "./admin/new-operator";

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
} from "../types";

interface RenderedEmail {
  html: string;
  subject: string;
}

// ── Auth templates ────────────────────────────────────────────────────────────

export async function renderVerifyEmail(
  props: VerifyEmailProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(VerifyEmailTemplate, props)),
    subject: "Confirm your email address — TRT Platform",
  };
}

export async function renderResetPassword(
  props: ResetPasswordProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(ResetPasswordTemplate, props)),
    subject: "Reset your password — TRT Platform",
  };
}

export async function renderWelcome(
  props: WelcomeEmailProps
): Promise<RenderedEmail> {
  const roleLabel =
    props.role === "operator"
      ? "operator"
      : props.role === "traveler"
        ? "traveler"
        : "partner";
  return {
    html: await render(createElement(WelcomeEmailTemplate, props)),
    subject: `Welcome to TRT Platform — your ${roleLabel} account is ready`,
  };
}

export async function renderInvitation(
  props: InvitationEmailProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(InvitationEmailTemplate, props)),
    subject: `${props.invitedBy} invited you to join TRT Platform`,
  };
}

// ── Product templates ─────────────────────────────────────────────────────────

export async function renderAssessmentSubmitted(
  props: AssessmentSubmittedProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(AssessmentSubmittedTemplate, props)),
    subject: `Assessment Cycle ${props.assessmentCycle} submitted — TRT Platform`,
  };
}

export async function renderEvidenceStatus(
  props: EvidenceStatusProps
): Promise<RenderedEmail> {
  const verb = props.status === "approved" ? "approved" : "rejected";
  return {
    html: await render(createElement(EvidenceStatusTemplate, props)),
    subject: `Evidence ${verb}: ${props.indicatorId} — TRT Platform`,
  };
}

export async function renderScoreUpdated(
  props: ScoreUpdatedProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(ScoreUpdatedTemplate, props)),
    subject: `Your GPS score is published — TRT Platform`,
  };
}

export async function renderReminder(
  props: ReminderEmailProps
): Promise<RenderedEmail> {
  const subjectMap = {
    incomplete_onboarding: "Complete your onboarding — TRT Platform",
    missing_evidence: "Evidence reminder — TRT Platform",
    forward_commitment: "Forward Commitment deadline — TRT Platform",
  };
  return {
    html: await render(createElement(ReminderEmailTemplate, props)),
    subject: subjectMap[props.reminderType],
  };
}

// ── Admin templates ───────────────────────────────────────────────────────────

export async function renderAdminNewOperator(
  props: AdminNewOperatorProps
): Promise<RenderedEmail> {
  return {
    html: await render(createElement(AdminNewOperatorTemplate, props)),
    subject: `New operator registered: ${props.operatorName} — TRT Platform`,
  };
}
