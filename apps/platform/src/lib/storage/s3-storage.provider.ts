import { createHash } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import type { StorageProvider, StorageUploadInput, StorageUploadResult } from "./types";

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET!;

    this.client = new S3Client({
      endpoint: process.env.STORAGE_ENDPOINT,
      region: process.env.STORAGE_REGION ?? "auto",
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
        secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const checksum = createHash("sha256").update(input.body).digest("hex");

    console.log(`[storage:s3] uploading key=${input.key} size=${input.body.length} bucket=${this.bucket}`);

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: input.key,
          Body: input.body,
          ContentType: input.contentType,
          CacheControl: input.cacheControl,
        })
      );
    } catch (err) {
      console.error(`[storage:s3] upload failed key=${input.key}`, err);
      throw err;
    }

    console.log(`[storage:s3] uploaded key=${input.key} checksum=${checksum}`);

    return {
      key: input.key,
      url: this.getPublicUrl(input.key),
      checksum,
      size: input.body.length,
    };
  }

  async delete(key: string): Promise<void> {
    console.log(`[storage:s3] deleting key=${key} bucket=${this.bucket}`);
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key })
      );
    } catch (err) {
      console.error(`[storage:s3] delete failed key=${key}`, err);
      throw err;
    }
  }

  getPublicUrl(key: string): string {
    // Railway buckets are private — serve via our backend proxy
    return `/api/v1/images/${key}`;
  }
}
