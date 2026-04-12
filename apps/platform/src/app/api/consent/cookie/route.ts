/**
 * GET  /api/consent/cookie — fetch stored consent for the current user
 * POST /api/consent/cookie — upsert consent for the current user
 *
 * This is for authenticated users only. Anonymous consent is stored
 * exclusively in the client-side `trt_consent` cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const ConsentSchema = z.object({
  analytics: z.boolean(),
  marketing: z.boolean(),
  version: z.string().default("1"),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const consent = await prisma.cookieConsent.findUnique({
    where: { userId: session.user.id },
    select: { analytics: true, marketing: true, version: true, updatedAt: true },
  });

  return NextResponse.json(consent ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ConsentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const { analytics, marketing, version } = parsed.data;

  const consent = await prisma.cookieConsent.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, analytics, marketing, version },
    update: { analytics, marketing, version },
    select: { analytics: true, marketing: true, version: true, updatedAt: true },
  });

  return NextResponse.json(consent);
}
