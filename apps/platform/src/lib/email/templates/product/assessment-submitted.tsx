import * as React from "react";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { AssessmentSubmittedProps } from "../../types";

export function AssessmentSubmittedTemplate({
  recipientName,
  operatorName,
  assessmentCycle,
  dashboardUrl,
  previewText = "Your assessment has been submitted for review.",
}: AssessmentSubmittedProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Assessment submitted</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        Your Cycle {assessmentCycle} assessment for{" "}
        <strong>{operatorName}</strong> has been successfully submitted. Our
        team will review your evidence submissions and compute your GPS score.
      </EmailBody>

      <EmailBody>
        You will receive a notification as each piece of evidence is reviewed.
        Once all evidence is processed, your score will be published to your
        public profile.
      </EmailBody>

      <EmailButton href={dashboardUrl}>View assessment status</EmailButton>

      <EmailCallout>
        The review process typically takes 5–10 business days depending on the
        number and complexity of evidence submissions. You can track progress in
        real time on your dashboard.
      </EmailCallout>
    </BaseLayout>
  );
}

export default AssessmentSubmittedTemplate;
