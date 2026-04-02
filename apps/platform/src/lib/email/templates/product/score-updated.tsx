import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailHeading,
} from "../base/layout";
import type { ScoreUpdatedProps } from "../../types";

const GPS_BAND_LABELS: Record<string, { label: string; color: string }> = {
  regenerative_leader: { label: "Regenerative Leader", color: "#15803d" },
  regenerative_practice: { label: "Regenerative Practice", color: "#16a34a" },
  advancing: { label: "Advancing", color: "#ca8a04" },
  developing: { label: "Developing", color: "#ea580c" },
  not_yet_published: { label: "Not Yet Published", color: "#6b7280" },
};

export function ScoreUpdatedTemplate({
  recipientName,
  operatorName,
  gpsBand,
  gpsTotal,
  dashboardUrl,
  previewText,
}: ScoreUpdatedProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const band = GPS_BAND_LABELS[gpsBand] ?? { label: gpsBand, color: "#1a6b3c" };
  const preview = previewText ?? `Your GPS score has been published — ${band.label}.`;

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>Your GPS score is published</EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        Your Green Performance Score for <strong>{operatorName}</strong> has
        been computed and published to your public profile.
      </EmailBody>

      {/* Score card */}
      <Section
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "24px",
          margin: "24px 0",
          textAlign: "center",
        }}
      >
        <Text
          style={{
            color: "#6b7280",
            fontSize: "13px",
            fontWeight: "600",
            letterSpacing: "0.08em",
            margin: "0 0 4px",
            textTransform: "uppercase",
          }}
        >
          GPS Total Score
        </Text>
        <Text
          style={{
            color: band.color,
            fontSize: "48px",
            fontWeight: "800",
            lineHeight: "1",
            margin: "0 0 8px",
          }}
        >
          {gpsTotal.toFixed(1)}
        </Text>
        <Text
          style={{
            backgroundColor: band.color,
            borderRadius: "4px",
            color: "#ffffff",
            display: "inline-block",
            fontSize: "13px",
            fontWeight: "600",
            padding: "4px 12px",
            margin: "0",
          }}
        >
          {band.label}
        </Text>
      </Section>

      <EmailBody>
        Your score is now visible to travelers searching for verified
        regenerative operators. You can view the full breakdown, evidence
        status, and methodology trace on your dashboard.
      </EmailBody>

      <EmailButton href={dashboardUrl}>View full score breakdown</EmailButton>
    </BaseLayout>
  );
}

export default ScoreUpdatedTemplate;
