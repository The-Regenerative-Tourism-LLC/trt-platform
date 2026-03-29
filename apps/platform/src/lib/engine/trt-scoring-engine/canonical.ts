/**
 * Canonical JSON serialisation — R3 compliance
 *
 * Produces a deterministic JSON string by recursively sorting all object keys
 * at every depth level. Required for audit-safe SHA-256 hashing of snapshots.
 *
 * Rules:
 *   - Object keys are sorted lexicographically at every depth
 *   - Arrays preserve their original order (elements are canonicalized recursively)
 *   - Primitives (string, number, boolean, null) are serialised as-is
 *   - undefined values are omitted (same as JSON.stringify)
 */

export function canonicalize(value: unknown): string {
  return JSON.stringify(sortedReplacer(value));
}

function sortedReplacer(value: unknown): unknown {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(sortedReplacer);
  }

  const obj = value as Record<string, unknown>;
  const sorted: Record<string, unknown> = {};
  for (const key of Object.keys(obj).sort()) {
    const v = obj[key];
    if (v !== undefined) {
      sorted[key] = sortedReplacer(v);
    }
  }
  return sorted;
}
