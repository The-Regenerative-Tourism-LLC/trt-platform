/**
 * GET /api/v1/public/operators/:id
 *
 * Public operator profile API. Returns a published operator's identity,
 * territory, latest GPS score, pillar scores, delta, evidence summaries,
 * and methodology metadata.
 *
 * Returns 404 if the operator does not exist or has no published ScoreSnapshot.
 *
 * Authentication: none required. All data returned is public-safe:
 *   - No private file paths, checksums, or internal IDs exposed beyond scoreSnapshotId
 *   - Evidence shows only verified items with no file storage details
 */

import { NextRequest, NextResponse } from "next/server";
import { findPublishedOperatorProfile } from "@/lib/db/repositories/operator.repo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const profile = await findPublishedOperatorProfile(id);

    if (!profile) {
      return NextResponse.json(
        { error: "Operator not found or no published score available" },
        { status: 404 }
      );
    }

    const { operator, latestScore, evidence } = profile;
    const snap = latestScore.assessmentSnapshot;

    return NextResponse.json(
      {
        operator: {
          id: operator.id,
          name: operator.tradingName ?? operator.legalName,
          legalName: operator.legalName,
          tradingName: operator.tradingName,
          country: operator.country,
          destinationRegion: operator.destinationRegion,
          operatorType: operator.operatorType,
          tagline: operator.tagline,
          website: operator.website,
          territory: operator.territory
            ? {
                id: operator.territory.id,
                name: operator.territory.name,
                compositeDpi: operator.territory.compositeDpi
                  ? Number(operator.territory.compositeDpi)
                  : null,
                pressureLevel: operator.territory.pressureLevel,
              }
            : null,
        },
        score: {
          scoreSnapshotId: latestScore.id,
          assessmentCycle: snap.assessmentCycle,
          assessmentPeriodEnd: snap.assessmentPeriodEnd,
          gpsTotal: Number(latestScore.gpsTotal),
          gpsBand: latestScore.gpsBand,
          p1Score: Number(latestScore.p1Score),
          p2Score: Number(latestScore.p2Score),
          p3Score: Number(latestScore.p3Score),
          dpsTotal: latestScore.dpsTotal ? Number(latestScore.dpsTotal) : null,
          dps1: latestScore.dps1 ? Number(latestScore.dps1) : null,
          dps2: latestScore.dps2 ? Number(latestScore.dps2) : null,
          dps3: latestScore.dps3 ? Number(latestScore.dps3) : null,
          dpsBand: latestScore.dpsBand,
          methodologyVersion: latestScore.methodologyVersion,
          publishedAt: latestScore.computedAt,
          delta: {
            priorCycle: snap.deltaPriorCycle,
            explanation: snap.deltaExplanation ?? null,
          },
        },
        evidence: evidence.map((e) => ({
          indicatorId: e.indicatorId,
          tier: e.tier,
          verificationState: e.verificationState,
          proxyMethod: e.proxyMethod ?? null,
          proxyCorrectionFactor: e.proxyCorrectionFactor
            ? Number(e.proxyCorrectionFactor)
            : null,
          verifiedAt: e.verifiedAt,
        })),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[GET /api/v1/public/operators/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
