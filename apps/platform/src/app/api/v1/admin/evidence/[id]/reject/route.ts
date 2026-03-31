/**
 * POST /api/v1/admin/evidence/[id]/reject
 *
 * Admin action: transition an EvidenceRef from "pending" to "rejected".
 *
 * Valid transition: pending → rejected
 * Invalid transitions return 409 Conflict.
 *
 * After rejection, publication eligibility is re-evaluated for the
 * ScoreSnapshot linked to the same AssessmentSnapshot. A published score
 * may be unpublished if rejecting this evidence removes T1 coverage.
 *
 * Authentication: admin role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import {
  findEvidenceRefById,
  updateVerificationState,
} from "@/lib/db/repositories/evidence.repo";
import { reevaluateScorePublication } from "@/lib/publication/publication-evaluator";
import { logAuditEvent } from "@/lib/audit/logger";

const RejectSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");

    const body = await req.json();
    const parsed = RejectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id: evidenceId } = await params;
    const evidence = await findEvidenceRefById(evidenceId);

    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    if (evidence.verificationState !== "pending") {
      return NextResponse.json(
        {
          error: "Invalid state transition",
          detail: `Cannot reject evidence in state "${evidence.verificationState}". Only "pending" evidence can be rejected.`,
        },
        { status: 409 }
      );
    }

    await updateVerificationState(evidenceId, "rejected", session.userId);

    await logAuditEvent({
      actor: session.userId,
      action: "evidence.rejected",
      entityType: "EvidenceRef",
      entityId: evidenceId,
      payload: {
        tier: evidence.tier,
        indicatorId: evidence.indicatorId,
        assessmentSnapshotId: evidence.assessmentSnapshotId,
        notes: parsed.data.notes,
      },
    });

    // Re-evaluate publication eligibility — rejection may remove T1 coverage
    const publication = await reevaluateScorePublication(
      evidence.assessmentSnapshotId,
      evidence.assessmentSnapshot.operatorId
    );

    if (publication.scoreSnapshotId) {
      await logAuditEvent({
        actor: session.userId,
        action: publication.isPublished ? "score.published" : "score.publication_blocked",
        entityType: "ScoreSnapshot",
        entityId: publication.scoreSnapshotId,
        payload: {
          trigger: "evidence.rejected",
          evidenceRefId: evidenceId,
          publicationBlockedReason: publication.publicationBlockedReason,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        evidenceRefId: evidenceId,
        state: "rejected",
        publication,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[POST /api/v1/admin/evidence/[id]/reject]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
