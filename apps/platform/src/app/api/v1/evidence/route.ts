/**
 * POST /api/v1/evidence
 *
 * Submit an evidence reference for a specific assessment snapshot indicator.
 * The route records the EvidenceRef row (metadata + checksum).
 * Actual file bytes are stored externally (object storage); only the checksum
 * and storage path are persisted here.
 *
 * Authentication: operator role required.
 * The operator must own the target assessmentSnapshotId.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { findAssessmentSnapshotById } from "@/lib/db/repositories/assessment.repo";
import { createEvidenceRef } from "@/lib/db/repositories/evidence.repo";
import { logAuditEvent } from "@/lib/audit/logger";

const EvidenceUploadSchema = z.object({
  assessmentSnapshotId: z.string().min(1),
  indicatorId: z.string().min(1),
  tier: z.enum(["T1", "T2", "T3", "Proxy"]),
  fileName: z.string().min(1),
  storagePath: z.string().min(1),
  checksum: z.string().min(1),
  proxyMethod: z.string().optional(),
  proxyCorrectionFactor: z.number().min(0).max(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const body = await req.json();
    const parsed = EvidenceUploadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Verify ownership: operator must own the assessment snapshot
    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const snapshot = await findAssessmentSnapshotById(data.assessmentSnapshotId);
    if (!snapshot || snapshot.operatorId !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const evidenceRef = await createEvidenceRef({
      assessmentSnapshot: { connect: { id: data.assessmentSnapshotId } },
      operator: { connect: { id: operator.id } },
      indicatorId: data.indicatorId,
      tier: data.tier as any,
      fileName: data.fileName,
      storagePath: data.storagePath,
      checksum: data.checksum,
      proxyMethod: data.proxyMethod,
      proxyCorrectionFactor: data.proxyCorrectionFactor,
    });

    await logAuditEvent({
      actor: session.userId,
      action: "evidence.submitted",
      entityType: "EvidenceRef",
      entityId: evidenceRef.id,
      payload: {
        assessmentSnapshotId: data.assessmentSnapshotId,
        indicatorId: data.indicatorId,
        tier: data.tier,
        checksum: data.checksum,
      },
    });

    return NextResponse.json({ success: true, evidenceRefId: evidenceRef.id }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/evidence]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
