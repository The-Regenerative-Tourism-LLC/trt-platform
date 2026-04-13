/**
 * Typed API fetch client.
 *
 * All authenticated requests should go through `apiFetch` or `fetchJson`
 * so that stale/invalid sessions are detected and handled uniformly.
 *
 * On a 401 response:
 *   - A "session:invalid" CustomEvent is dispatched on `window`.
 *   - `SessionGuard` (mounted in Providers) catches it and calls `signOut`.
 *
 * Usage:
 *   // For queries/mutations that need the raw Response:
 *   const res = await apiFetch("/api/v1/resource", { method: "POST", body });
 *
 *   // For queries that just need the parsed JSON (throws on non-ok):
 *   const data = await fetchJson<MyType>("/api/v1/resource");
 */

/** Dispatches the global invalid-session signal. */
export function dispatchSessionInvalid(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("session:invalid"));
  }
}

/** Fetch wrapper that fires `session:invalid` on 401. */
export async function apiFetch(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 401) {
    dispatchSessionInvalid();
  }
  return res;
}

/** Typed JSON fetch — throws on non-ok responses (enables React Query error handling). */
export async function fetchJson<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await apiFetch(url, options);
  if (!res.ok) {
    const err = Object.assign(
      new Error(`API error ${res.status}: ${url}`),
      { status: res.status }
    );
    throw err;
  }
  return res.json() as Promise<T>;
}
