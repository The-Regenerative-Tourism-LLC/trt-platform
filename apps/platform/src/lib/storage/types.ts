export interface StorageUploadInput {
  key: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
}

export interface StorageUploadResult {
  key: string;
  url: string;
  checksum?: string;
  size?: number;
}

export interface StorageProvider {
  upload(input: StorageUploadInput): Promise<StorageUploadResult>;
  delete(key: string): Promise<void>;
  getPublicUrl(key: string): string;
}
