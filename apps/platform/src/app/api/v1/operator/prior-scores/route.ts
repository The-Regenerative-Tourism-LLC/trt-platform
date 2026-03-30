/**
 * GET /api/v1/operator/prior-scores
 *
 * Returns the most recent ScoreSnapshot for the authenticated operator.
 * Used by the "delta" onboarding step to display prior-cycle scores.
 *
 * Returns null if the operator has no prior scores.
 * Does not compute, mutate, or publish anything.
 *
 * Authentication: operator session required.
 */

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { findLatestScoreByOperator } from "@/lib/db/repositories/score.repo";

export async function GET() {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Operator not found" }, { status: 404 });
    }

    const score = await findLatestScoreByOperator(operator.id);

    if (!score) {
      return NextResponse.json({ priorScore: null });
    }

    return NextResponse.json({
      priorScore: {
        gpsScore: Number(score.gpsTotal),
        pillar1Score: Number(score.p1Score),
        pillar2Score: Number(score.p2Score),
        pillar3Score: Number(score.p3Score),
        methodologyVersion: score.methodologyVersion,
        createdAt: score.computedAt.toISOString(),
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/operator/prior-scores]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
