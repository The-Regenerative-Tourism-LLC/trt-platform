/**
 * Manual integration tests for the storage system.
 *
 * Prerequisites:
 *   - STORAGE_DRIVER=local in .env.local
 *   - Dev server running: npm run dev
 *   - Logged-in operator session cookie
 *
 * Usage:
 *   cd apps/platform
 *   AUTH_TOKEN="<authjs.session-token cookie value>" npx tsx scripts/test-storage.ts
 *
 * Optional:
 *   APP_URL=http://localhost:3000  (default)
 */

import "dotenv/config";
import { resolve, join } from "path";
import { existsSync } from "fs";
import { createHash } from "crypto";

const BASE_URL = process.env.APP_URL ?? "http://localhost:3000";
const AUTH_TOKEN = process.env.AUTH_TOKEN;

if (!AUTH_TOKEN) {
  console.error("❌ AUTH_TOKEN env var required");
  process.exit(1);
}

const authHeaders = { Cookie: `authjs.session-token=${AUTH_TOKEN}` };

let passed = 0;
let failed = 0;

function pass(msg: string) {
  console.log(`  ✅ ${msg}`);
  passed++;
}

function fail(msg: string) {
  console.error(`  ❌ ${msg}`);
  failed++;
}

// ── Test: LocalStorageProvider directly ─────────────────────────────────────

async function testLocalProvider() {
  console.log("\n── Test: LocalStorageProvider ──");

  process.env.STORAGE_DRIVER = "local";
  process.env.STORAGE_LOCAL_DIR = "storage";
  process.env.STORAGE_PUBLIC_BASE_URL = `${BASE_URL}/uploads`;
  delete process.env.STORAGE_BUCKET_PUBLIC;
  delete process.env.STORAGE_BUCKET_PRIVATE;

  const { _resetStorageProvider, getStorageProvider } = await import("../src/lib/storage/index.js");
  _resetStorageProvider();

  const provider = getStorageProvider();
  const key = `test/unit-${Date.now()}.txt`;
  const body = Buffer.from("storage integration test");

  const result = await provider.upload({ key, body, contentType: "text/plain" });

  // Verify checksum
  const expected = createHash("sha256").update(body).digest("hex");
  if (result.checksum === expected) {
    pass("checksum matches");
  } else {
    fail(`checksum mismatch: got ${result.checksum}`);
  }

  // Verify file on disk
  const storageDir = resolve(process.cwd(), process.env.STORAGE_LOCAL_DIR ?? "storage");
  const filePath = join(storageDir, key);
  if (existsSync(filePath)) {
    pass("file written to disk");
  } else {
    fail(`file not found at ${filePath}`);
  }

  if (result.size === body.length) {
    pass("size matches");
  } else {
    fail(`size mismatch: got ${result.size}`);
  }

  // Verify URL is reachable
  const fileUrl = result.url ?? `${process.env.STORAGE_PUBLIC_BASE_URL ?? `${BASE_URL}/uploads`}/${key}`;
  const resp = await fetch(fileUrl).catch(() => null);
  if (resp?.status === 200) {
    pass(`URL accessible: ${fileUrl}`);
  } else {
    fail(`URL ${fileUrl} returned ${resp?.status ?? "network error"} — is dev server running?`);
  }

  // Delete
  await provider.delete(key);
  if (!existsSync(filePath)) {
    pass("file deleted from disk");
  } else {
    fail("file should have been deleted");
  }

  _resetStorageProvider();
}

// ── Test: Photo upload API (presign + PUT + confirm) ────────────────────────

async function testPhotoUploadApi(): Promise<string | null> {
  console.log("\n── Test: Photo upload — presign + PUT + confirm ──");

  // Tiny 1×1 JPEG
  const tinyJpeg = Buffer.from(
    "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8U" +
    "HRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIA" +
    "AhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/xAAU" +
    "AQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8A" +
    "KwAB/9k=",
    "base64"
  );

  const checksumHex = createHash("sha256").update(tinyJpeg).digest("hex");
  const checksumBase64 = createHash("sha256").update(tinyJpeg).digest("base64");

  // Step 1: presign
  const presignResp = await fetch(`${BASE_URL}/api/v1/storage/presign`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceType: "photo",
      contentType: "image/jpeg",
      sizeBytes: tinyJpeg.length,
      checksum: checksumHex,
    }),
  });
  const presignData = await presignResp.json();
  if (presignResp.status !== 200 || !presignData.key || !presignData.signedUrl) {
    fail(`presign failed: ${presignResp.status} ${JSON.stringify(presignData)}`);
    return null;
  }
  pass(`presign ok key=${presignData.key}`);

  // Step 2: PUT to signed URL
  const putResp = await fetch(presignData.signedUrl as string, {
    method: "PUT",
    headers: {
      "Content-Type": "image/jpeg",
      "x-amz-checksum-sha256": checksumBase64,
    },
    body: tinyJpeg,
  });
  if (!putResp.ok) {
    fail(`PUT to signed URL failed: ${putResp.status}`);
    return null;
  }
  pass("PUT to signed URL ok");

  // Step 3: confirm
  const confirmResp = await fetch(`${BASE_URL}/api/v1/operator/photos`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      key: presignData.key,
      fileName: "test.jpg",
      mimeType: "image/jpeg",
      sizeBytes: tinyJpeg.length,
      checksum: checksumHex,
    }),
  });
  const confirmData = await confirmResp.json();
  if (confirmResp.status === 201 && confirmData.id) {
    pass(`confirm ok id=${confirmData.id}`);
    return confirmData.id as string;
  } else {
    fail(`confirm failed: ${confirmResp.status} ${JSON.stringify(confirmData)}`);
    return null;
  }
}

