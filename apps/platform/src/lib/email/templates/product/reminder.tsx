import * as React from "react";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { ReminderEmailProps } from "../../types";

const REMINDER_COPY = {
  incomplete_onboarding: {
    subject: "Complete your onboarding to get certified",
    headline: "Your onboarding is incomplete",
    body: "You started the TRT Platform onboarding process but haven't finished yet. Complete your profile to unlock the assessment and begin working toward your regenerative certification.",
    cta: "Continue onboarding",
    callout:
      "Onboarding takes approximately 30 minutes. You can save your progress and return at any time.",
  },
  missing_evidence: {
    subject: "Evidence submissions are pending for your assessment",
    headline: "Evidence submission reminder",
    body: "Your current assessment cycle has indicators without uploaded evidence. Missing evidence will reduce your GPS score. Upload your supporting documents to ensure a complete submission.",
    cta: "Upload evidence",
    callout:
      "Evidence submitted before the deadline will be reviewed in the current cycle. Late submissions carry over to the next cycle.",
  },
  forward_commitment: {
    subject: "Forward Commitment deadline approaching",
    headline: "Your Forward Commitment deadline is approaching",
    body: "Your P3 Forward Commitment is due for activation. Failing to activate your commitment before the deadline will affect your Pillar 3 score in the next assessment cycle.",
    cta: "Manage commitment",
    callout:
      "Contact your assigned institution partner if you need to discuss the commitment timeline or scope.",
  },
} as const;

export function ReminderEmailTemplate({
  recipientName,
  operatorName,
  reminderType,
  ctaUrl,
  daysRemaining,
  previewText,
}: ReminderEmailProps) {
  const copy = REMINDER_COPY[reminderType];
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const preview = previewText ?? copy.subject;

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>{copy.headline}</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      {daysRemaining !== undefined && (
        <EmailBody>
          <strong>
            {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} remaining
          </strong>{" "}
          for <strong>{operatorName}</strong>.
        </EmailBody>
      )}

      <EmailBody>{copy.body}</EmailBody>

      <EmailButton href={ctaUrl}>{copy.cta}</EmailButton>

      <EmailCallout>{copy.callout}</EmailCallout>

      <EmailBody>
        To manage which reminder emails you receive, visit your{" "}
        <a
          href="https://app.trtplatform.com/email-preferences"
          style={{ color: "#1a6b3c" }}
        >
          email preferences
        </a>
        .
      </EmailBody>
    </BaseLayout>
  );
}

export default ReminderEmailTemplate;
