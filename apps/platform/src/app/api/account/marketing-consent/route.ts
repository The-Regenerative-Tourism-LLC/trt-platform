/**
 * POST /api/account/marketing-consent
 * Updates the authenticated user's marketing email consent.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";
import { subscribeToMarketingList } from "@/lib/klaviyo";

const Schema = z.object({
  marketingOptIn: z.boolean(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { marketingOptIn } = parsed.data;
  const now = new Date();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      marketingEmailConsent: marketingOptIn,
      consentedAt: marketingOptIn ? now : undefined,
    },
  });

  if (marketingOptIn) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    });
    if (user) {
      await subscribeToMarketingList({
        email: user.email,
        firstName: user.name?.split(" ")[0],
      }).catch((err) => {
        console.error("[marketing-consent] Klaviyo sync failed:", err);
      });
    }
  }

  return NextResponse.json({ success: true });
}
