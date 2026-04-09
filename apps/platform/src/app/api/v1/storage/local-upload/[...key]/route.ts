import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { getStorageProvider } from "@/lib/storage";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const KEY_PATTERN =
  /^operators\/[a-zA-Z0-9]+\/(evidence|photos)\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/;

const MAX_EVIDENCE_BYTES = () =>
  parseInt(process.env.STORAGE_MAX_EVIDENCE_BYTES ?? "20971520", 10);
const MAX_PHOTO_BYTES = () =>
  parseInt(process.env.STORAGE_MAX_PHOTO_BYTES ?? "10485760", 10);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const session = await requireSession();

    const { key: keySegments } = await params;
    const key = keySegments.join("/");

    if (!KEY_PATTERN.test(key)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const keyParts = key.split("/");
    const keyOperatorId = keyParts[1];
    const resourceType = keyParts[2] as "evidence" | "photos";

    const operator = await findOperatorByUserId(session.userId);
    if (!operator || operator.id !== keyOperatorId) {
      return new NextResponse(null, { status: 403 });
    }

    const contentType = req.headers.get("content-type") ?? "";
    if (!ALLOWED_MIME_TYPES.has(contentType)) {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }

    const maxBytes =
      resourceType === "photos" ? MAX_PHOTO_BYTES() : MAX_EVIDENCE_BYTES();

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const arrayBuffer = await req.arrayBuffer();
    const body = Buffer.from(arrayBuffer);

    if (body.length > maxBytes) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    // Validate SHA-256 if the client included it (mirrors S3/R2 enforcement)
    const expectedChecksum = req.headers.get("x-amz-checksum-sha256");
    if (expectedChecksum) {
      const actual = createHash("sha256").update(body).digest("base64");
      if (actual !== expectedChecksum) {
        return NextResponse.json({ error: "Checksum mismatch" }, { status: 400 });
      }
    }

    const storage = getStorageProvider();
    await storage.upload({ key, body, contentType });

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[PUT /api/v1/storage/local-upload]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
