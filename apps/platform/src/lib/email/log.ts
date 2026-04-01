/**
 * Email audit log.
 *
 * All outgoing emails are logged — both successes and failures.
 * The log is append-only: entries are never updated or deleted.
 * Failures include the provider error message for debugging.
 */

import { prisma } from "@/lib/db/prisma";
import type { EmailType, EmailStatus } from "./types";
import type { Prisma } from "@prisma/client";

interface CreateEmailLogInput {
  userId?: string;
  email: string;
  type: EmailType;
  subject: string;
  status: EmailStatus;
  providerId?: string;
  sentAt?: Date;
  errorMessage?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createEmailLog(
  input: CreateEmailLogInput
): Promise<void> {
  try {
    await prisma.emailLog.create({
      data: {
        userId: input.userId,
        email: input.email,
        type: input.type,
        subject: input.subject,
        status: input.status,
        providerId: input.providerId,
        sentAt: input.sentAt,
        errorMessage: input.errorMessage,
        metadata: input.metadata,
      },
    });
  } catch (err) {
    // Log failure must never crash the application.
    // Write to stderr so Railway / Datadog can capture it.
    console.error("[email-log] Failed to write email log entry:", err);
  }
}
