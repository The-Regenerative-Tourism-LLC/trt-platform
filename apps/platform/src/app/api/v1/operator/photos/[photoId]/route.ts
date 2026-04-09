/**
 * DELETE /api/v1/operator/photos/[photoId]
 *
 * Deletes a photo for the authenticated operator.
 * 1. Verifies ownership.
 * 2. Deletes file from storage.
 * 3. Deletes DB record.
 * Storage deletion is best-effort — DB record is always removed.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { getStorageProvider } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/logger";

export async function DELETE(
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

    console.log(`[delete:photo] start photoId=${photoId} key=${photo.storageKey} operatorId=${operator.id}`);

    // Delete from storage (best-effort — don't let storage failure block DB cleanup)
    try {
      await getStorageProvider().delete(photo.storageKey, "public");
    } catch (err) {
      console.error(`[delete:photo] storage delete failed photoId=${photoId} key=${photo.storageKey}`, err);
    }

    // Delete and, if this was the cover, promote the next oldest photo to cover — atomically.
    await prisma.$transaction(async (tx) => {
      await tx.operatorPhoto.delete({ where: { id: photoId } });

      if (photo.isCover) {
        const next = await tx.operatorPhoto.findFirst({
          where: { operatorId: operator.id },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true },
        });
        if (next) {
          await tx.operatorPhoto.update({
            where: { id: next.id },
            data: { isCover: true },
          });
        }
      }
    });

    await logAuditEvent({
      actor: session.userId,
      action: "operator.photo.deleted",
      entityType: "OperatorPhoto",
      entityId: photoId,
      payload: { storageKey: photo.storageKey, operatorId: operator.id },
    });

    console.log(`[delete:photo] success photoId=${photoId} operatorId=${operator.id}`);

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[DELETE /api/v1/operator/photos/[photoId]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
