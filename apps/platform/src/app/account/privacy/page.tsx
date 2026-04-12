import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import { PrivacySettingsClient } from "./PrivacySettingsClient";

export const metadata: Metadata = {
  title: "Privacy & Consent",
};

export default async function PrivacyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      email: true,
      marketingEmailConsent: true,
      consentedAt: true,
      termsAcceptedAt: true,
      privacyAcceptedAt: true,
      cookieConsent: {
        select: { analytics: true, marketing: true, updatedAt: true },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold text-foreground mb-1">Privacy &amp; Consent</h1>
        <p className="text-sm text-muted-foreground">
          Manage your data preferences and consent settings.
        </p>
      </div>

      {/* Legal acceptance summary */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-4">Legal acceptance</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Terms &amp; Conditions</span>
            {user.termsAcceptedAt ? (
              <span className="text-green-700 dark:text-green-400">
                Accepted {user.termsAcceptedAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </span>
            ) : (
              <span className="text-destructive">Not accepted</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Privacy Policy</span>
            {user.privacyAcceptedAt ? (
              <span className="text-green-700 dark:text-green-400">
                Accepted {user.privacyAcceptedAt.toLocaleDateString("en-GB", { dateStyle: "medium" })}
              </span>
            ) : (
              <span className="text-destructive">Not accepted</span>
            )}
          </div>
        </div>
      </div>

      <PrivacySettingsClient
        initialMarketing={user.marketingEmailConsent}
        marketingConsentedAt={user.consentedAt?.toISOString() ?? null}
        initialCookieAnalytics={user.cookieConsent?.analytics ?? null}
        initialCookieMarketing={user.cookieConsent?.marketing ?? null}
        cookieConsentUpdatedAt={user.cookieConsent?.updatedAt?.toISOString() ?? null}
      />

      {/* Data rights */}
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <h2 className="text-base font-semibold text-foreground mb-2">Your data rights</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Under GDPR you have rights to access, correct, export, or delete your data. To exercise any of these rights, contact us.
        </p>
        <a
          href="mailto:admin@theregenerativetourism.com"
          className="inline-flex items-center text-sm font-medium text-foreground underline hover:text-primary"
        >
          admin@theregenerativetourism.com
        </a>
      </div>
    </div>
  );
}
