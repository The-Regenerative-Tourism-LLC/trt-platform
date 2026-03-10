/**
 * GET /api/v1/operators
 *
 * Returns published operators with their latest scores.
 * No auth required for public access.
 *
 * POST /api/v1/operators
 *
 * Creates or updates an operator profile.
 * Auth: operator role required.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  findPublishedOperatorsWithScores,
  createOperator,
  findOperatorByUserId,
  updateOperator,
} from "@/lib/db/repositories/operator.repo";
import { findOrCreateTerritory } from "@/lib/db/repositories/territory.repo";
import { getSession } from "@/lib/auth/session";
import { OnboardingProfileSchema } from "@/lib/validation/assessment.schema";
import { logAuditEvent } from "@/lib/audit/logger";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const territoryId = searchParams.get("territory") ?? undefined;

    const operators = await findPublishedOperatorsWithScores({ territoryId });

    return NextResponse.json({
      operators: operators.map((op) => ({
        id: op.id,
        legalName: op.legalName,
        tradingName: op.tradingName,
        country: op.country,
        destinationRegion: op.destinationRegion,
        operatorType: op.operatorType,
        territory: op.territory
          ? { id: op.territory.id, name: op.territory.name, compositeDpi: op.territory.compositeDpi, pressureLevel: op.territory.pressureLevel }
          : null,
        latestScore: op.scoreSnapshots[0]
          ? {
              gpsTotal: Number(op.scoreSnapshots[0].gpsTotal),
              gpsBand: op.scoreSnapshots[0].gpsBand,
              dpsTotal: op.scoreSnapshots[0].dpsTotal ? Number(op.scoreSnapshots[0].dpsTotal) : null,
              dpsBand: op.scoreSnapshots[0].dpsBand,
            }
          : null,
      })),
    });
  } catch (err) {
    console.error("[GET /api/v1/operators]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = OnboardingProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const existingOperator = await findOperatorByUserId(session.userId);

    // Ensure territory exists
    const territory = await findOrCreateTerritory({
      name: data.destinationRegion,
      country: data.country,
    });

    if (existingOperator) {
      const updated = await updateOperator(existingOperator.id, {
        legalName: data.legalName,
        tradingName: data.tradingName,
        country: data.country,
        destinationRegion: data.destinationRegion,
        territory: { connect: { id: territory.id } },
        operatorType: data.operatorType as any,
        yearOperationStart: data.yearOperationStart,
        website: data.website,
        primaryContactName: data.primaryContactName,
        primaryContactEmail: data.primaryContactEmail,
        accommodationCategory: data.accommodationCategory,
        rooms: data.rooms,
        bedCapacity: data.bedCapacity,
        experienceTypes: data.experienceTypes ?? [],
        ownershipType: data.ownershipType,
        localEquityPct: data.localEquityPct,
        isChainMember: data.isChainMember ?? false,
        chainName: data.chainName,
      });

      await logAuditEvent({
        actor: session.userId,
        actorRole: session.role,
        action: "operator.updated",
        entityType: "Operator",
        entityId: updated.id,
      });

      return NextResponse.json({ operator: updated }, { status: 200 });
    } else {
      const created = await createOperator({
        user: { connect: { id: session.userId } },
        legalName: data.legalName,
        tradingName: data.tradingName,
        country: data.country,
        destinationRegion: data.destinationRegion,
        territory: { connect: { id: territory.id } },
        operatorType: data.operatorType as any,
        yearOperationStart: data.yearOperationStart,
        website: data.website,
        primaryContactName: data.primaryContactName,
        primaryContactEmail: data.primaryContactEmail,
        accommodationCategory: data.accommodationCategory,
        rooms: data.rooms,
        bedCapacity: data.bedCapacity,
        experienceTypes: data.experienceTypes ?? [],
        ownershipType: data.ownershipType,
        localEquityPct: data.localEquityPct,
        isChainMember: data.isChainMember ?? false,
        chainName: data.chainName,
      });

      await logAuditEvent({
        actor: session.userId,
        actorRole: session.role,
        action: "operator.created",
        entityType: "Operator",
        entityId: created.id,
      });

      return NextResponse.json({ operator: created }, { status: 201 });
    }
  } catch (err) {
    console.error("[POST /api/v1/operators]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
