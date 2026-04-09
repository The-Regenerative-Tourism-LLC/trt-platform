/**
 * Base email layout.
 *
 * Consistent header, footer, and typographic defaults for all TRT emails.
 * Uses only React Email primitives — no external CSS frameworks.
 */

import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

const BLACK = "#000000";
const LIGHT_BROWN = "#DDD9D4";
const TEXT_PRIMARY = "#111827";
const TEXT_MUTED = "#6b7280";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

interface BaseLayoutProps {
  preview?: string;
  children: React.ReactNode;
}

export function BaseLayout({ preview, children }: BaseLayoutProps) {
  return (
    <Html lang="en">
      <Head />
      {preview && <Preview>{preview}</Preview>}

      <Body style={styles.body}>
        {/* Header */}
        <Section style={styles.header}>
          <Container style={styles.headerInner}>
            <Link href={BASE_URL} style={styles.logoLink}>
              <Text style={styles.logoText}>TRT Platform</Text>
            </Link>
          </Container>
        </Section>

        {/* Main content */}
        <Container style={styles.main}>
          {children}
        </Container>

        {/* Footer */}
        <Container style={styles.footer}>
          <Hr style={styles.hr} />
          <Text style={styles.footerText}>
            TRT Platform — Regenerative Tourism Certification
          </Text>
          <Text style={styles.footerLinks}>
            <Link href={`${BASE_URL}/privacy`} style={styles.footerLink}>
              Privacy Policy
            </Link>{" "}
            ·{" "}
            <Link href={`${BASE_URL}/terms`} style={styles.footerLink}>
              Terms of Service
            </Link>{" "}
            ·{" "}
            <Link href={`${BASE_URL}/email-preferences`} style={styles.footerLink}>
              Email Preferences
            </Link>
          </Text>
          <Text style={styles.footerAddress}>
            © {new Date().getFullYear()} TRT Platform. All rights reserved.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

// ── Shared helpers ────────────────────────────────────────────────────────────

export function EmailHeading({ children }: { children: React.ReactNode }) {
  return <Text style={styles.heading}>{children}</Text>;
}

export function EmailBody({ children }: { children: React.ReactNode }) {
  return <Text style={styles.paragraph}>{children}</Text>;
}

export function EmailButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Section style={styles.btnSection}>
      <Link href={href} style={styles.btn}>
        {children}
      </Link>
    </Section>
  );
}

export function EmailCallout({ children }: { children: React.ReactNode }) {
  return (
    <Section style={styles.callout}>
      <Text style={styles.calloutText}>{children}</Text>
    </Section>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  body: {
    backgroundColor: "#f9fafb",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    margin: "0",
    padding: "0",
  },
  header: {
    backgroundColor: BLACK,
    padding: "0",
  },
  headerInner: {
    maxWidth: "600px",
    padding: "20px 32px",
  },
  logoLink: {
    textDecoration: "none",
  },
  logoText: {
    color: "#ffffff",
    fontSize: "18px",
    fontWeight: "700",
    letterSpacing: "-0.3px",
    margin: "0",
  },
  main: {
    backgroundColor: "#ffffff",
    maxWidth: "600px",
    padding: "40px 32px 32px",
    borderRadius: "0 0 8px 8px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  heading: {
    color: TEXT_PRIMARY,
    fontSize: "24px",
    fontWeight: "700",
    letterSpacing: "-0.4px",
    lineHeight: "1.3",
    margin: "0 0 16px",
  },
  paragraph: {
    color: TEXT_PRIMARY,
    fontSize: "16px",
    lineHeight: "1.6",
    margin: "0 0 16px",
  },
  btnSection: {
    margin: "28px 0",
  },
  btn: {
    backgroundColor: BLACK,
    borderRadius: "6px",
    color: "#ffffff",
    display: "inline-block",
    fontSize: "15px",
    fontWeight: "600",
    padding: "12px 28px",
    textDecoration: "none",
  },
  callout: {
    backgroundColor: LIGHT_BROWN,
    borderLeft: `4px solid ${BLACK}`,
    borderRadius: "0 6px 6px 0",
    margin: "20px 0",
    padding: "16px 20px",
  },
  calloutText: {
    color: TEXT_PRIMARY,
    fontSize: "14px",
    lineHeight: "1.5",
    margin: "0",
  },
  hr: {
    borderColor: "#e5e7eb",
    borderTopWidth: "1px",
    margin: "0 0 20px",
  },
  footer: {
    maxWidth: "600px",
    padding: "24px 32px 40px",
  },
  footerText: {
    color: TEXT_MUTED,
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 8px",
    textAlign: "center" as const,
  },
  footerLinks: {
    color: TEXT_MUTED,
    fontSize: "12px",
    margin: "0 0 8px",
    textAlign: "center" as const,
  },
  footerLink: {
    color: TEXT_MUTED,
    textDecoration: "underline",
  },
  footerAddress: {
    color: TEXT_MUTED,
    fontSize: "11px",
    margin: "0",
    textAlign: "center" as const,
  },
} as const;
