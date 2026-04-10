import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailCallout,
  EmailHeading,
} from "../base/layout";
import type { EvidenceStatusProps } from "../../types";

export function EvidenceStatusTemplate({
  recipientName,
  operatorName,
  indicatorId,
  status,
  reason,
  dashboardUrl,
  previewText,
}: EvidenceStatusProps) {
  const greeting = recipientName ? `Hi ${recipientName},` : "Hi there,";
  const isApproved = status === "approved";
  const preview =
    previewText ??
    (isApproved
      ? `Evidence for ${indicatorId} has been approved.`
      : `Evidence for ${indicatorId} requires attention.`);

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>
        Evidence {isApproved ? "approved" : "rejected"}
      </EmailHeading>

      <EmailBody>{greeting}</EmailBody>

      <EmailBody>
        The evidence submission for indicator <strong>{indicatorId}</strong>{" "}
        ({operatorName}) has been reviewed.
      </EmailBody>

      {isApproved ? (
        <>
          <Section
            style={{
              backgroundColor: "#f0faf4",
              borderLeft: "4px solid #000000",
              borderRadius: "0 6px 6px 0",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Text
              style={{
                color: "#000000",
                fontSize: "15px",
                fontWeight: "600",
                margin: "0",
              }}
            >
              ✓ Approved — this evidence has been accepted and will count
              toward your GPS score.
            </Text>
          </Section>
        </>
      ) : (
        <>
          <Section
            style={{
              backgroundColor: "#fef2f2",
              borderLeft: "4px solid #dc2626",
              borderRadius: "0 6px 6px 0",
              padding: "16px 20px",
              margin: "20px 0",
            }}
          >
            <Text
              style={{
                color: "#dc2626",
                fontSize: "15px",
                fontWeight: "600",
                margin: "0 0 8px",
              }}
            >
              Evidence not accepted
            </Text>
            {reason && (
              <Text style={{ color: "#7f1d1d", fontSize: "14px", margin: "0" }}>
                Reason: {reason}
              </Text>
            )}
          </Section>

          <EmailBody>
            You may upload revised evidence to address the feedback above. Your
            score will be updated once the replacement evidence is reviewed.
          </EmailBody>
        </>
      )}

      <EmailButton href={dashboardUrl}>
        {isApproved ? "View score progress" : "Upload revised evidence"}
      </EmailButton>
    </BaseLayout>
  );
}

export default EvidenceStatusTemplate;
