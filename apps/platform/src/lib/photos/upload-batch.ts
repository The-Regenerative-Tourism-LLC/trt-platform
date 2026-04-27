/**
 * Photo upload batch logic — extracted from PhotosStep so it can be unit-tested
 * independently of the React component.
 *
 * The function processes files sequentially and calls `onPhotoSaved` after every
 * successful upload so that the caller can persist each photo immediately.
 * On the first failure it calls `onError` and stops — already-saved photos are
 * preserved by the caller.
 */

export interface PhotoRef {
  id: string;
  url: string;
  storageKey: string;
  isCover: boolean;
  fileName?: string;
}

export interface UploadBatchDeps {
  /** POST /api/v1/storage/presign */
  presign: (body: {
    resourceType: "photo";
    contentType: string;
    sizeBytes: number;
    checksum: string;
  }) => Promise<{ ok: boolean; status: number; json: () => Promise<{ key?: string; signedUrl?: string; error?: string }> }>;

  /** PUT to the presigned URL */
  putToStorage: (url: string, file: Blob, contentType: string) => Promise<{ ok: boolean }>;

  /** POST /api/v1/operator/photos */
  confirmPhoto: (body: {
    key: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    checksum: string;
  }) => Promise<{ ok: boolean; status: number; json: () => Promise<PhotoConfirmResponse> }>;

  /** POST /api/v1/operator/photos/:id/set-cover — fire-and-forget */
  setCover: (photoId: string) => void;

  /** DELETE /api/v1/storage/presign?key=... — fire-and-forget orphan cleanup */
  cleanupOrphan: (key: string) => void;

  /**
   * Called after each successfully confirmed photo.
   * `allPhotos` is the full accumulated list including all previously saved photos.
   * Use this to call `updateField({ photoRefs: allPhotos })` so each success is persisted immediately.
   */
  onPhotoSaved: (newPhoto: PhotoRef, signedUrl: string, allPhotos: PhotoRef[]) => void;

  /** Called once on the first error — stops processing */
  onError: (message: string) => void;

  /** SHA-256 digest of a file buffer (injectable for testability) */
  sha256hex: (buffer: ArrayBuffer) => Promise<string>;
}

interface PhotoConfirmResponse {
  id?: string;
  storageKey?: string;
  signedUrl?: string;
  fileName?: string;
  error?: string;
}

export interface UploadFileEntry {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
}

/**
 * Upload a batch of files sequentially.
 * Returns the number of files successfully confirmed.
 */
export async function uploadPhotoBatch(
  files: UploadFileEntry[],
  currentPhotos: PhotoRef[],
  deps: UploadBatchDeps
): Promise<number> {
  let savedCount = 0;
  let accumulated = [...currentPhotos];

  for (const file of files) {
    let pendingKey: string | null = null;

    try {
      const buffer = await file.arrayBuffer();
      const checksumHex = await deps.sha256hex(buffer);

      const presignRes = await deps.presign({
        resourceType: "photo",
        contentType: file.type,
        sizeBytes: file.size,
        checksum: checksumHex,
      });

      if (!presignRes.ok) {
        const body = await presignRes.json();
        deps.onError(body.error ?? `Failed to get upload URL (${presignRes.status})`);
        break;
      }

      const { key, signedUrl: putUrl } = await presignRes.json();
      if (!key || !putUrl) {
        deps.onError("Invalid presign response");
        break;
      }
      pendingKey = key;

      const uploadRes = await deps.putToStorage(putUrl, new Blob([buffer], { type: file.type }), file.type);
      if (!uploadRes.ok) throw new Error("File upload failed");

      const confirmRes = await deps.confirmPhoto({
        key,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        checksum: checksumHex,
      });

      if (!confirmRes.ok) {
        const body = await confirmRes.json();
        deps.cleanupOrphan(key);
        pendingKey = null;
        deps.onError(body.error ?? `Upload failed (${confirmRes.status})`);
        break;
      }

      const photo = await confirmRes.json();
      if (!photo.id || !photo.storageKey) {
        deps.cleanupOrphan(key);
        pendingKey = null;
        deps.onError("Invalid confirm response");
        break;
      }
      pendingKey = null;

      const isFirstPhoto = accumulated.length === 0;
      if (isFirstPhoto) deps.setCover(photo.id);

      const ref: PhotoRef = {
        id: photo.id,
        url: photo.storageKey,
        storageKey: photo.storageKey,
        isCover: isFirstPhoto,
        fileName: photo.fileName,
      };

      accumulated = [...accumulated, ref];
      deps.onPhotoSaved(ref, photo.signedUrl ?? "", accumulated);
      savedCount++;
    } catch (err) {
      if (pendingKey) deps.cleanupOrphan(pendingKey);
      deps.onError(err instanceof Error ? err.message : "Upload failed");
      break;
    }
  }

  return savedCount;
}

export type FetchPhotosResult =
  | { ok: true; refs: PhotoRef[]; signedUrls: Record<string, string> }
  | { ok: false };

/**
 * Fetch existing photos from the backend and return a discriminated result.
 *
 * Returns `{ ok: true, refs, signedUrls }` only when the request succeeded and
 * a valid list was received (including an empty list when the operator has 0 photos).
 *
 * Returns `{ ok: false }` on any network error, non-ok status, or parse failure.
 * The caller must NOT overwrite local state on `ok: false` — the existing
 * photoRefs in the store/draft must be preserved.
 */
export async function fetchCurrentPhotos(
  fetcher: (url: string) => Promise<{ ok: boolean; json: () => Promise<BackendPhoto[]> }>
): Promise<FetchPhotosResult> {
  try {
    const res = await fetcher("/api/v1/operator/photos");
    if (!res.ok) return { ok: false };

    const list = await res.json();
    if (!Array.isArray(list)) return { ok: false };

    const refs: PhotoRef[] = list.map((p) => ({
      id: p.id,
      url: p.storageKey,
      storageKey: p.storageKey,
      isCover: p.isCover,
      fileName: p.fileName,
    }));
    const signedUrls: Record<string, string> = {};
    for (const p of list) signedUrls[p.id] = p.signedUrl;

    return { ok: true, refs, signedUrls };
  } catch {
    return { ok: false };
  }
}

interface BackendPhoto {
  id: string;
  storageKey: string;
  signedUrl: string;
  isCover: boolean;
  fileName?: string;
}
