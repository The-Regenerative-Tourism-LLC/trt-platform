"use server";

/**
 * Returns the Mapbox public token from the server-side environment.
 *
 * Client components read process.env.NEXT_PUBLIC_MAPBOX_TOKEN directly, but
 * that value is inlined at build time. If the variable was missing from the
 * build environment (e.g. added to Railway after the last deploy), the
 * client-side copy is forever undefined until a full rebuild. Reading from a
 * server action instead fetches the value from the live runtime environment,
 * so the token is always current regardless of when it was set.
 */
export async function getMapboxToken(): Promise<string | null> {
  return process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? null;
}
