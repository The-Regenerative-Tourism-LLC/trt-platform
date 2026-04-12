"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { subscribeToMarketingList } from "@/lib/klaviyo";

const SelectRoleSchema = z.object({
  role: z.enum(["operator", "traveler"]),
  name: z.string().min(1).optional(),
  marketingOptIn: z.boolean().optional(),
});

// Accepts a plain object — NOT FormData.
// This action is called programmatically from a client component, and Next.js
// App Router does not reliably serialize manually-constructed FormData objects
// passed to server actions. Plain objects serialize correctly.
export async function selectRoleAction(input: {
  role: "operator" | "traveler";
  name?: string;
  marketingOptIn?: boolean;
}): Promise<{ role: "operator" | "traveler" }> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const parsed = SelectRoleSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid role selection");
  }

  const userId = session.user.id;

  // Resolve display name once — needed in both the new-user and recovery paths.
  const { role, name, marketingOptIn } = parsed.data;
  const displayName =
    name ??
    (await prisma.user.findUnique({ where: { id: userId } }))?.name ??
    "User";

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

    // Klaviyo — only on recovery path if not already consented and user opts in
    if (marketingOptIn === true) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && !user.marketingEmailConsent) {
        await prisma.user.update({
          where: { id: userId },
          data: { marketingEmailConsent: true, consentedAt: new Date() },
        });
        void subscribeToMarketingList({
          email: user.email!,
          firstName: user.name?.split(" ")[0],
        }).catch((err) => console.error("[select-role] Klaviyo subscribe failed:", err));
      }
    }

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

  // Persist consent and subscribe to Klaviyo — outside the transaction so
  // a Klaviyo failure never rolls back the role assignment.
  if (marketingOptIn === true) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      await prisma.user.update({
        where: { id: userId },
        data: { marketingEmailConsent: true, consentedAt: new Date() },
      });
      void subscribeToMarketingList({
        email: user.email!,
        firstName: user.name?.split(" ")[0],
      }).catch((err) => console.error("[select-role] Klaviyo subscribe failed:", err));
    }
  }

  return { role };
}
