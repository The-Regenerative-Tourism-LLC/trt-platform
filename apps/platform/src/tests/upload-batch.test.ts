/**
 * Upload batch logic tests — exercises the extracted uploadPhotoBatch and
 * fetchCurrentPhotos functions in pure Node, without mounting React.
 *
 * These tests prove the behaviors that were at the root of the photo upload bug:
 *   - Partial batch: already-confirmed photos are preserved when a later one fails
 *   - Presign-level limit: stop before PUT, no file reaches storage
 *   - Hydration: fetchCurrentPhotos returns photos regardless of initial count
 *   - Cover: first photo is set as cover; subsequent uploads don't override it
 *   - Orphan cleanup: called when confirm fails after a successful PUT
 */

import { describe, it, expect, vi } from "vitest";
import {
  uploadPhotoBatch,
  fetchCurrentPhotos,
  type UploadBatchDeps,
  type UploadFileEntry,
  type PhotoRef,
} from "@/lib/photos/upload-batch";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(name: string, type = "image/jpeg", size = 512000): UploadFileEntry {
  return {
    name,
    type,
    size,
    arrayBuffer: async () => new ArrayBuffer(8),
  };
}

function makePhoto(id: string, isCover = false): PhotoRef {
  return {
    id,
    url: `operators/op/photos/${id}.jpg`,
    storageKey: `operators/op/photos/${id}.jpg`,
    isCover,
  };
}

// Deterministic sha256 stub — always returns the same hex string
const SHA256_STUB = "a".repeat(64);
const stubSha256: UploadBatchDeps["sha256hex"] = async () => SHA256_STUB;

function makePresignOk(key: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ key, signedUrl: "https://storage/put-url" }),
  });
}

function makePresignLimit() {
  return vi.fn().mockResolvedValue({
    ok: false,
    status: 422,
    json: async () => ({ error: "Photo limit reached. Max 10 photos per operator." }),
  });
}

function makePutOk() {
  return vi.fn().mockResolvedValue({ ok: true });
}

function makeConfirmOk(id: string, storageKey: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({
      id,
      storageKey,
      signedUrl: `https://cdn.example.com/${id}.jpg`,
      fileName: `${id}.jpg`,
    }),
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("uploadPhotoBatch — basic success", () => {
  it("regression: single photo upload succeeds, cover is set, state updated", async () => {
    const key = "operators/op/photos/photo1.jpg";
    const onPhotoSaved = vi.fn();
    const onError = vi.fn();
    const setCover = vi.fn();
    const cleanupOrphan = vi.fn();

    const deps: UploadBatchDeps = {
      presign: makePresignOk(key),
      putToStorage: makePutOk(),
      confirmPhoto: makeConfirmOk("photo1", key),
      setCover,
      cleanupOrphan,
      onPhotoSaved,
      onError,
      sha256hex: stubSha256,
    };

    const count = await uploadPhotoBatch([makeFile("photo1.jpg")], [], deps);

    expect(count).toBe(1);
    expect(onError).not.toHaveBeenCalled();
    expect(setCover).toHaveBeenCalledWith("photo1");
    expect(cleanupOrphan).not.toHaveBeenCalled();
    expect(onPhotoSaved).toHaveBeenCalledOnce();

    const [newPhoto, , allPhotos] = onPhotoSaved.mock.calls[0] as [PhotoRef, string, PhotoRef[]];
    expect(newPhoto.id).toBe("photo1");
    expect(newPhoto.isCover).toBe(true);
    expect(allPhotos).toHaveLength(1);
    expect(allPhotos[0].id).toBe("photo1");
  });

  it("second photo is not set as cover when operator already has photos", async () => {
    const key2 = "operators/op/photos/photo2.jpg";
    const onPhotoSaved = vi.fn();
    const setCover = vi.fn();

    const deps: UploadBatchDeps = {
      presign: makePresignOk(key2),
      putToStorage: makePutOk(),
      confirmPhoto: makeConfirmOk("photo2", key2),
      setCover,
      cleanupOrphan: vi.fn(),
      onPhotoSaved,
      onError: vi.fn(),
      sha256hex: stubSha256,
    };

    // Operator already has 1 photo
    await uploadPhotoBatch([makeFile("photo2.jpg")], [makePhoto("photo1", true)], deps);

    expect(setCover).not.toHaveBeenCalled();
    const [newPhoto, , allPhotos] = onPhotoSaved.mock.calls[0] as [PhotoRef, string, PhotoRef[]];
    expect(newPhoto.isCover).toBe(false);
    expect(allPhotos).toHaveLength(2);
  });
});

describe("uploadPhotoBatch — partial batch: photos 1 succeeds, photo 2 confirm fails", () => {
  it("photo 1 is saved in state; error is set; photo 3 is never attempted", async () => {
    const key1 = "operators/op/photos/photo1.jpg";
    const key2 = "operators/op/photos/photo2.jpg";

    const onPhotoSaved = vi.fn();
    const onError = vi.fn();
    const cleanupOrphan = vi.fn();

    // presign: photo1 ok, photo2 ok (limit not checked at presign in this scenario)
    const presign = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ key: key1, signedUrl: "https://s/p1" }) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ key: key2, signedUrl: "https://s/p2" }) });

    // confirm: photo1 ok, photo2 fails (DB limit hit between uploads)
    const confirmPhoto = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 201, json: async () => ({ id: "photo1", storageKey: key1, signedUrl: "https://cdn/p1.jpg" }) })
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ error: "Photo limit reached. Max 10 photos per operator." }) });

    const deps: UploadBatchDeps = {
      presign,
      putToStorage: makePutOk(),
      confirmPhoto,
      setCover: vi.fn(),
      cleanupOrphan,
      onPhotoSaved,
      onError,
      sha256hex: stubSha256,
    };

    const count = await uploadPhotoBatch(
      [makeFile("photo1.jpg"), makeFile("photo2.jpg"), makeFile("photo3.jpg")],
      [],
      deps
    );

    // Only 1 confirmed
    expect(count).toBe(1);
    // photo1 was saved
    expect(onPhotoSaved).toHaveBeenCalledOnce();
    const [, , allPhotos] = onPhotoSaved.mock.calls[0] as [PhotoRef, string, PhotoRef[]];
    expect(allPhotos).toHaveLength(1);
    expect(allPhotos[0].id).toBe("photo1");

    // photo3 was never even attempted
    expect(presign).toHaveBeenCalledTimes(2);
    expect(confirmPhoto).toHaveBeenCalledTimes(2);

    // orphan cleanup triggered for photo2 (PUT succeeded but confirm failed)
    expect(cleanupOrphan).toHaveBeenCalledWith(key2);

    // error reported
    expect(onError).toHaveBeenCalledWith("Photo limit reached. Max 10 photos per operator.");
  });
});

