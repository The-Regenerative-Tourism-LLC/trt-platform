import { createHash } from "crypto";
import { mkdir, writeFile, unlink } from "fs/promises";
import { dirname, resolve, normalize } from "path";
import type { StorageProvider, StorageUploadInput, StorageUploadResult } from "./types";

export class LocalStorageProvider implements StorageProvider {
  private readonly baseDir: string;
  private readonly publicBaseUrl: string;

  constructor() {
    const dir = process.env.STORAGE_LOCAL_DIR ?? "storage";
    // Always resolve to absolute path so file writes and the serve route agree
    this.baseDir = resolve(process.cwd(), dir);
    this.publicBaseUrl =
      process.env.STORAGE_PUBLIC_BASE_URL ?? "http://localhost:3000/uploads";
  }

  private safeFilePath(key: string): string {
    // Normalise and reject any key that escapes the base dir
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

    console.log(`[storage:local] uploaded key=${input.key} size=${input.body.length} checksum=${checksum}`);

    return {
      key: input.key,
      url: this.getPublicUrl(input.key),
      checksum,
      size: input.body.length,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.safeFilePath(key);
    await unlink(filePath).catch((err) => {
      if (err?.code !== "ENOENT") {
        console.warn(`[storage:local] delete failed key=${key}`, err);
      }
    });
    console.log(`[storage:local] deleted key=${key}`);
  }

  getPublicUrl(key: string): string {
    return `${this.publicBaseUrl}/${key}`;
  }
}
