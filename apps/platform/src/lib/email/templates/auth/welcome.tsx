import * as React from "react";
import { Text } from "@react-email/components";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { WelcomeEmailProps } from "../../types";

const ROLE_COPY: Record<
  WelcomeEmailProps["role"],
  { headline: string; description: string; cta: string }
> = {
  operator: {
    headline: "Your operator account is ready",
    description:
      "You can now begin your onboarding, submit your sustainability assessment, " +
      "and work toward earning your regenerative certification. " +
      "The process takes about 30 minutes.",
    cta: "Start onboarding",
  },
  traveler: {
    headline: "Your traveler passport is ready",
    description:
      "Discover verified regenerative operators, track your positive impact, " +
      "and earn badges as you explore the world more consciously.",
    cta: "Explore destinations",
  },
  institution_partner: {
    headline: "Welcome, institution partner",
    description:
      "Your partner account is configured. You can now review forward commitments " +
      "from operators and manage your conservation partnerships.",
    cta: "Go to dashboard",
  },
};

export function WelcomeEmailTemplate({
  recipientName,
  role,
  dashboardUrl,
  previewText,
}: WelcomeEmailProps) {
  const copy = ROLE_COPY[role];
  const greeting = recipientName ? `Welcome, ${recipientName}!` : "Welcome!";
  const preview = previewText ?? `${copy.headline} — TRT Platform`;

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>{greeting}</EmailHeading>

      <EmailBody>{copy.headline}</EmailBody>

      <EmailBody>{copy.description}</EmailBody>

      <EmailButton href={dashboardUrl}>{copy.cta}</EmailButton>

      <EmailCallout>
        TRT Platform certifies operators using the Green Passport Score (GPS)
        methodology — a rigorous, evidence-based framework across three pillars:
        Footprint, Local Economy, and Regeneration.
      </EmailCallout>

      <Text style={{ color: "#6b7280", fontSize: "14px", lineHeight: "1.5" }}>
        Questions? Reply to this email or visit our{" "}
        <a href="https://www.theregenerativetourism.com/methodology" style={{ color: "#000000" }}>
          methodology page
        </a>{" "}
        to learn how TRT scoring works.
      </Text>
    </BaseLayout>
  );
}

export default WelcomeEmailTemplate;
