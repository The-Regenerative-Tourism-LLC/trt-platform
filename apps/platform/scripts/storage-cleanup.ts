/**
 * Storage consistency check — local driver only.
 *
 * Usage:
 *   cd apps/platform
 *   npx tsx scripts/storage-cleanup.ts [--fix]
 *
 * Reports:
 *   - OperatorPhoto DB records with missing files on disk
 *   - EvidenceRef DB records with missing files on disk
 *   - Orphan files in storage dir (no matching DB record)
 *
 * --fix: deletes DB records for missing files (does NOT delete orphan files — manual review required)
 *
 * Only works with STORAGE_DRIVER=local.
 */

import "dotenv/config";
import { resolve, join } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const FIX = process.argv.includes("--fix");

async function main() {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  if (driver !== "local") {
    console.error("❌ storage-cleanup only supports STORAGE_DRIVER=local");
    process.exit(1);
  }

  const storageDir = resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "storage");
  console.log(`\n[cleanup] Storage dir: ${storageDir}`);
  console.log(`[cleanup] Fix mode: ${FIX}`);

  // ── 1. OperatorPhoto records with missing files ──────────────────────────

  console.log("\n── OperatorPhoto ──");
  const photos = await prisma.operatorPhoto.findMany({
    select: { id: true, operatorId: true, storageKey: true, fileName: true },
  });

  const missingPhotos: typeof photos = [];
  for (const photo of photos) {
    const filePath = join(storageDir, photo.storageKey);
    if (!existsSync(filePath)) {
      console.warn(`  MISSING  id=${photo.id} key=${photo.storageKey}`);
      missingPhotos.push(photo);
    }
  }

  if (missingPhotos.length === 0) {
    console.log(`  ✅ All ${photos.length} photo files accounted for`);
  } else {
    console.warn(`  ⚠️  ${missingPhotos.length}/${photos.length} photo files missing`);
    if (FIX) {
      const ids = missingPhotos.map((p) => p.id);
      await prisma.operatorPhoto.deleteMany({ where: { id: { in: ids } } });
      console.log(`  🔧 Deleted ${ids.length} orphaned OperatorPhoto DB records`);
    }
  }

  // ── 2. EvidenceRef records with missing files ────────────────────────────

  console.log("\n── EvidenceRef ──");
  const evidenceRefs = await prisma.evidenceRef.findMany({
    where: { storageKey: { not: null } },
    select: { id: true, operatorId: true, storageKey: true, fileName: true },
  });

  const missingEvidence: typeof evidenceRefs = [];
  for (const ref of evidenceRefs) {
    if (!ref.storageKey) continue;
    const filePath = join(storageDir, ref.storageKey);
    if (!existsSync(filePath)) {
      console.warn(`  MISSING  id=${ref.id} key=${ref.storageKey}`);
      missingEvidence.push(ref);
    }
  }

  if (missingEvidence.length === 0) {
    console.log(`  ✅ All ${evidenceRefs.length} evidence files accounted for`);
  } else {
    console.warn(`  ⚠️  ${missingEvidence.length}/${evidenceRefs.length} evidence files missing`);
    // Note: EvidenceRefs are immutable — we do NOT auto-delete them. Report only.
    console.warn(`  ℹ️  EvidenceRef records are immutable — manual review required`);
  }

  // ── 3. Orphan files (files without any DB record) ────────────────────────

  console.log("\n── Orphan files ──");

  const knownKeys = new Set([
    ...photos.map((p) => p.storageKey),
    ...evidenceRefs.filter((e) => e.storageKey).map((e) => e.storageKey!),
  ]);

  const orphans: string[] = [];
  walkDir(storageDir, storageDir, (relPath) => {
    if (!knownKeys.has(relPath)) {
      orphans.push(relPath);
    }
  });

  if (orphans.length === 0) {
    console.log("  ✅ No orphan files found");
  } else {
    console.warn(`  ⚠️  ${orphans.length} orphan file(s) found (no matching DB record):`);
    for (const f of orphans) {
      console.warn(`    ${f}`);
    }
    console.warn("  ℹ️  Orphan files require manual review before deletion");
  }

  console.log("\n[cleanup] Done.\n");
}

function walkDir(root: string, dir: string, cb: (relPath: string) => void) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkDir(root, full, cb);
    } else {
      // Relative to storage root, using forward slashes for key matching
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");
      cb(rel);
    }
  }
}

main()
  .catch((err) => {
    console.error("[cleanup] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
