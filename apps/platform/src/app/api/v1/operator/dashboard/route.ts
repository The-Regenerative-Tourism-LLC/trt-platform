/**
 * GET /api/v1/operator/dashboard
 *
 * Returns operator profile + latest score + territory DPI for the dashboard.
 * Reads from persisted ScoreSnapshot — never computes scores.
 */

import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import {
  findLatestScoreByOperator,
  findPreviousScoreByOperator,
} from "@/lib/db/repositories/score.repo";
import { findTerritoryById } from "@/lib/db/repositories/dpi.repo";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function buildPublicStorageUrl(storageKey: string): string {
  const base = process.env.STORAGE_PUBLIC_BASE_URL;
  if (base) return `${base}/${storageKey}`;
  return `/uploads/${storageKey}`;
}

export async function GET() {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ operator: null });
    }

    const [latestScore, previousScore, territory, coverPhoto] = await Promise.all([
      findLatestScoreByOperator(operator.id),
      findPreviousScoreByOperator(operator.id),
      operator.territoryId ? findTerritoryById(operator.territoryId) : null,
      prisma.operatorPhoto.findFirst({
        where: { operatorId: operator.id, isCover: true },
        select: { storageKey: true },
      }),
    ]);

    const coverPhotoUrl = coverPhoto
      ? buildPublicStorageUrl(coverPhoto.storageKey)
      : null;

    return NextResponse.json({
      operator: {
        id: operator.id,
        legalName: operator.legalName,
        tradingName: operator.tradingName,
        country: operator.country,
        destinationRegion: operator.destinationRegion,
        operatorType: operator.operatorType,
        operatorCode: operator.operatorCode,
        assessmentCycleCount: operator.assessmentCycleCount,
        onboardingCompleted: operator.onboardingCompleted,
        onboardingStep: operator.onboardingStep,
        onboardingData: operator.onboardingData,
        coverPhotoUrl: coverPhotoUrl,
        territory: territory
          ? {
              id: territory.id,
              name: territory.name,
              compositeDpi: territory.compositeDpi
                ? Number(territory.compositeDpi)
                : null,
              pressureLevel: territory.pressureLevel,
              touristIntensity: territory.touristIntensity
                ? Number(territory.touristIntensity)
                : null,
              ecologicalSensitivity: territory.ecologicalSensitivity
                ? Number(territory.ecologicalSensitivity)
                : null,
              economicLeakageRate: territory.economicLeakageRate
                ? Number(territory.economicLeakageRate)
                : null,
              regenerativePerformance: territory.regenerativePerformance
                ? Number(territory.regenerativePerformance)
                : null,
              dpiComputedAt: territory.dpiComputedAt?.toISOString() ?? null,
            }
          : null,
        latestScore: latestScore
          ? {
              id: latestScore.id,
              gpsTotal: Number(latestScore.gpsTotal),
              gpsBand: latestScore.gpsBand,
              p1Score: Number(latestScore.p1Score),
              p2Score: Number(latestScore.p2Score),
              p3Score: Number(latestScore.p3Score),
              dpsTotal: latestScore.dpsTotal
                ? Number(latestScore.dpsTotal)
                : null,
              dps1: latestScore.dps1 ? Number(latestScore.dps1) : null,
              dps2: latestScore.dps2 ? Number(latestScore.dps2) : null,
              dps3: latestScore.dps3 ? Number(latestScore.dps3) : null,
              dpsBand: latestScore.dpsBand,
              isPublished: latestScore.isPublished,
              publicationBlockedReason: latestScore.publicationBlockedReason,
              computedAt: latestScore.computedAt.toISOString(),
            }
          : null,
        previousScore: previousScore
          ? {
              gpsScore: Number(previousScore.gpsTotal),
              pillar1Score: Number(previousScore.p1Score),
              pillar2Score: Number(previousScore.p2Score),
              pillar3Score: Number(previousScore.p3Score),
              createdAt: previousScore.computedAt.toISOString(),
            }
          : null,
      },
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/operator/dashboard]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
