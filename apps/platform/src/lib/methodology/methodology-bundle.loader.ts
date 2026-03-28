/**
 * Methodology Bundle Loader
 *
 * Loads the active MethodologyBundle for the scoring engine.
 * Bundles are stored in the database (versioned, never deleted).
 * Falls back to the compiled default if no active bundle found in DB.
 *
 * Only the orchestration layer may call this. Never called from the engine itself.
 */

import type { MethodologyBundle } from "../engine/trt-scoring-engine/types";
import { DEFAULT_METHODOLOGY_BUNDLE } from "./default-bundle";
import { createHash } from "crypto";

/**
 * Compute a deterministic SHA-256 hash of a methodology bundle for audit.
 */
export function hashMethodologyBundle(bundle: MethodologyBundle): string {
  const canonical = JSON.stringify(bundle, Object.keys(bundle).sort());
  return createHash("sha256").update(canonical).digest("hex");
}

/**
 * Return the active methodology bundle.
 *
 * In MVP, this returns the compiled default bundle.
 * Phase 2+: will load from DB (methodology_bundles table) by version,
 * allowing re-scoring against any historical bundle.
 */
export async function loadActiveBundle(): Promise<{
  bundle: MethodologyBundle;
  hash: string;
}> {
  const bundle = DEFAULT_METHODOLOGY_BUNDLE;
  const hash = hashMethodologyBundle(bundle as MethodologyBundle);
  return { bundle: bundle as MethodologyBundle, hash };
}

/**
 * Load a specific bundle version (for historical replay / audit).
 * Falls back to default if requested version matches the current.
 */
export async function loadBundleByVersion(version: string): Promise<{
  bundle: MethodologyBundle;
  hash: string;
} | null> {
  if (version === DEFAULT_METHODOLOGY_BUNDLE.version) {
    return loadActiveBundle();
  }
  // Phase 2: load from DB
  return null;
}
