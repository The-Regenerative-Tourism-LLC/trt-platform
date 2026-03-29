/**
 * GET /api/v1/operator/evidence
 *
 * Returns all evidence refs for the authenticated operator, along with the
 * operator ID and latest assessment snapshot ID.
 * Reads from persisted EvidenceRef rows — never computes scores.
 */

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { findLatestAssessmentByOperator } from "@/lib/db/repositories/assessment.repo";
import { findEvidenceByOperator } from "@/lib/db/repositories/evidence.repo";

export async function GET() {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const [latestSnapshot, evidenceRefs] = await Promise.all([
      findLatestAssessmentByOperator(operator.id),
      findEvidenceByOperator(operator.id),
    ]);

    return NextResponse.json({
      operatorId: operator.id,
      latestAssessmentSnapshotId: latestSnapshot?.id ?? null,
      evidence: evidenceRefs.map((e) => ({
        id: e.id,
        indicatorId: e.indicatorId,
        tier: e.tier,
        fileName: e.fileName,
        checksum: e.checksum,
        verificationState: e.verificationState,
        submittedAt: e.submittedAt.toISOString(),
        verifiedAt: e.verifiedAt?.toISOString() ?? null,
        assessmentSnapshotId: e.assessmentSnapshotId,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/operator/evidence]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
