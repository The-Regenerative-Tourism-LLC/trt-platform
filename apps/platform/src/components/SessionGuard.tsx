"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

/**
 * Listens for the global "session:invalid" DOM event dispatched by `apiFetch`
 * whenever an API route returns 401. Calls `signOut` to clear the stale JWT
 * cookie and redirects the user to the login page.
 *
 * Mount once at the root (inside Providers) to catch 401s app-wide.
 */
export function SessionGuard() {
  useEffect(() => {
    const handler = () => {
      signOut({ callbackUrl: "/login" });
    };
    window.addEventListener("session:invalid", handler);
    return () => window.removeEventListener("session:invalid", handler);
  }, []);

  return null;
}
