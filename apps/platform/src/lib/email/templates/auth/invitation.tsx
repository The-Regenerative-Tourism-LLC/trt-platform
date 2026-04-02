import * as React from "react";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { InvitationEmailProps } from "../../types";

export function InvitationEmailTemplate({
  recipientName,
  invitedBy,
  inviteUrl,
  role,
  expiresInDays = 7,
  previewText,
}: InvitationEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const preview =
    previewText ?? `${invitedBy} has invited you to join TRT Platform.`;

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>You have been invited to TRT Platform</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        <strong>{invitedBy}</strong> has invited you to join TRT Platform as a{" "}
        <strong>{role}</strong>. TRT Platform is a certification system for
        regenerative tourism operators.
      </EmailBody>

      <EmailButton href={inviteUrl}>Accept invitation</EmailButton>

      <EmailCallout>
        This invitation expires in {expiresInDays} day
        {expiresInDays > 1 ? "s" : ""}. If you were not expecting this
        invitation, you can safely ignore this email.
      </EmailCallout>

      <EmailBody>
        If the button above does not work, copy and paste the following URL into
        your browser:
      </EmailBody>

      <EmailBody>
        <a href={inviteUrl} style={{ color: "#1a6b3c", wordBreak: "break-all" }}>
          {inviteUrl}
        </a>
      </EmailBody>
    </BaseLayout>
  );
}

export default InvitationEmailTemplate;
