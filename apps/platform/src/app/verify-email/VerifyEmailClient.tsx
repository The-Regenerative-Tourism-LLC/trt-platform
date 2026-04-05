"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type Status = "verifying" | "success" | "error";

function getDashboardUrl(roles: string[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("operator")) return "/operator/dashboard";
  if (roles.includes("traveler")) return "/traveler/dashboard";
  return "/";
}

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus, update } = useSession();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationDone, setVerificationDone] = useState(false);
  // Prevents a double-redirect in the token flow when sessionStatus flickers
  const redirectDone = useRef(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // ── Recovery (no token) ──────────────────────────────────────────────────
  // The user is here because the middleware saw isEmailVerified: false in the
  // JWT, even though the DB may already have it set (stale JWT).
  //
  // We refresh the session immediately on mount and again every time the
  // window regains focus — covering the common case where the user verifies
  // in another tab, then returns here.
  //
  // Intentionally does NOT depend on sessionStatus so that update() calls
  // (which briefly cycle sessionStatus loading→authenticated) don't re-trigger
  // this effect and create an infinite loop.
  useEffect(() => {
    if (token) return; // Token flow is handled separately below

    let cancelled = false;

    async function tryRedirectIfVerified() {
      const updated = await update({});
      if (!cancelled && updated?.user?.isEmailVerified) {
        window.location.href = getDashboardUrl(
          (updated.user.roles ?? []) as string[]
        );
      }
    }

    // Check immediately (same-tab recovery: stale JWT)
    void tryRedirectIfVerified();

    // Check whenever the user returns to this tab (cross-tab: verified elsewhere)
    const onFocus = () => void tryRedirectIfVerified();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-run only if token appears/disappears, not on sessionStatus flicker

  // ── Step 1: Verify token via API ─────────────────────────────────────────
  // Deliberately does not redirect here — sessionStatus may still be "loading"
  // in production (higher latency), which would send an authenticated user to
  // /login and trigger a middleware redirect loop back to /verify-email.
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(
        "Open the verification link from your email to continue."
      );
      return;
    }

    void (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMessage(data.error ?? "Verification failed.");
          setStatus("error");
          return;
        }

        setStatus("success");
        setVerificationDone(true);
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Step 2: Redirect after token verification ────────────────────────────
  // Wait for sessionStatus to settle before deciding where to send the user.
  // The ref prevents a double-redirect when update() causes sessionStatus to
  // flicker (authenticated → loading → authenticated).
  useEffect(() => {
    if (!verificationDone || sessionStatus === "loading" || redirectDone.current) {
      return;
    }
    redirectDone.current = true;

    void (async () => {
      if (sessionStatus === "authenticated") {
        // Refresh JWT so the middleware sees isEmailVerified: true
        const updated = await update({});
        const roles = (updated?.user?.roles ?? session?.user?.roles ?? []) as string[];
        window.location.href = getDashboardUrl(roles);
      } else {
        // Not logged in — fresh login will issue a JWT with isEmailVerified: true
        window.location.href = "/login?verified=1";
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationDone, sessionStatus]);

  useEffect(() => {
    if (session?.user?.email) {
      setResendEmail(session.user.email);
    }
  }, [session?.user?.email]);

  async function handleResend(e: React.SyntheticEvent) {
    e.preventDefault();
    setResendLoading(true);
    setResendMessage("");
    setResendError("");

    try {
      const body = resendEmail ? { email: resendEmail } : {};
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (res.status === 429) { setResendError(data.error); return; }
      if (!res.ok) { setResendError(data.error ?? "Failed to send. Please try again."); return; }
      if (data.alreadyVerified) {
        setResendMessage("Your email is already verified. You can sign in.");
        return;
      }
      setResendMessage("Verification email sent. Check your inbox.");
    } catch {
      setResendError("An error occurred. Please try again.");
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-sm">

      {status === "verifying" && token && (
        <>
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-foreground mb-2">Verifying your email…</h1>
          <p className="text-muted-foreground text-sm">This will only take a moment.</p>
        </>
      )}

      {status === "success" && (
        <>
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-foreground mb-2">Email verified</h1>
          <p className="text-muted-foreground text-sm mb-4">
            {sessionStatus === "authenticated"
              ? "Taking you to your dashboard…"
              : "You can now sign in to your account."}
          </p>
          {sessionStatus !== "authenticated" && (
            <Link href="/login" className="text-foreground text-sm font-medium hover:underline">
              Go to login
            </Link>
          )}
        </>
      )}

      {status === "error" && (
        <>
          {token ? (
            <>
              <div className="w-12 h-12 rounded-full bg-amber/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">Link expired or already used</h1>
              <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">Check your inbox</h1>
              <p className="text-muted-foreground text-sm mb-6">
                We sent a verification link to{" "}
                <strong>{session?.user?.email ?? "your email address"}</strong>.
                Click it to activate your account.
              </p>
            </>
          )}

          <div className="border-t border-border pt-6 mt-2">
            <p className="text-sm text-muted-foreground mb-3">
              Didn&apos;t receive it? Request a new link.
            </p>

            <form onSubmit={handleResend} className="space-y-3">
              {sessionStatus !== "authenticated" && (
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              )}

              {resendError && <p className="text-destructive text-sm">{resendError}</p>}
              {resendMessage && <p className="text-primary text-sm font-medium">{resendMessage}</p>}

              <button
                type="submit"
                disabled={resendLoading}
                className="w-full bg-primary text-primary-foreground text-sm font-semibold py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? "Sending…" : "Resend verification email"}
              </button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground/60">
              You can request one email per minute.
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">
            <button
              onClick={() => signOut({ redirectTo: "/login" })}
              className="hover:underline"
            >
              Back to login
            </button>
          </p>
        </>
      )}
    </div>
  );
}
