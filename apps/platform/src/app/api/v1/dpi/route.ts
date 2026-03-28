/**
 * POST /api/v1/dpi
 *
 * Triggers a DPI computation for a territory.
 * Delegates entirely to the DPI orchestrator — no scoring logic here.
 *
 * Authentication: admin role required.
 */

import { NextRequest, NextResponse } from "next/server";
import { runDpiComputation } from "@/lib/orchestration/dpi-orchestrator";
import { ComputeDpiRequestSchema } from "@/lib/validation/dpi.schema";
import { requireRole } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRole("admin");

    const body = await req.json();
    const parsed = ComputeDpiRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await runDpiComputation(
      parsed.data.territoryId,
      session.userId
    );

    return NextResponse.json({ success: true, result }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof Error && err.message.startsWith("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    console.error("[POST /api/v1/dpi]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
