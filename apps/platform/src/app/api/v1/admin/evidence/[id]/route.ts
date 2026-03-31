/**
 * GET /api/v1/admin/evidence/[id]
 *
 * Returns a single EvidenceRef with operator and snapshot context.
 *
 * Authentication: admin role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { findEvidenceRefById } from "@/lib/db/repositories/evidence.repo";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("admin");

    const { id } = await params;
    const evidence = await findEvidenceRefById(id);

    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 });
    }

    return NextResponse.json({ evidence }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[GET /api/v1/admin/evidence/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
