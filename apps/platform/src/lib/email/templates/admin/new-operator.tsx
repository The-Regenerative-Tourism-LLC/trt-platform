import * as React from "react";
import { Section, Text } from "@react-email/components";
import {
  BaseLayout,
  EmailBody,
  EmailButton,
  EmailHeading,
} from "../base/layout";
import type { AdminNewOperatorProps } from "../../types";

export function AdminNewOperatorTemplate({
  operatorName,
  operatorEmail,
  role,
  adminUrl,
  previewText,
}: AdminNewOperatorProps) {
  const preview = previewText ?? `New ${role} registered: ${operatorName}`;

  return (
    <BaseLayout preview={preview}>
      <EmailHeading>New operator registered</EmailHeading>

      <EmailBody>A new operator has signed up on TRT Platform.</EmailBody>

      <Section
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "20px 24px",
          margin: "20px 0",
        }}
      >
        <Text style={{ color: "#374151", fontSize: "14px", margin: "0 0 8px" }}>
          <strong>Name:</strong> {operatorName}
        </Text>
        <Text style={{ color: "#374151", fontSize: "14px", margin: "0 0 8px" }}>
          <strong>Email:</strong> {operatorEmail}
        </Text>
        <Text style={{ color: "#374151", fontSize: "14px", margin: "0" }}>
          <strong>Role:</strong> {role}
        </Text>
      </Section>

      <EmailBody>
        Review the new registration in the admin panel. You may approve,
        request additional information, or flag for compliance review.
      </EmailBody>

      <EmailButton href={adminUrl}>View in admin panel</EmailButton>
    </BaseLayout>
  );
}

export default AdminNewOperatorTemplate;
