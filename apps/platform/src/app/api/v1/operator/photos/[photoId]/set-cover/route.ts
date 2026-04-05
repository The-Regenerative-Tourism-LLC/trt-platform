/**
 * POST /api/v1/operator/photos/[photoId]/set-cover
 *
 * Sets a photo as the cover photo for the operator.
 * Atomically unsets any existing cover and sets this one.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/logger";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await requireSession();
    const { photoId } = await params;

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const photo = await prisma.operatorPhoto.findUnique({ where: { id: photoId } });
    if (!photo) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (photo.operatorId !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Atomic: unset all existing covers, then set this one
    await prisma.$transaction([
      prisma.operatorPhoto.updateMany({
        where: { operatorId: operator.id, isCover: true },
        data: { isCover: false },
      }),
      prisma.operatorPhoto.update({
        where: { id: photoId },
        data: { isCover: true },
      }),
    ]);

    await logAuditEvent({
      actor: session.userId,
      action: "operator.photo.set_cover",
      entityType: "OperatorPhoto",
      entityId: photoId,
      payload: { operatorId: operator.id },
    });

    return NextResponse.json({ id: photoId, isCover: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/operator/photos/[photoId]/set-cover]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
