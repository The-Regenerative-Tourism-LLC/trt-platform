/**
 * Validates required environment variables for the configured storage driver.
 * Call this once at application startup (or lazily in getStorageProvider).
 * Throws with a clear message if any required var is missing.
 */
export function validateStorageEnv(): void {
  const driver = process.env.STORAGE_DRIVER ?? "local";

  if (driver === "local") {
    requireEnv("STORAGE_PUBLIC_BASE_URL");
    // STORAGE_LOCAL_DIR has a default so it's optional
  } else if (driver === "s3") {
    requireEnv("STORAGE_ENDPOINT");
    requireEnv("STORAGE_REGION");
    requireEnv("STORAGE_BUCKET");
    requireEnv("STORAGE_ACCESS_KEY_ID");
    requireEnv("STORAGE_SECRET_ACCESS_KEY");
    requireEnv("STORAGE_PUBLIC_BASE_URL");
  } else {
    throw new Error(`[storage] Unknown STORAGE_DRIVER="${driver}". Must be "local" or "s3".`);
  }
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`[storage] Missing required environment variable: ${name} (STORAGE_DRIVER=${process.env.STORAGE_DRIVER ?? "local"})`);
  }
}
