"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const AcceptTermsSchema = z.object({
  termsOptIn: z.literal(true, {
    errorMap: () => ({ message: "You must accept the Terms & Conditions and Privacy Policy" }),
  }),
  marketingOptIn: z.boolean().optional(),
});

export async function acceptTermsAction(input: {
  termsOptIn: true;
  marketingOptIn?: boolean;
}): Promise<void> {
  return Sentry.withServerActionInstrumentation(
    "acceptTermsAction",
    { headers: await headers(), recordResponse: true },
    async () => {
      const session = await auth();
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }

      const parsed = AcceptTermsSchema.safeParse(input);
      if (!parsed.success) {
        throw new Error(parsed.error.errors[0]?.message ?? "Invalid input");
      }

      const { marketingOptIn } = parsed.data;
      const now = new Date();

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          termsAcceptedAt: now,
          privacyAcceptedAt: now,
          ...(marketingOptIn === true && {
            marketingEmailConsent: true,
            consentedAt: now,
          }),
        },
      });
    }
  );
}
