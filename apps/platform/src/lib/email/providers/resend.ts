/**
 * Resend email provider.
 *
 * Thin adapter around the Resend SDK. All provider-specific logic
 * is isolated here — swapping providers means updating only this file.
 */

import { Resend } from "resend";
import type { SendEmailOptions, SendEmailResult } from "../types";

const FROM_ADDRESS =
  process.env.EMAIL_FROM ?? "TRT Platform <noreply@mail.trtplatform.com>";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error(
        "RESEND_API_KEY is not configured. " +
          "Add it to your .env file or Railway environment variables."
      );
    }
    _resend = new Resend(apiKey);
  }
  return _resend;
}

export async function sendViaResend(
  options: SendEmailOptions
): Promise<SendEmailResult> {
  const resend = getResend();

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
    replyTo: options.replyTo,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, providerId: data?.id };
}
