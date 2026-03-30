/**
 * PUT /api/v1/operator/profile
 *
 * Updates structured Operator profile fields directly on the Operator table.
 * All fields are optional — supports progressive/partial saves.
 *
 * Authentication: operator role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  findOperatorByUserId,
  updateOperator,
} from "@/lib/db/repositories/operator.repo";
import { z } from "zod";

const OperatorProfileUpdateSchema = z.object({
  legalName: z.string().min(1).optional(),
  tradingName: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  destinationRegion: z.string().optional().nullable(),
  territoryId: z.string().optional().nullable(),
  operatorType: z.enum(["A", "B", "C"]).optional().nullable(),
  yearOperationStart: z.number().int().min(1900).max(2100).optional().nullable(),
  website: z.string().optional().nullable(),
  primaryContactName: z.string().optional().nullable(),
  primaryContactEmail: z.string().email().optional().or(z.literal("")).or(z.null()),
  accommodationCategory: z.string().optional().nullable(),
  rooms: z.number().int().nonnegative().optional().nullable(),
  bedCapacity: z.number().int().nonnegative().optional().nullable(),
  experienceTypes: z.array(z.string()).optional().nullable(),
  ownershipType: z.string().optional().nullable(),
  localEquityPct: z.number().min(0).max(100).optional().nullable(),
  isChainMember: z.boolean().optional(),
  chainName: z.string().optional().nullable(),
});

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = OperatorProfileUpdateSchema.safeParse(body);
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

    // Prisma scalar list fields require { set: value } syntax in updates.
    const { experienceTypes, ...rest } = parsed.data;
    const updateData = {
      ...rest,
      ...(experienceTypes !== undefined
        ? { experienceTypes: { set: experienceTypes ?? [] } }
        : {}),
    };

    const updated = await updateOperator(operator.id, updateData);

    return NextResponse.json({
      operator: {
        id: updated.id,
        legalName: updated.legalName,
        tradingName: updated.tradingName,
        country: updated.country,
        destinationRegion: updated.destinationRegion,
        territoryId: updated.territoryId,
        operatorType: updated.operatorType,
        yearOperationStart: updated.yearOperationStart,
        website: updated.website,
        primaryContactName: updated.primaryContactName,
        primaryContactEmail: updated.primaryContactEmail,
        accommodationCategory: updated.accommodationCategory,
        rooms: updated.rooms,
        bedCapacity: updated.bedCapacity,
        experienceTypes: updated.experienceTypes,
        ownershipType: updated.ownershipType,
        localEquityPct: updated.localEquityPct,
        isChainMember: updated.isChainMember,
        chainName: updated.chainName,
      },
    });
  } catch (err) {
    console.error("[PUT /api/v1/operator/profile]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
