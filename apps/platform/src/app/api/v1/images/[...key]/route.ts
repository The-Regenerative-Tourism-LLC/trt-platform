/**
 * GET /api/v1/images/[...key]
 *
 * Backend proxy for private Railway bucket objects.
 * Railway buckets have no public URLs — this route fetches the object from S3
 * and streams it to the client with caching headers.
 * Only active when STORAGE_DRIVER=s3.
 */

import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

// Only allow safe key characters — no path traversal
const ALLOWED_KEY_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(jpg|jpeg|png|webp|pdf)$/;

function getS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  if (process.env.STORAGE_DRIVER !== "s3") {
    return new NextResponse(null, { status: 404 });
  }

  const { key: keySegments } = await params;
  const key = keySegments.join("/");

  if (!ALLOWED_KEY_PATTERN.test(key)) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const client = getS3Client();
    const object = await client.send(
      new GetObjectCommand({
        Bucket: process.env.STORAGE_BUCKET!,
        Key: key,
      })
    );

    if (!object.Body) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(object.Body as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": object.ContentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err: unknown) {
    const code =
      (err as { Code?: string })?.Code ??
      (err as { name?: string })?.name;
    if (code === "NoSuchKey" || code === "NotFound") {
      return new NextResponse(null, { status: 404 });
    }
    console.error("[GET /api/v1/images]", err);
    return new NextResponse(null, { status: 500 });
  }
}
