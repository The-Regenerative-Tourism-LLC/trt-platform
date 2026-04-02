/**
 * POST /api/auth/verify-email
 *
 * Consumes an email verification token and marks the user's email as verified.
 * Called when the user clicks the link in their verification email.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/tokens";

const Schema = z.object({
  token: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Token is required." }, { status: 400 });
    }

    const result = await verifyToken(parsed.data.token, "email_verification");

    if (!result.valid) {
      const messages = {
        not_found: "This verification link is invalid.",
        expired: "This verification link has expired. Please request a new one.",
        already_used: "This verification link has already been used.",
      };
      return NextResponse.json(
        { error: messages[result.reason] },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.user.update({
      where: { email: result.email },
      data: { emailVerified: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/verify-email]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
