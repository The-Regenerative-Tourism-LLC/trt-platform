/**
 * POST /api/auth/invite/accept
 *
 * Accepts an invitation: verifies the token, creates the user account,
 * assigns the specified role, and provisions the domain profile.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/tokens";
import { sendWelcomeEmail } from "@/lib/email";
import type { AppRole } from "@prisma/client";

const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, "Name is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = Schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, name, password } = parsed.data;

    const result = await verifyToken(token, "invitation");

    if (!result.valid) {
      const messages = {
        not_found: "This invitation link is invalid.",
        expired: "This invitation has expired. Please request a new one.",
        already_used: "This invitation has already been used.",
      };
      return NextResponse.json(
        { error: messages[result.reason] },
        { status: 400 }
      );
    }

    const meta = result.metadata as { role?: string } | null;
    const role = (meta?.role ?? "traveler") as AppRole;
    const email = result.email;

    // Check if account was created between token generation and acceptance
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          emailVerified: new Date(), // Invitation = email already confirmed
        },
      });

      await tx.userRole.create({ data: { userId: user.id, role } });

      if (role === "operator") {
        await tx.operator.create({
          data: { userId: user.id, legalName: name, photos: [], amenities: [] },
        });
      } else if (role === "traveler") {
        await tx.traveler.create({
          data: { userId: user.id, displayName: name },
        });
      }
    });

    // Fetch new user for welcome email
    const user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      const dashboardUrl =
        role === "operator"
          ? `${APP_URL}/operator/dashboard`
          : role === "traveler"
            ? `${APP_URL}/traveler/dashboard`
            : `${APP_URL}/admin/dashboard`;

      void sendWelcomeEmail({
        to: email,
        userId: user.id,
        recipientName: name,
        role: role as WelcomeEmailProps["role"],
        dashboardUrl,
      });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/invite/accept]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}

// Type helper — avoids circular import from email/types
type WelcomeEmailProps = { role: "operator" | "traveler" | "institution_partner" };
