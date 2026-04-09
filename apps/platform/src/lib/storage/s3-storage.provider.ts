import { createHash } from "crypto";
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl as presign } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  StorageUploadInput,
  StorageUploadResult,
  ObjectVerification,
  StorageBucket,
} from "./types";

const PUT_EXPIRY_SECONDS = 120;
const GET_EXPIRY_SECONDS = 300;

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucketPublic: string;
  private readonly bucketPrivate: string;

  constructor() {
    this.bucketPublic = process.env.STORAGE_BUCKET_PUBLIC!;
    this.bucketPrivate = process.env.STORAGE_BUCKET_PRIVATE!;

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

  private resolveBucket(bucket?: StorageBucket): string {
    return bucket === "public" ? this.bucketPublic : this.bucketPrivate;
  }

  async upload(input: StorageUploadInput): Promise<StorageUploadResult> {
    const checksum = createHash("sha256").update(input.body).digest("hex");
    const bucket = this.resolveBucket(input.bucket);

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ContentLength: input.body.length,
        CacheControl: input.cacheControl,
      })
    );

    return { key: input.key, checksum, size: input.body.length };
  }

  async delete(key: string, bucket?: StorageBucket): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.resolveBucket(bucket), Key: key })
    );
  }

  async getSignedUrl(
    key: string,
    operation: "get" | "put",
    expiresInSeconds?: number,
    contentType?: string,
    sizeBytes?: number,
    bucket?: StorageBucket,
    checksumSHA256?: string
  ): Promise<string> {
    const resolvedBucket = this.resolveBucket(bucket);

    if (operation === "put") {
      if (!contentType) throw new Error("contentType is required for PUT signed URLs");
      const expiry = Math.min(expiresInSeconds ?? PUT_EXPIRY_SECONDS, PUT_EXPIRY_SECONDS);
      const cmd = new PutObjectCommand({
        Bucket: resolvedBucket,
        Key: key,
        ContentType: contentType,
        ...(sizeBytes !== undefined ? { ContentLength: sizeBytes } : {}),
        ...(checksumSHA256 ? { ChecksumSHA256: checksumSHA256 } : {}),
      });
      return presign(this.client, cmd, { expiresIn: expiry });
    }

    if (resolvedBucket === this.bucketPublic) {
      const baseUrl = process.env.STORAGE_PUBLIC_BASE_URL!;
      return `${baseUrl}/${key}`;
    }

    const expiry = Math.min(expiresInSeconds ?? GET_EXPIRY_SECONDS, GET_EXPIRY_SECONDS);
    const cmd = new GetObjectCommand({ Bucket: resolvedBucket, Key: key });
    return presign(this.client, cmd, { expiresIn: expiry });
  }

  async verifyObject(key: string, bucket?: StorageBucket): Promise<ObjectVerification> {
    try {
      const result = await this.client.send(
        new HeadObjectCommand({ Bucket: this.resolveBucket(bucket), Key: key })
      );
      return { exists: true, sizeBytes: result.ContentLength ?? null };
    } catch (err: unknown) {
      const code =
        (err as { name?: string })?.name ??
        (err as { Code?: string })?.Code;
      const status = (err as { $metadata?: { httpStatusCode?: number } })?.$metadata
        ?.httpStatusCode;
      if (code === "NotFound" || code === "NoSuchKey" || status === 404) {
        return { exists: false, sizeBytes: null };
      }
      throw err;
    }
  }
}
