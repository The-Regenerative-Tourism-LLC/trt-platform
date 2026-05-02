import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { resolve, normalize } from "path";
import { requireSession } from "@/lib/auth/session";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
  gif: "image/gif",
};

// Only serves files in local dev (STORAGE_DRIVER=local or unset)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  if (process.env.STORAGE_DRIVER === "s3") {
    return new NextResponse(null, { status: 404 });
  }

  const { path } = await params;

  if (path.some((segment) => segment.includes("..") || segment.includes("\0"))) {
    return new NextResponse(null, { status: 400 });
  }

  const isEvidence = path[0] === "operators" && path[2] === "evidence";
  if (isEvidence) {
    try {
      await requireSession();
    } catch {
      return new NextResponse(null, { status: 401 });
    }
  }

  const baseDir = resolve(
    process.cwd(),
    process.env.STORAGE_LOCAL_DIR ?? "storage"
  );

  const filePath = resolve(baseDir, normalize(path.join("/")));

  if (!filePath.startsWith(baseDir + "/") && filePath !== baseDir) {
    return new NextResponse(null, { status: 400 });
  }

  try {
    const file = await readFile(filePath);

    const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";

    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": isEvidence
          ? "private, no-store"
          : "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
