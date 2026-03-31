/**
 * POST /api/v1/admin/evidence/[id]/lapse
 *
 * Admin action: transition an EvidenceRef from "verified" to "lapsed".
 * Used when previously-verified evidence expires or is superseded.
 *
 * Valid transition: verified → lapsed
 * Invalid transitions return 409 Conflict.
 *
 * After lapsing, publication eligibility is re-evaluated for the
 * ScoreSnapshot linked to the same AssessmentSnapshot. A published score
 * may be unpublished if lapsing this evidence removes T1 coverage.
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

const LapseSchema = z.object({
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");

    const body = await req.json();
    const parsed = LapseSchema.safeParse(body);
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

    if (evidence.verificationState !== "verified") {
      return NextResponse.json(
        {
          error: "Invalid state transition",
          detail: `Cannot lapse evidence in state "${evidence.verificationState}". Only "verified" evidence can be lapsed.`,
        },
        { status: 409 }
      );
    }

    await updateVerificationState(evidenceId, "lapsed", session.userId);

    await logAuditEvent({
      actor: session.userId,
      action: "evidence.lapsed",
      entityType: "EvidenceRef",
      entityId: evidenceId,
      payload: {
        tier: evidence.tier,
        indicatorId: evidence.indicatorId,
        assessmentSnapshotId: evidence.assessmentSnapshotId,
        notes: parsed.data.notes,
      },
    });

    // Re-evaluate publication eligibility — lapsing may remove T1 coverage
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
          trigger: "evidence.lapsed",
          evidenceRefId: evidenceId,
          publicationBlockedReason: publication.publicationBlockedReason,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        evidenceRefId: evidenceId,
        state: "lapsed",
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
    console.error("[POST /api/v1/admin/evidence/[id]/lapse]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