describe("uploadPhotoBatch — presign limit blocks upload before PUT", () => {
  it("operator at limit: presign returns 422, no PUT attempted, no orphan", async () => {
    const onPhotoSaved = vi.fn();
    const onError = vi.fn();
    const putToStorage = makePutOk();
    const cleanupOrphan = vi.fn();

    const deps: UploadBatchDeps = {
      presign: makePresignLimit(),
      putToStorage,
      confirmPhoto: vi.fn(),
      setCover: vi.fn(),
      cleanupOrphan,
      onPhotoSaved,
      onError,
      sha256hex: stubSha256,
    };

    const count = await uploadPhotoBatch([makeFile("photo.jpg")], [], deps);

    expect(count).toBe(0);
    expect(putToStorage).not.toHaveBeenCalled();
    expect(cleanupOrphan).not.toHaveBeenCalled();
    expect(onPhotoSaved).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith("Photo limit reached. Max 10 photos per operator.");
  });

  it("operator with 9 photos uploading 2: first succeeds, second presign is blocked", async () => {
    const key1 = "operators/op/photos/photo-new1.jpg";
    const onPhotoSaved = vi.fn();
    const onError = vi.fn();

    // presign: first succeeds (9 < 10), second fails (10 >= 10)
    const presign = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ key: key1, signedUrl: "https://s/p1" }) })
      .mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ error: "Photo limit reached. Max 10 photos per operator." }) });

    const deps: UploadBatchDeps = {
      presign,
      putToStorage: makePutOk(),
      confirmPhoto: makeConfirmOk("photo-new1", key1),
      setCover: vi.fn(),
      cleanupOrphan: vi.fn(),
      onPhotoSaved,
      onError,
      sha256hex: stubSha256,
    };

    // Operator already has 9 photos
    const existing = Array.from({ length: 9 }, (_, i) => makePhoto(`existing-${i}`, i === 0));
    const count = await uploadPhotoBatch([makeFile("new1.jpg"), makeFile("new2.jpg")], existing, deps);

    expect(count).toBe(1);
    expect(onPhotoSaved).toHaveBeenCalledOnce();
    const [, , allPhotos] = onPhotoSaved.mock.calls[0] as [PhotoRef, string, PhotoRef[]];
    expect(allPhotos).toHaveLength(10); // 9 existing + 1 new
    expect(onError).toHaveBeenCalledWith("Photo limit reached. Max 10 photos per operator.");
    // Presign called twice — once for each file
    expect(presign).toHaveBeenCalledTimes(2);
  });
});

