/**
 * GET /api/v1/admin/evidence/pending
 *
 * Returns the queue of evidence refs awaiting admin verification.
 * Results are ordered oldest-first to encourage FIFO processing.
 *
 * Authentication: admin role required.
 */

import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { findPendingEvidenceQueue } from "@/lib/db/repositories/evidence.repo";

export async function GET() {
  try {
    await requireRole("admin");

    const queue = await findPendingEvidenceQueue();

    return NextResponse.json({ items: queue, count: queue.length }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[GET /api/v1/admin/evidence/pending]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