// ── Test: Set cover ──────────────────────────────────────────────────────────

async function testSetCover(photoId: string) {
  console.log("\n── Test: POST /api/v1/operator/photos/[id]/set-cover ──");

  const resp = await fetch(`${BASE_URL}/api/v1/operator/photos/${photoId}/set-cover`, {
    method: "POST",
    headers: authHeaders,
  });
  const data = await resp.json();

  if (resp.status === 200 && data.isCover === true) {
    pass("set-cover works");
  } else {
    fail(`set-cover failed: ${resp.status} ${JSON.stringify(data)}`);
  }
}

// ── Test: Delete photo ───────────────────────────────────────────────────────

async function testDeletePhoto(photoId: string) {
  console.log("\n── Test: DELETE /api/v1/operator/photos/[id] ──");

  const resp = await fetch(`${BASE_URL}/api/v1/operator/photos/${photoId}`, {
    method: "DELETE",
    headers: authHeaders,
  });

  if (resp.status === 204) {
    pass("delete returns 204");
  } else {
    const body = await resp.text();
    fail(`delete failed: ${resp.status} ${body}`);
    return;
  }

  // Confirm photo is gone
  const check = await fetch(`${BASE_URL}/api/v1/operator/photos/${photoId}`, {
    method: "DELETE",
    headers: authHeaders,
  });
  if (check.status === 404) {
    pass("deleted photo returns 404 on second delete");
  } else {
    fail(`expected 404 after delete, got ${check.status}`);
  }
}

// ── Test: Invalid MIME type rejection (via presign) ──────────────────────────

async function testInvalidMimeType() {
  console.log("\n── Test: Invalid MIME type rejection ──");

  const resp = await fetch(`${BASE_URL}/api/v1/storage/presign`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceType: "photo",
      contentType: "application/octet-stream",
      sizeBytes: 100,
    }),
  });

  if (resp.status === 400) {
    pass("invalid MIME type rejected with 400");
  } else {
    fail(`expected 400, got ${resp.status}`);
  }
}

// ── Test: Oversized file rejection (via presign) ──────────────────────────────

async function testOversizedFile() {
  console.log("\n── Test: Oversized file rejection ──");

  const overLimit = (parseInt(process.env.STORAGE_MAX_PHOTO_BYTES ?? "10485760", 10)) + 1;

  const resp = await fetch(`${BASE_URL}/api/v1/storage/presign`, {
    method: "POST",
    headers: { ...authHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({
      resourceType: "photo",
      contentType: "image/jpeg",
      sizeBytes: overLimit,
    }),
  });

  if (resp.status === 400) {
    pass("oversized file rejected with 400");
  } else {
    fail(`expected 400, got ${resp.status}`);
  }
}

// ── Test: Path traversal rejection ───────────────────────────────────────────

async function testPathTraversal() {
  console.log("\n── Test: Path traversal rejection ──");

  const paths = [
    "/uploads/../../../etc/passwd",
    "/uploads/%2e%2e%2f%2e%2e%2fetc%2fpasswd",
    "/uploads/..%2F..%2Fetc%2Fpasswd",
  ];

  for (const path of paths) {
    const resp = await fetch(`${BASE_URL}${path}`).catch(() => null);
    if (!resp || resp.status === 400 || resp.status === 404) {
      pass(`traversal blocked: ${path} → ${resp?.status ?? "no response"}`);
    } else {
      fail(`traversal NOT blocked: ${path} → ${resp.status}`);
    }
  }
}

// ── Test: Unauthenticated request rejection ───────────────────────────────────

async function testUnauthenticated() {
  console.log("\n── Test: Unauthenticated request ──");

  const resp = await fetch(`${BASE_URL}/api/v1/storage/presign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType: "photo", contentType: "image/jpeg", sizeBytes: 100 }),
  });

  if (resp.status === 401) {
    pass("unauthenticated request returns 401");
  } else {
    fail(`expected 401, got ${resp.status}`);
  }
}

// ── Run all ───────────────────────────────────────────────────────────────────

(async () => {
  console.log(`\nStorage integration tests — ${BASE_URL}\n`);

  try {
    await testLocalProvider();
  } catch (err) {
    fail(`LocalStorageProvider threw: ${err}`);
  }

  const photoId = await testPhotoUploadApi().catch((err) => {
    fail(`photo upload threw: ${err}`);
    return null;
  });

  if (photoId) {
    await testSetCover(photoId).catch((err) => fail(`set-cover threw: ${err}`));
    await testDeletePhoto(photoId).catch((err) => fail(`delete threw: ${err}`));
  }

  await testInvalidMimeType().catch((err) => fail(`invalid mime threw: ${err}`));
  await testOversizedFile().catch((err) => fail(`oversized threw: ${err}`));
  await testPathTraversal().catch((err) => fail(`traversal threw: ${err}`));
  await testUnauthenticated().catch((err) => fail(`unauth threw: ${err}`));

  console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);
  if (failed > 0) process.exit(1);
})();
