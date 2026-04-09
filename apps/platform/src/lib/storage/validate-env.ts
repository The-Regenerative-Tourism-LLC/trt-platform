export function validateStorageEnv(): void {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    // STORAGE_LOCAL_DIR has a default; STORAGE_PUBLIC_BASE_URL has a default
  } else if (driver === "s3") {
    requireEnv("STORAGE_ENDPOINT");
    requireEnv("STORAGE_BUCKET_PUBLIC");
    requireEnv("STORAGE_BUCKET_PRIVATE");
    requireEnv("STORAGE_ACCESS_KEY_ID");
    requireEnv("STORAGE_SECRET_ACCESS_KEY");
    requireEnv("STORAGE_PUBLIC_BASE_URL");
  } else {
    throw new Error(`[storage] Unknown STORAGE_DRIVER="${driver}". Must be "local" or "s3".`);
  }
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(
      `[storage] Missing required environment variable: ${name} (STORAGE_DRIVER=${process.env.STORAGE_DRIVER ?? "local"})`
    );
  }
}
