/**
 * POST /api/auth/verify-email
 *
 * Consumes an email verification token and marks the user's email as verified.
 * Called when the user clicks the link in their verification email.
 * Triggers the welcome email and Klaviyo subscription after successful verification.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { verifyToken } from "@/lib/tokens";
import { sendWelcomeEmail, sendAdminNewOperatorEmail } from "@/lib/email";
import { subscribeToMarketingList } from "@/lib/klaviyo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";
const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL;

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
    const verifiedUser = await prisma.user.update({
      where: { email: result.email },
      data: { emailVerified: new Date() },
      include: { roles: true },
    });

    // Fire welcome email + Klaviyo after verification — never block the response
    void (async () => {
      try {
        const roleRecord = verifiedUser.roles[0];
        if (roleRecord) {
          const role = roleRecord.role as "operator" | "traveler";
          const recipientName = verifiedUser.name ?? verifiedUser.email;
          const dashboardUrl =
            role === "operator"
              ? `${APP_URL}/operator/dashboard`
              : `${APP_URL}/traveler/dashboard`;

          await sendWelcomeEmail({
            to: verifiedUser.email,
            userId: verifiedUser.id,
            recipientName,
            role,
            dashboardUrl,
          });

          if (role === "operator" && ADMIN_EMAIL) {
            await sendAdminNewOperatorEmail({
              to: ADMIN_EMAIL,
              operatorName: recipientName,
              operatorEmail: verifiedUser.email,
              role: "operator",
              adminUrl: `${APP_URL}/admin/operators`,
            });
          }
        }

        if (verifiedUser.marketingEmailConsent) {
          await subscribeToMarketingList({
            email: verifiedUser.email,
            firstName: verifiedUser.name?.split(" ")[0],
          });
        }
      } catch (err) {
        console.error("[verify-email] Post-verification dispatch failed:", err);
      }
    })();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/auth/verify-email]", err);
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    );
  }
}
