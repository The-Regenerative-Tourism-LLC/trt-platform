"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { subscribeToMarketingList } from "@/lib/klaviyo";
import { sendWelcomeEmail, sendAdminNewOperatorEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

const SelectRoleSchema = z.object({
  role: z.enum(["operator", "traveler"]),
  name: z.string().min(1).optional(),
  termsOptIn: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms & Conditions and Privacy Policy" }),
  }),
  marketingOptIn: z.boolean().optional(),
});

// Accepts a plain object — NOT FormData.
// This action is called programmatically from a client component, and Next.js
// App Router does not reliably serialize manually-constructed FormData objects
// passed to server actions. Plain objects serialize correctly.
export async function selectRoleAction(input: {
  role: "operator" | "traveler";
  name?: string;
  termsOptIn: true;
  marketingOptIn?: boolean;
}): Promise<{ role: "operator" | "traveler" }> {
  return Sentry.withServerActionInstrumentation(
    "selectRoleAction",
    { headers: await headers(), recordResponse: true },
    async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const parsed = SelectRoleSchema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? "Invalid role selection");
      }

      const userId = session.user.id;
      const { role, name, marketingOptIn } = parsed.data;
      const now = new Date();

      const displayName =
        name ??
        (await prisma.user.findUnique({ where: { id: userId } }))?.name ??
        "User";

      // Record legal acceptance
      await prisma.user.update({
        where: { id: userId },
        data: {
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
        },
      });

      // ── Recovery path ─────────────────────────────────────────────────────────
      // A UserRole record may already exist if a previous attempt succeeded at
      // creating the role but failed before persisting the profile, or if the JWT
      // was stale and the user retried (the prior bug where update() didn't reissue
      // the cookie). Do NOT throw — instead ensure the profile exists and return
      // the effective role so the client navigates to the correct destination.
      const existingRole = await prisma.userRole.findFirst({ where: { userId } });

      if (existingRole) {
        const effectiveRole = existingRole.role as "operator" | "traveler";

        if (effectiveRole === "operator") {
          const hasProfile = await prisma.operator.findUnique({ where: { userId } });
          if (!hasProfile) {
            await prisma.operator.create({
              data: { userId, legalName: displayName, photos: [], amenities: [] },
            });
          }
        } else {
          const hasProfile = await prisma.traveler.findUnique({ where: { userId } });
          if (!hasProfile) {
            await prisma.traveler.create({ data: { userId, displayName } });
          }
        }

        void firePostRoleActions(userId, effectiveRole, marketingOptIn).catch((err) =>
          console.error("[select-role] Post-role actions failed (recovery):", err)
        );

        return { role: effectiveRole };
      }

      // ── New user path ──────────────────────────────────────────────────────────
      // Create UserRole + profile atomically so a partial failure leaves no
      // orphaned records.
      await prisma.$transaction(async (tx) => {
        await tx.userRole.create({ data: { userId, role } });

        if (role === "operator") {
          await tx.operator.create({
            data: { userId, legalName: displayName, photos: [], amenities: [] },
          });
        } else {
          await tx.traveler.create({ data: { userId, displayName } });
        }
      });

      // Fire welcome + admin + Klaviyo outside the transaction so failures
      // never roll back the role assignment.
      void firePostRoleActions(userId, role, marketingOptIn).catch((err) =>
        console.error("[select-role] Post-role actions failed:", err)
      );

      return { role };
    }
  );
}

// ── Shared post-role dispatcher ───────────────────────────────────────────────
// Called after role assignment for Google OAuth users (email already verified).
// Sends welcome email, admin notification, and subscribes to Klaviyo if opted in.
async function firePostRoleActions(
  userId: string,
  role: "operator" | "traveler",
  marketingOptIn?: boolean
) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const recipientName = user.name ?? user.email;
  const dashboardUrl =
    role === "operator"
      ? `${APP_URL}/operator/dashboard`
      : `${APP_URL}/traveler/dashboard`;

  await sendWelcomeEmail({
    to: user.email,
    userId: user.id,
    recipientName,
    role,
    dashboardUrl,
  });

  if (role === "operator" && ADMIN_EMAIL) {
    await sendAdminNewOperatorEmail({
      to: ADMIN_EMAIL,
      operatorName: recipientName,
      operatorEmail: user.email,
      role: "operator",
      adminUrl: `${APP_URL}/admin/operators`,
    });
  }

  if (marketingOptIn === true && !user.marketingEmailConsent) {
    await prisma.user.update({
      where: { id: userId },
      data: { marketingEmailConsent: true, consentedAt: new Date() },
    });
    await subscribeToMarketingList({
      email: user.email,
      firstName: user.name?.split(" ")[0],
    });
  }
}