describe("uploadPhotoBatch — orphan cleanup on unexpected error", () => {
  it("calls cleanupOrphan when PUT succeeds but confirm throws", async () => {
    const key = "operators/op/photos/orphan.jpg";
    const cleanupOrphan = vi.fn();
    const onError = vi.fn();

    const confirmPhoto = vi.fn().mockRejectedValue(new Error("Network failure"));

    const deps: UploadBatchDeps = {
      presign: makePresignOk(key),
      putToStorage: makePutOk(),
      confirmPhoto,
      setCover: vi.fn(),
      cleanupOrphan,
      onPhotoSaved: vi.fn(),
      onError,
      sha256hex: stubSha256,
    };

    await uploadPhotoBatch([makeFile("orphan.jpg")], [], deps);

    expect(cleanupOrphan).toHaveBeenCalledWith(key);
    expect(onError).toHaveBeenCalledWith("Network failure");
  });
});

// ── fetchCurrentPhotos tests ──────────────────────────────────────────────────

describe("fetchCurrentPhotos — hydration behavior", () => {
  it("returns ok:true with photos and signedUrls when backend has photos (draft was empty)", async () => {
    const backendPhotos = [
      { id: "p1", storageKey: "operators/op/photos/p1.jpg", signedUrl: "https://cdn/p1.jpg", isCover: true, fileName: "p1.jpg" },
      { id: "p2", storageKey: "operators/op/photos/p2.jpg", signedUrl: "https://cdn/p2.jpg", isCover: false, fileName: "p2.jpg" },
    ];

    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => backendPhotos,
    });

    const result = await fetchCurrentPhotos(fetcher);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    expect(result.refs).toHaveLength(2);
    expect(result.refs[0]).toMatchObject({ id: "p1", isCover: true, storageKey: "operators/op/photos/p1.jpg" });
    expect(result.refs[1]).toMatchObject({ id: "p2", isCover: false });
    expect(result.signedUrls).toEqual({
      p1: "https://cdn/p1.jpg",
      p2: "https://cdn/p2.jpg",
    });
    // Fetcher is always called regardless of local draft state — no guard
    expect(fetcher).toHaveBeenCalledWith("/api/v1/operator/photos");
  });

  it("returns ok:true with empty refs when operator has 0 photos", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    const result = await fetchCurrentPhotos(fetcher);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refs).toHaveLength(0);
      expect(result.signedUrls).toEqual({});
    }
  });

  it("returns ok:false (never throws) when fetch fails — caller must preserve local state", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("Network error"));

    const result = await fetchCurrentPhotos(fetcher);

    // ok:false signals the component to NOT overwrite existing photoRefs
    expect(result.ok).toBe(false);
  });

  it("returns ok:false when backend returns non-ok status", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, json: async () => [] });

    const result = await fetchCurrentPhotos(fetcher);

    expect(result.ok).toBe(false);
  });

  it("returns ok:false when backend returns a non-array body", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ error: "unexpected" }),
    });

    const result = await fetchCurrentPhotos(fetcher);

    expect(result.ok).toBe(false);
  });

  it("always calls the API — does not skip when photoRefs would be empty", async () => {
    // Documents that the old `if (photos.length === 0) return` guard is gone.
    // fetchCurrentPhotos is called unconditionally; on ok:true the component syncs.
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        { id: "p1", storageKey: "operators/op/photos/p1.jpg", signedUrl: "https://cdn/p1.jpg", isCover: true },
      ],
    });

    const result = await fetchCurrentPhotos(fetcher);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("expected ok");
    // Even if local photoRefs was [], backend photos are returned and unblock Next
    expect(result.refs).toHaveLength(1);
    expect(result.refs[0].isCover).toBe(true);
    expect(fetcher).toHaveBeenCalledOnce();
  });

  it("ok:false on network error — component preserves existing photoRefs in store", async () => {
    // This is the regression guard: if the API call fails transiently,
    // the component must NOT call updateField({photoRefs:[]}) and zero out state.
    const fetcher = vi.fn().mockRejectedValue(new Error("timeout"));

    const result = await fetchCurrentPhotos(fetcher);

    // Caller checks result.ok before touching state
    expect(result.ok).toBe(false);
    // No refs or signedUrls to apply — state is left intact
  });
});
