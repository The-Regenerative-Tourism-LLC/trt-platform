/**
 * POST /api/v1/onboarding
 *
 * Saves incremental onboarding progress for an operator.
 * Does NOT compute scores — only persists form data to operator.onboardingData.
 *
 * Authentication: operator role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  findOperatorByUserId,
  updateOperator,
} from "@/lib/db/repositories/operator.repo";
import { findAvailableTerritories } from "@/lib/db/repositories/dpi.repo";
import { z } from "zod";

const OnboardingProgressSchema = z.object({
  step: z.number().int().min(0),
  data: z.record(z.unknown()),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = OnboardingProgressSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Operator profile not found" }, { status: 404 });
    }

    const existingData = (operator.onboardingData as Record<string, unknown> | null) ?? {};
    const mergedData: Record<string, unknown> = { ...existingData, ...parsed.data.data };

    const updated = await updateOperator(operator.id, {
      onboardingStep: parsed.data.step,
      onboardingData: mergedData as any,
    });

    return NextResponse.json({ success: true, step: updated.onboardingStep });
  } catch (err) {
    console.error("[POST /api/v1/onboarding]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [operator, territories] = await Promise.all([
      findOperatorByUserId(session.userId),
      findAvailableTerritories(),
    ]);

    if (!operator) {
      return NextResponse.json({ operator: null, territories });
    }

    return NextResponse.json({
      operator: {
        id: operator.id,
        legalName: operator.legalName,
        tradingName: operator.tradingName,
        country: operator.country,
        destinationRegion: operator.destinationRegion,
        operatorType: operator.operatorType,
        onboardingStep: operator.onboardingStep,
        onboardingData: operator.onboardingData,
        assessmentCycleCount: operator.assessmentCycleCount,
        onboardingCompleted: operator.onboardingCompleted,
        territoryId: operator.territoryId,
        yearOperationStart: operator.yearOperationStart,
        website: operator.website,
        primaryContactName: operator.primaryContactName,
        primaryContactEmail: operator.primaryContactEmail,
        accommodationCategory: operator.accommodationCategory,
        rooms: operator.rooms,
        bedCapacity: operator.bedCapacity,
        experienceTypes: operator.experienceTypes,
        ownershipType: operator.ownershipType,
        localEquityPct: operator.localEquityPct,
        isChainMember: operator.isChainMember,
        chainName: operator.chainName,
      },
      territories,
    });
  } catch (err) {
    console.error("[GET /api/v1/onboarding]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
