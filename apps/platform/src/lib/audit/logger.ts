/**
 * Audit Logger
 *
 * Append-only audit trail for all system events.
 * Every score computation, evidence submission, and status change is logged.
 */

import { prisma } from "../db/prisma";
import type { AppRole } from "@prisma/client";

export interface AuditEventInput {
  actor?: string;
  actorRole?: AppRole;
  action: string;
  entityType: string;
  entityId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actor: input.actor,
        actorRole: input.actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        payload: input.payload as any,
        ipAddress: input.ipAddress,
      },
    });
  } catch (err) {
    // Audit failures must never interrupt the main flow
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}
