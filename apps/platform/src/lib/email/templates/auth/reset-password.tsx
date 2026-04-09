import * as React from "react";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { ResetPasswordProps } from "../../types";

export function ResetPasswordTemplate({
  recipientName,
  resetUrl,
  expiresInMinutes = 60,
  previewText = "Reset your TRT Platform password.",
}: ResetPasswordProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const expiryText =
    expiresInMinutes >= 60
      ? `${expiresInMinutes / 60} hour${expiresInMinutes / 60 > 1 ? "s" : ""}`
      : `${expiresInMinutes} minutes`;

  return (
    <BaseLayout preview={previewText}>
      <EmailHeading>Reset your password</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        We received a request to reset the password for your TRT Platform
        account. Click the button below to choose a new password.
      </EmailBody>

      <EmailButton href={resetUrl}>Reset password</EmailButton>

      <EmailCallout>
        This link expires in {expiryText} and can only be used once. If you did
        not request a password reset, you can safely ignore this email — your
        password will not be changed.
      </EmailCallout>

      <EmailBody>
        If the button above does not work, copy and paste the following URL into
        your browser:
      </EmailBody>

      <EmailBody>
        <a href={resetUrl} style={{ color: "#000000", wordBreak: "break-all" }}>
          {resetUrl}
        </a>
      </EmailBody>

      <EmailBody>
        For security, this request was received from a web browser. If you did
        not make this request, please secure your account immediately by
        contacting support.
      </EmailBody>
    </BaseLayout>
  );
}

export default ResetPasswordTemplate;
