export type StorageBucket = "public" | "private";

export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
  bucket?: StorageBucket;
}

export interface StorageUploadResult {
  key: string;
  url?: string;
  checksum?: string;
  size?: number;
}

export interface ObjectVerification {
  exists: boolean;
  sizeBytes: number | null;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string, bucket?: StorageBucket): Promise<void>;
  getSignedUrl(
    key: string,
    operation: "get" | "put",
    expiresInSeconds?: number,
    contentType?: string,
    sizeBytes?: number,
    bucket?: StorageBucket,
    checksumSHA256?: string
  ): Promise<string>;
  verifyObject(key: string, bucket?: StorageBucket): Promise<ObjectVerification>;
}
