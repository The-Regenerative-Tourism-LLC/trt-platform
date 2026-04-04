import type { StorageProvider } from "./types";
import { LocalStorageProvider } from "./local-storage.provider";
import { S3StorageProvider } from "./s3-storage.provider";
import { validateStorageEnv } from "./validate-env";

export * from "./types";
export { validateStorageEnv } from "./validate-env";

let _provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (_provider) return _provider;

  validateStorageEnv();

  const driver = process.env.STORAGE_DRIVER ?? "local";
  console.log(`[storage] initialising provider driver=${driver}`);

  _provider = driver === "s3" ? new S3StorageProvider() : new LocalStorageProvider();
  return _provider;
}

/** Reset singleton — only use in tests. */
export function _resetStorageProvider(): void {
  _provider = null;
}
