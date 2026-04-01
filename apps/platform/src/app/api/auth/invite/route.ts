/**
 * POST /api/auth/invite
 *
 * Admin-only: sends an invitation to a new user.
 * Creates a secure invitation token and dispatches the email.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import { createToken } from "@/lib/tokens";
import { sendInvitationEmail } from "@/lib/email";
import { prisma } from "@/lib/db/prisma";

const Schema = z.object({
  email: z.string().email(),
  role: z.enum(["operator", "traveler", "institution_partner"]),
  name: z.string().optional(),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("admin");

    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, role, name } = parsed.data;

    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const inviterUser = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { name: true, email: true },
    });

    const invitedBy = inviterUser?.name ?? inviterUser?.email ?? "TRT Platform";

    const { rawToken, expiresAt } = await createToken({
      type: "invitation",
      email,
      userId: session.userId,
      metadata: { role, invitedBy, invitedByUserId: session.userId },
    });

    const inviteUrl = `${APP_URL}/accept-invite?token=${rawToken}`;

    await sendInvitationEmail({
      to: email,
      recipientName: name,
      invitedBy,
      inviteUrl,
      role,
      expiresInDays: 7,
    });

    return NextResponse.json({
      success: true,
      expiresAt,
    });
  } catch (err) {
    if ((err as Error).message?.includes("Unauthorized")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    console.error("[POST /api/auth/invite]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
