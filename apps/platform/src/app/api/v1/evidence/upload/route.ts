import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { findAssessmentSnapshotById } from "@/lib/db/repositories/assessment.repo";
import { createEvidenceRef } from "@/lib/db/repositories/evidence.repo";
import { getStorageProvider } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit/logger";
import { prisma } from "@/lib/db/prisma";

const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const KEY_PATTERN =
  /^operators\/[a-zA-Z0-9]+\/evidence\/[a-f0-9-]+\.(pdf|jpg|png|webp)$/;

const EvidenceTierValues = ["T1", "T2", "T3", "Proxy"] as const;

const bodySchema = z.object({
  key: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
  checksum: z.string().regex(/^[0-9a-f]{64}$/).optional(),
  assessmentSnapshotId: z.string().min(1),
  indicatorId: z.string().min(1),
  tier: z.enum(EvidenceTierValues),
  proxyMethod: z.string().optional(),
  proxyCorrectionFactor: z.number().min(0).max(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      key,
      fileName,
      mimeType,
      sizeBytes,
      checksum,
      assessmentSnapshotId,
      indicatorId,
      tier,
      proxyMethod,
      proxyCorrectionFactor,
    } = parsed.data;

    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: "Invalid mime type" },
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

    const snapshot = await findAssessmentSnapshotById(assessmentSnapshotId);
    if (!snapshot || snapshot.operatorId !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const maxBytes = parseInt(process.env.STORAGE_MAX_EVIDENCE_BYTES ?? "20971520", 10);
    if (sizeBytes > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxBytes / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const storage = getStorageProvider();
    const verification = await storage.verifyObject(key, "private");
    if (!verification.exists) {
      return NextResponse.json(
        { error: "Upload not found in storage. Upload the file before confirming." },
        { status: 422 }
      );
    }
    if (verification.sizeBytes !== null && verification.sizeBytes !== sizeBytes) {
      return NextResponse.json(
        { error: "File size mismatch" },
        { status: 422 }
      );
    }

    let evidenceRef: Awaited<ReturnType<typeof createEvidenceRef>>;
    try {
      evidenceRef = await createEvidenceRef({
        assessmentSnapshot: { connect: { id: assessmentSnapshotId } },
        operator: { connect: { id: operator.id } },
        indicatorId,
        tier: tier as "T1" | "T2" | "T3" | "Proxy",
        fileName: sanitizeFileName(fileName),
        storageKey: key,
        mimeType,
        sizeBytes,
        checksum: checksum ?? "",
        proxyMethod,
        proxyCorrectionFactor,
      });
    } catch (createErr: unknown) {
      if ((createErr as { code?: string })?.code === "P2002") {
        return NextResponse.json(
          { error: "This file has already been registered." },
          { status: 409 }
        );
      }
      throw createErr;
    }

    await logAuditEvent({
      actor: session.userId,
      action: "evidence.uploaded",
      entityType: "EvidenceRef",
      entityId: evidenceRef.id,
      payload: { assessmentSnapshotId, indicatorId, tier, storageKey: key, sizeBytes },
    });

    return NextResponse.json(
      {
        id: evidenceRef.id,
        indicatorId: evidenceRef.indicatorId,
        tier: evidenceRef.tier,
        fileName: evidenceRef.fileName,
        mimeType: evidenceRef.mimeType,
        sizeBytes: evidenceRef.sizeBytes,
        verificationState: evidenceRef.verificationState,
        submittedAt: evidenceRef.submittedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[POST /api/v1/evidence/upload]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|\x00-\x1f]/g, "_").slice(0, 255);
}
