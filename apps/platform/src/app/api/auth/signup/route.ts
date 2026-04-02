/**
 * POST /api/auth/signup
 *
 * Creates a new user with email/password, assigns a role,
 * and provisions the corresponding domain profile (Operator or Traveler).
 *
 * Auth is intentionally separated from onboarding / assessment data.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { createToken } from "@/lib/tokens";
import { sendVerifyEmail, sendWelcomeEmail } from "@/lib/email";
import { sendAdminNewOperatorEmail } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.trtplatform.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100),
  role: z.enum(["operator", "traveler"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SignupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let newUserId: string;

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash },
      });
      newUserId = user.id;

      await tx.userRole.create({
        data: { userId: user.id, role },
      });

      if (role === "operator") {
        await tx.operator.create({
          data: {
            userId: user.id,
            legalName: name,
            photos: [],
            amenities: [],
          },
        });
      } else {
        await tx.traveler.create({
          data: {
            userId: user.id,
            displayName: name,
          },
        });
      }
    });

    // Send email verification + welcome — fire-and-forget, never block response
    void (async () => {
      try {
        const { rawToken } = await createToken({
          type: "email_verification",
          email,
          userId: newUserId!,
        });

        const verifyUrl = `${APP_URL}/verify-email?token=${rawToken}`;

        await sendVerifyEmail({
          to: email,
          userId: newUserId!,
          recipientName: name,
          verifyUrl,
          expiresInHours: 24,
        });

        const dashboardUrl =
          role === "operator"
            ? `${APP_URL}/operator/dashboard`
            : `${APP_URL}/traveler/dashboard`;

        await sendWelcomeEmail({
          to: email,
          userId: newUserId!,
          recipientName: name,
          role,
          dashboardUrl,
        });

        // Notify admin of new operator registrations
        if (role === "operator" && ADMIN_EMAIL) {
          await sendAdminNewOperatorEmail({
            to: ADMIN_EMAIL,
            operatorName: name,
            operatorEmail: email,
            role: "operator",
            adminUrl: `${APP_URL}/admin/operators`,
          });
        }
      } catch (emailErr) {
        // Email failure must never affect account creation
        console.error("[signup] Post-signup email dispatch failed:", emailErr);
      }
    })();

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/auth/signup]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
