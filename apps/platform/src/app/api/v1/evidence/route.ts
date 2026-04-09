/**
 * POST /api/v1/evidence
 *
 * Deprecated. Use POST /api/v1/evidence/upload instead.
 * This route accepted arbitrary storagePath/checksum without object verification
 * and has been replaced by the two-step presign + confirm flow.
 */

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "This endpoint is deprecated. Use POST /api/v1/evidence/upload instead." },
    { status: 410 }
  );
}
