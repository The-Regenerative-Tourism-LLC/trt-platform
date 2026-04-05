/**
 * POST /api/v1/evidence/upload
 *
 * Upload a file as evidence for an assessment snapshot indicator.
 * Accepts multipart/form-data:
 *   - file: the evidence file (pdf, jpeg, png, webp)
 *   - assessmentSnapshotId: string
 *   - indicatorId: string
 *   - tier: T1 | T2 | T3 | Proxy
 *   - proxyMethod?: string
 *   - proxyCorrectionFactor?: number
 *
 * Checksum is computed server-side — frontend must NOT send it.
 * Storage key is always server-generated.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireSession } from "@/lib/auth/session";
import { findOperatorByUserId } from "@/lib/db/repositories/operator.repo";
import { findAssessmentSnapshotById } from "@/lib/db/repositories/assessment.repo";
import { createEvidenceRef } from "@/lib/db/repositories/evidence.repo";
import { getStorageProvider } from "@/lib/storage";
import { logAuditEvent } from "@/lib/audit/logger";

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

function maxEvidenceSize(): number {
  const configured = process.env.STORAGE_MAX_EVIDENCE_BYTES;
  return configured ? parseInt(configured, 10) : 20 * 1024 * 1024; // 20 MB default
}

const EvidenceTierValues = ["T1", "T2", "T3", "Proxy"] as const;

const metaSchema = z.object({
  assessmentSnapshotId: z.string().min(1),
  indicatorId: z.string().min(1),
  tier: z.enum(EvidenceTierValues),
  proxyMethod: z.string().optional(),
  proxyCorrectionFactor: z.coerce.number().min(0).max(1).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();

    const operator = await findOperatorByUserId(session.userId);
    if (!operator) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file field" }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: pdf, jpeg, png, webp" },
        { status: 400 }
      );
    }

    const maxSize = maxEvidenceSize();
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${Math.round(maxSize / 1024 / 1024)} MB` },
        { status: 400 }
      );
    }

    const parsed = metaSchema.safeParse({
      assessmentSnapshotId: formData.get("assessmentSnapshotId"),
      indicatorId: formData.get("indicatorId"),
      tier: formData.get("tier"),
      proxyMethod: formData.get("proxyMethod") ?? undefined,
      proxyCorrectionFactor: formData.get("proxyCorrectionFactor") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { assessmentSnapshotId, indicatorId, tier, proxyMethod, proxyCorrectionFactor } =
      parsed.data;

    // Ownership check
    const snapshot = await findAssessmentSnapshotById(assessmentSnapshotId);
    if (!snapshot || snapshot.operatorId !== operator.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ext = MIME_TO_EXT[file.type] ?? "bin";
    const evidenceId = randomUUID();
    // IMMUTABILITY: every upload generates a new UUID and storage key.
    // EvidenceRef records are append-only — storageKey is set once at creation and never updated.
    // This ensures a complete, tamper-evident audit trail required for certification.
    const storageKey = `operators/${operator.id}/evidence/${evidenceId}.${ext}`;

    console.log(`[upload:evidence] start operatorId=${operator.id} key=${storageKey} size=${file.size} tier=${tier}`);

    const body = Buffer.from(await file.arrayBuffer());
    const storage = getStorageProvider();

    let result;
    try {
      result = await storage.upload({ key: storageKey, body, contentType: file.type });
    } catch (err) {
      console.error(`[upload:evidence] storage upload failed operatorId=${operator.id}`, err);
      throw err;
    }

    const evidenceRef = await createEvidenceRef({
      assessmentSnapshot: { connect: { id: assessmentSnapshotId } },
      operator: { connect: { id: operator.id } },
      indicatorId,
      tier: tier as "T1" | "T2" | "T3" | "Proxy",
      fileName: sanitizeFileName(file.name),
      storageKey: result.key,
      storagePath: result.key,
      mimeType: file.type,
      sizeBytes: body.length,           // actual buffer size
      checksum: result.checksum ?? "",  // always server-computed
      proxyMethod,
      proxyCorrectionFactor,
    });

    await logAuditEvent({
      actor: session.userId,
      action: "evidence.uploaded",
      entityType: "EvidenceRef",
      entityId: evidenceRef.id,
      payload: {
        assessmentSnapshotId,
        indicatorId,
        tier,
        storageKey,
        checksum: result.checksum,
        sizeBytes: body.length,
      },
    });

    console.log(`[upload:evidence] success evidenceRefId=${evidenceRef.id} operatorId=${operator.id}`);

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
