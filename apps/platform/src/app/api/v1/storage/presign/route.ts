import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { getStorageProvider } from "@/lib/storage";
import { prisma } from "@/lib/db/prisma";

const EVIDENCE_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const PUT_EXPIRY = 120;
const GET_EXPIRY = 300;

const KEY_PATTERN =
  /^operators\/[a-zA-Z0-9]+\/(evidence|photos)\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/;

const putSchema = z.object({
  resourceType: z.enum(["evidence", "photo"]),
  contentType: z.string().min(1),
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

    const body = await req.json();
    const parsed = putSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { resourceType, contentType, sizeBytes, checksum } = parsed.data;

    const allowedTypes = resourceType === "photo" ? PHOTO_MIME_TYPES : EVIDENCE_MIME_TYPES;
    if (!allowedTypes.has(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const maxBytes =
      resourceType === "photo"
        ? parseInt(process.env.STORAGE_MAX_PHOTO_BYTES ?? "10485760", 10)
        : parseInt(process.env.STORAGE_MAX_EVIDENCE_BYTES ?? "20971520", 10);

    if (sizeBytes > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxBytes / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[contentType];
    if (!ext) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
    }

    const folder = resourceType === "photo" ? "photos" : "evidence";
    const key = `operators/${operator.id}/${folder}/${randomUUID()}.${ext}`;
    const bucket = resourceType === "photo" ? "public" : "private";

    // S3/R2 ChecksumSHA256 requires base64; client sends hex — convert here
    const checksumBase64 = checksum
      ? Buffer.from(checksum, "hex").toString("base64")
      : undefined;

    const storage = getStorageProvider();
    const signedUrl = await storage.getSignedUrl(key, "put", PUT_EXPIRY, contentType, sizeBytes, bucket, checksumBase64);

    return NextResponse.json({ key, signedUrl });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/storage/presign]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || !KEY_PATTERN.test(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const keyOperatorId = key.split("/")[1];

    if (session.role !== "admin") {
      const operator = await findOperatorByUserId(session.userId);
      if (!operator || operator.id !== keyOperatorId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const resourceType = key.split("/")[2] as "evidence" | "photos";
    const bucket = resourceType === "photos" ? "public" : "private";

    // For private evidence: verify the key is registered in the DB before issuing a signed URL.
    // This prevents orphan/deleted objects from remaining downloadable via stale keys.
    if (resourceType === "evidence") {
      const registered = await prisma.evidenceRef.findFirst({
        where: { storageKey: key },
        select: { id: true },
      });
      if (!registered) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const storage = getStorageProvider();
    const verification = await storage.verifyObject(key, bucket);
    if (!verification.exists) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const signedUrl = await storage.getSignedUrl(key, "get", GET_EXPIRY, undefined, undefined, bucket);

    return NextResponse.json({ signedUrl });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[GET /api/v1/storage/presign]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
