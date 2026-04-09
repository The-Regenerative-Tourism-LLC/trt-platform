import "dotenv/config";
import { resolve, join } from "path";
import { existsSync, readdirSync, statSync } from "fs";
import { unlink } from "fs/promises";
import { PrismaClient } from "@prisma/client";
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type ListObjectsV2CommandOutput,
} from "@aws-sdk/client-s3";

const prisma = new PrismaClient();
const FIX = process.argv.includes("--fix");
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;

async function getKnownKeys(): Promise<{ photos: Set<string>; evidence: Set<string> }> {
  const [photos, evidence] = await Promise.all([
    prisma.operatorPhoto.findMany({ select: { storageKey: true } }),
    prisma.evidenceRef.findMany({
      where: { storageKey: { not: null } },
      select: { storageKey: true },
    }),
  ]);

  const photoKeys = new Set<string>();
  const evidenceKeys = new Set<string>();
  for (const p of photos) photoKeys.add(p.storageKey);
  for (const e of evidence) if (e.storageKey) evidenceKeys.add(e.storageKey);
  return { photos: photoKeys, evidence: evidenceKeys };
}

async function runLocal() {
  const storageDir = resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "storage");
  console.log(`\n[cleanup:local] Storage dir: ${storageDir}`);

  const { photos: photoKeys, evidence: evidenceKeys } = await getKnownKeys();
  const allKnownKeys = new Set([...photoKeys, ...evidenceKeys]);

  const photos = await prisma.operatorPhoto.findMany({
    select: { id: true, storageKey: true },
  });
  const missingPhotoIds: string[] = [];
  for (const photo of photos) {
    if (!existsSync(join(storageDir, photo.storageKey))) {
      console.warn(`  MISSING photo id=${photo.id} key=${photo.storageKey}`);
      missingPhotoIds.push(photo.id);
    }
  }
  if (missingPhotoIds.length === 0) {
    console.log(`  ✅ All ${photos.length} photo files present`);
  } else if (FIX) {
    await prisma.operatorPhoto.deleteMany({ where: { id: { in: missingPhotoIds } } });
    console.log(`  🔧 Deleted ${missingPhotoIds.length} orphaned OperatorPhoto DB records`);
  }

  const evidenceRefs = await prisma.evidenceRef.findMany({
    where: { storageKey: { not: null } },
    select: { id: true, storageKey: true },
  });
  const missingEvidence: string[] = [];
  for (const ref of evidenceRefs) {
    if (ref.storageKey && !existsSync(join(storageDir, ref.storageKey))) {
      console.warn(`  MISSING evidence id=${ref.id} key=${ref.storageKey}`);
      missingEvidence.push(ref.id);
    }
  }
  if (missingEvidence.length === 0) {
    console.log(`  ✅ All ${evidenceRefs.length} evidence files present`);
  } else {
    console.warn(`  ⚠️  ${missingEvidence.length} evidence files missing — manual review required`);
  }

  console.log("\n── Orphan files ──");
  const orphans: string[] = [];
  const now = Date.now();
  walkDir(storageDir, storageDir, (relPath, fullPath) => {
    if (!allKnownKeys.has(relPath)) {
      const mtimeMs = statSync(fullPath).mtimeMs;
      if (now - mtimeMs > ORPHAN_AGE_MS) {
        orphans.push(fullPath);
        console.warn(`  ORPHAN ${relPath}`);
      }
    }
  });

  if (orphans.length === 0) {
    console.log("  ✅ No orphan files found");
  } else if (FIX) {
    for (const f of orphans) await unlink(f).catch(() => {});
    console.log(`  🔧 Deleted ${orphans.length} orphan file(s)`);
  } else {
    console.warn(`  ⚠️  ${orphans.length} orphan file(s) older than 24h (run with --fix to delete)`);
  }
}

async function runS3() {
  const bucketPublic = process.env.STORAGE_BUCKET_PUBLIC!;
  const bucketPrivate = process.env.STORAGE_BUCKET_PRIVATE!;

  const client = new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION ?? "auto",
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });

  const { photos: photoKeys, evidence: evidenceKeys } = await getKnownKeys();
  const now = Date.now();

  await cleanupS3Bucket(client, bucketPublic, photoKeys, now, "public");
  await cleanupS3Bucket(client, bucketPrivate, evidenceKeys, now, "private");
}

async function cleanupS3Bucket(
  client: S3Client,
  bucket: string,
  knownKeys: Set<string>,
  now: number,
  label: string
) {
  console.log(`\n[cleanup:s3] Bucket (${label}): ${bucket}`);

  const orphanKeys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const res: ListObjectsV2CommandOutput = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        ContinuationToken: continuationToken,
      })
    );

    for (const obj of res.Contents ?? []) {
      const key = obj.Key;
      if (!key) continue;
      if (!knownKeys.has(key)) {
        const ageMs = now - (obj.LastModified?.getTime() ?? 0);
        if (ageMs > ORPHAN_AGE_MS) {
          orphanKeys.push(key);
          console.warn(`  ORPHAN ${key}`);
        }
      }
    }

    continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (continuationToken);

  if (orphanKeys.length === 0) {
    console.log("  ✅ No orphan objects found");
    return;
  }

  console.warn(`  ⚠️  ${orphanKeys.length} orphan object(s) older than 24h`);

  if (!FIX) {
    console.warn("  ℹ️  Run with --fix to delete them");
    return;
  }

  const BATCH = 1000;
  for (let i = 0; i < orphanKeys.length; i += BATCH) {
    const batch = orphanKeys.slice(i, i + BATCH).map((Key) => ({ Key }));
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch, Quiet: true },
      })
    );
  }
  console.log(`  🔧 Deleted ${orphanKeys.length} orphan object(s) from ${bucket}`);
}

function walkDir(root: string, dir: string, cb: (relPath: string, fullPath: string) => void) {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkDir(root, full, cb);
    } else {
      const rel = full.slice(root.length + 1).replace(/\\/g, "/");
      cb(rel, full);
    }
  }
}

async function main() {
  const driver = process.env.STORAGE_DRIVER ?? "local";
  console.log(`[cleanup] driver=${driver} fix=${FIX}`);

  if (driver === "local") {
    await runLocal();
  } else if (driver === "s3") {
    await runS3();
  } else {
    console.error(`❌ Unknown STORAGE_DRIVER="${driver}"`);
    process.exit(1);
  }

  console.log("\n[cleanup] Done.\n");
}

main()
  .catch((err) => {
    console.error("[cleanup] Error:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
