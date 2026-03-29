/**
 * POST /api/v1/admin/evidence/[id]/verify
 *
 * Admin action: verify or reject an evidence reference.
 *
 * After a T1 evidence item is verified:
 *   - The EvidenceRef state is set to "verified"
 *   - All ScoreSnapshots linked to the same AssessmentSnapshot that have
 *     unresolved T1 publication blocks are published (isPublished = true)
 *
 * Authentication: admin role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth/session";
import {
  updateVerificationState,
  findEvidenceBySnapshot,
} from "@/lib/db/repositories/evidence.repo";
import {
  findScoreByAssessmentSnapshot,
  publishScoreSnapshot,
} from "@/lib/db/repositories/score.repo";
import { findAssessmentSnapshotById } from "@/lib/db/repositories/assessment.repo";
import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/logger";

const VerifyRequestSchema = z.object({
  action: z.enum(["verify", "reject"]),
  notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireRole("admin");

    const body = await req.json();
    const parsed = VerifyRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { action, notes } = parsed.data;
    const { id: evidenceId } = await params;

    // Load the evidence ref
    const evidenceRef = await prisma.evidenceRef.findUnique({
      where: { id: evidenceId },
    });
    if (!evidenceRef) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    const newState = action === "verify" ? "verified" : "rejected";

    // Update verification state
    const updated = await updateVerificationState(
      evidenceId,
      newState as any,
      session.userId
    );

    await logAuditEvent({
      actor: session.userId,
      action: `evidence.${newState}`,
      entityType: "EvidenceRef",
      entityId: evidenceId,
      payload: {
        tier: evidenceRef.tier,
        assessmentSnapshotId: evidenceRef.assessmentSnapshotId,
        notes,
      },
    });

    // ── Fix 10: Trigger publication after T1 verification ──────────────
    let publishedScoreId: string | null = null;

    if (action === "verify" && evidenceRef.tier === "T1") {
      // Check whether all T1 evidence for this snapshot is now verified
      const allEvidence = await findEvidenceBySnapshot(evidenceRef.assessmentSnapshotId);
      const allT1Verified = allEvidence
        .filter((e) => e.tier === "T1")
        .every((e) => e.id === evidenceId ? true : e.verificationState === "verified");

      if (allT1Verified) {
        const score = await findScoreByAssessmentSnapshot(evidenceRef.assessmentSnapshotId);
        if (score && !score.isPublished) {
          const published = await publishScoreSnapshot(score.id);
          publishedScoreId = published.id;

          await logAuditEvent({
            actor: session.userId,
            action: "score.published",
            entityType: "ScoreSnapshot",
            entityId: score.id,
            payload: {
              trigger: "T1_evidence_verified",
              evidenceRefId: evidenceId,
              assessmentSnapshotId: evidenceRef.assessmentSnapshotId,
            },
          });
        }
      }
    }

    return NextResponse.json(
      {
        success: true,
        evidenceRefId: evidenceId,
        state: newState,
        ...(publishedScoreId ? { publishedScoreSnapshotId: publishedScoreId } : {}),
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
    console.error("[POST /api/v1/admin/evidence/[id]/verify]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
