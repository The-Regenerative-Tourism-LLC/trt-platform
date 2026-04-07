/**
 * Validates required environment variables for the configured storage driver.
 * Call this once at application startup (or lazily in getStorageProvider).
 * Throws with a clear message if any required var is missing.
 */
export function validateStorageEnv(): void {
  const driver = process.env.DRIVER ?? "local";

  if (driver === "local") {
    requireEnv("PUBLIC_BASE_URL");
    // LOCAL_DIR has a default so it's optional
  } else if (driver === "s3") {
    requireEnv("ENDPOINT");
    requireEnv("REGION");
    requireEnv("BUCKET");
    requireEnv("ACCESS_KEY_ID");
    requireEnv("SECRET_ACCESS_KEY");
    requireEnv("PUBLIC_BASE_URL");
  } else {
    throw new Error(`[storage] Unknown DRIVER="${driver}". Must be "local" or "s3".`);
  }
}

function requireEnv(name: string): void {
  if (!process.env[name]) {
    throw new Error(`[storage] Missing required environment variable: ${name} (DRIVER=${process.env.DRIVER ?? "local"})`);
  }
}
