import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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

const KEY_PATTERN =
  /^operators\/[a-zA-Z0-9]+\/photos\/[a-f0-9-]+\.(jpg|png|webp)$/;

function maxOperatorPhotos(): number {
  const v = process.env.STORAGE_MAX_OPERATOR_PHOTOS;
  return v ? parseInt(v, 10) : 10;
}

const bodySchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  checksum: z.string().regex(/^[0-9a-f]{64}$/).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const limit = maxOperatorPhotos();

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { key, fileName, mimeType, sizeBytes, checksum } = parsed.data;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: jpeg, png, webp" },
        { status: 400 }
      );
    }

    if (!KEY_PATTERN.test(key)) {
      return NextResponse.json({ error: "Invalid key format" }, { status: 400 });
    }

    const keyOperatorId = key.split("/")[1];
    if (keyOperatorId !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expectedExt = MIME_TO_EXT[mimeType];
    if (!key.endsWith(`.${expectedExt}`)) {
      return NextResponse.json({ error: "Key and mime type do not match" }, { status: 400 });
    }

    const maxSize = parseInt(process.env.STORAGE_MAX_PHOTO_BYTES ?? "10485760", 10);
    if (sizeBytes > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const verification = await storage.verifyObject(key, "public");
    if (!verification.exists) {
      return NextResponse.json(
        { error: "Upload not found in storage. Upload the file before confirming." },
        { status: 422 }
      );
    }
    if (verification.sizeBytes !== null && verification.sizeBytes !== sizeBytes) {
      return NextResponse.json({ error: "File size mismatch" }, { status: 422 });
    }

    // Enforce photo limit and uniqueness inside a serializable transaction so
    // concurrent confirms cannot both pass the count check.
    let photo: Awaited<ReturnType<typeof prisma.operatorPhoto.create>>;
    try {
      photo = await prisma.$transaction(async (tx) => {
        const count = await tx.operatorPhoto.count({
          where: { operatorId: operator.id },
        });
        if (count >= limit) {
          throw Object.assign(new Error("PHOTO_LIMIT"), { code: "PHOTO_LIMIT" });
        }
        return tx.operatorPhoto.create({
          data: {
            operatorId: operator.id,
            storageKey: key,
            url: key,
            fileName: sanitizeFileName(fileName),
            mimeType,
            sizeBytes,
            checksum: checksum ?? "",
          },
        });
      }, { isolationLevel: "Serializable" });
    } catch (txErr: unknown) {
      const code = (txErr as { code?: string })?.code;
      const msg = (txErr as { message?: string })?.message;
      if (code === "PHOTO_LIMIT" || msg === "PHOTO_LIMIT") {
        return NextResponse.json(
          { error: `Photo limit reached. Max ${limit} photos per operator.` },
          { status: 422 }
        );
      }
      // Unique constraint violation = duplicate confirm
      if (code === "P2002") {
        return NextResponse.json(
          { error: "This file has already been registered." },
          { status: 409 }
        );
      }
      throw txErr;
    }

    await logAuditEvent({
      actor: session.userId,
      action: "operator.photo.uploaded",
      entityType: "OperatorPhoto",
      entityId: photo.id,
      payload: { storageKey: key, mimeType, sizeBytes },
    });

    const signedUrl = await storage.getSignedUrl(key, "get", undefined, undefined, undefined, "public");

    return NextResponse.json(
      {
        id: photo.id,
        storageKey: key,
        signedUrl,
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

export async function GET(_req: NextRequest) {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const photos = await prisma.operatorPhoto.findMany({
      where: { operatorId: operator.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        storageKey: true,
        fileName: true,
        mimeType: true,
        sizeBytes: true,
        isCover: true,
        sortOrder: true,
        createdAt: true,
      },
    });

    const storage = getStorageProvider();
    const results = await Promise.all(
      photos.map(async (p) => {
        const verification = await storage.verifyObject(p.storageKey, "public");
        if (!verification.exists) return null;
        return {
          ...p,
          signedUrl: await storage.getSignedUrl(p.storageKey, "get", undefined, undefined, undefined, "public"),
        };
      })
    );

    return NextResponse.json(results.filter(Boolean));
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/operator/photos]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|\x00-\x1f]/g, "_").slice(0, 255);
}
