import * as React from "react";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { VerifyEmailProps } from "../../types";

export function VerifyEmailTemplate({
  recipientName,
  verifyUrl,
  expiresInHours = 24,
  previewText = "Confirm your email address to get started on TRT Platform.",
}: VerifyEmailProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Confirm your email address</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        Welcome to TRT Platform. To complete your registration and activate your
        account, please confirm your email address by clicking the button below.
      </EmailBody>

      <EmailButton href={verifyUrl}>Confirm email address</EmailButton>

      <EmailCallout>
        This link expires in {expiresInHours} hours. If you did not create an
        account, you can safely ignore this email.
      </EmailCallout>

      <EmailBody>
        If the button above does not work, copy and paste the following URL into
        your browser:
      </EmailBody>

      <EmailBody>
        <a href={verifyUrl} style={{ color: "#000000", wordBreak: "break-all" }}>
          {verifyUrl}
        </a>
      </EmailBody>
    </BaseLayout>
  );
}

export default VerifyEmailTemplate;
