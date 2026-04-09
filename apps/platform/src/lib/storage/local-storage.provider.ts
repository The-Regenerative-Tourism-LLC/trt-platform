import { createHash } from "crypto";
import { mkdir, writeFile, unlink, stat } from "fs/promises";
import { dirname, resolve, normalize } from "path";
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
  ObjectVerification,
  StorageBucket,
} from "./types";

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const dir = process.env.STORAGE_LOCAL_DIR ?? "storage";
    this.baseDir = resolve(process.cwd(), dir);
    this.publicBaseUrl =
      process.env.STORAGE_PUBLIC_BASE_URL ?? "http://localhost:3000/uploads";
  }

  private safeFilePath(key: string): string {
    const resolved = resolve(this.baseDir, normalize(key));
    if (!resolved.startsWith(this.baseDir + "/") && resolved !== this.baseDir) {
      throw new Error(`Invalid storage key: path traversal detected`);
    }
    return resolved;
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const filePath = this.safeFilePath(input.key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, input.body);

    const checksum = createHash("sha256").update(input.body).digest("hex");

    return { key: input.key, url: `${this.publicBaseUrl}/${input.key}`, checksum, size: input.body.length };
  }

  async delete(key: string, _bucket?: StorageBucket): Promise<void> {
    const filePath = this.safeFilePath(key);
    await unlink(filePath).catch((err) => {
      if (err?.code !== "ENOENT") {
        console.warn(`[storage:local] delete failed key=${key}`, err);
      }
    });
  }

  async getSignedUrl(key: string, operation: "get" | "put", _expiresInSeconds?: number, _contentType?: string, _sizeBytes?: number, _bucket?: StorageBucket, _checksumSHA256?: string): Promise<string> {
    if (operation === "put") {
      return `/api/v1/storage/local-upload/${key}`;
    }
    return `${this.publicBaseUrl}/${key}`;
  }

  async verifyObject(key: string, _bucket?: StorageBucket): Promise<ObjectVerification> {
    try {
      const filePath = this.safeFilePath(key);
      const info = await stat(filePath);
      return { exists: true, sizeBytes: info.size };
    } catch {
      return { exists: false, sizeBytes: null };
    }
  }
}
