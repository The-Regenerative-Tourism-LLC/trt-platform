/**
 * POST /api/v1/operator/photos
 *
 * Upload a photo for the authenticated operator.
 * Accepts multipart/form-data with a single "file" field.
 * Validates file type (jpeg, png, webp) and size.
 * Storage key is always server-generated — original filename is never used as key.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { getStorageProvider } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";
import { logAuditEvent } from "@/lib/audit/logger";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function maxPhotoSize(): number {
  const v = process.env.STORAGE_MAX_PHOTO_BYTES;
  return v ? parseInt(v, 10) : 10 * 1024 * 1024; // 10 MB default
}

function maxOperatorPhotos(): number {
  const v = process.env.STORAGE_MAX_OPERATOR_PHOTOS;
  return v ? parseInt(v, 10) : 10; // 10 photos default
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Enforce photo count limit before reading body
    const photoCount = await prisma.operatorPhoto.count({ where: { operatorId: operator.id } });
    const limit = maxOperatorPhotos();
    if (photoCount >= limit) {
      return NextResponse.json(
        { error: `Photo limit reached. Max ${limit} photos per operator.` },
        { status: 422 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpeg, png, webp" },
        { status: 400 }
      );
    }

    const maxSize = maxPhotoSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const photoId = randomUUID();
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    // Storage key uses server-generated ID — never original filename
    const storageKey = `operators/${operator.id}/photos/${photoId}.${ext}`;

    console.log(`[upload:photo] start operatorId=${operator.id} key=${storageKey} size=${file.size}`);

    const body = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();

    let result;
    try {
      result = await storage.upload({
        key: storageKey,
        body,
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
      });
    } catch (err) {
      console.error(`[upload:photo] storage upload failed operatorId=${operator.id}`, err);
      throw err;
    }

    const photo = await prisma.operatorPhoto.create({
      data: {
        operatorId: operator.id,
        storageKey: result.key,
        url: result.url,
        // Store sanitised name for display only — never used as storage path
        fileName: sanitizeFileName(file.name),
        mimeType: file.type,
        sizeBytes: body.length,          // use actual buffer size, not File.size
        checksum: result.checksum ?? "",
      },
    });

    await logAuditEvent({
      actor: session.userId,
      action: "operator.photo.uploaded",
      entityType: "OperatorPhoto",
      entityId: photo.id,
      payload: { storageKey, mimeType: file.type, sizeBytes: body.length, checksum: result.checksum },
    });

    console.log(`[upload:photo] success photoId=${photo.id} operatorId=${operator.id}`);

    return NextResponse.json(
      {
        id: photo.id,
        url: photo.url,
        fileName: photo.fileName,
        mimeType: photo.mimeType,
        sizeBytes: photo.sizeBytes,
        isCover: photo.isCover,
        sortOrder: photo.sortOrder,
        createdAt: photo.createdAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/operator/photos]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** Strip path separators and control chars from display filename. */
function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|\x00-\x1f]/g, "_").slice(0, 255);
}
