"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Status = "verifying" | "success" | "error" | "already_verified";

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
  // Signals that the API call succeeded — redirect deferred until sessionStatus settles
  const [verificationDone, setVerificationDone] = useState(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  // Recovery: user is authenticated but stuck on /verify-email with no token
  // (stale JWT — email was verified but session was never refreshed).
  // Refresh the session from DB; if email is now verified, redirect to dashboard.
  useEffect(() => {
    if (token || sessionStatus !== "authenticated") return;

    async function tryRecovery() {
      const updated = await update();
      if (updated?.user?.isEmailVerified) {
        const dashboardUrl = getDashboardUrl(
          (updated.user.roles ?? []) as string[]
        );
        window.location.href = dashboardUrl;
      }
    }

    void tryRecovery();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, sessionStatus]);

  // Step 1: call the verification API. Do NOT redirect here — sessionStatus may
  // still be "loading" in production, which would send an authenticated user to
  // /login and trigger a middleware loop.
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(
        "Open the verification link from your email to continue."
      );
      return;
    }

    async function verify() {
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
    }

    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Step 2: redirect once both the verification is done AND the session status
  // has settled (not "loading"). This prevents sending an authenticated user to
  // /login with a stale JWT, which would loop back to /verify-email.
  useEffect(() => {
    if (!verificationDone || sessionStatus === "loading") return;

    async function doRedirect() {
      if (sessionStatus === "authenticated") {
        // Refresh JWT so the middleware sees isEmailVerified: true
        const updated = await update();
        const roles = (
          updated?.user?.roles ??
          session?.user?.roles ??
          []
        ) as string[];
        window.location.href = getDashboardUrl(roles);
      } else {
        // Not logged in — send to login; a fresh JWT will reflect verified email
        window.location.href = "/login?verified=1";
      }
    }

    void doRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verificationDone, sessionStatus]);

  useEffect(() => {
    if (session?.user?.email) {
      setResendEmail(session.user.email);
    }
  }, [session?.user?.email]);

  async function handleResend(e: React.FormEvent) {
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

      if (res.status === 429) {
        setResendError(data.error);
        return;
      }

      if (!res.ok) {
        setResendError(data.error ?? "Failed to send. Please try again.");
        return;
      }

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
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Verifying your email…
          </h1>
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
          <h1 className="text-xl font-semibold text-foreground mb-2">
            Email verified
          </h1>
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
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Link expired or already used
              </h1>
              <p className="text-muted-foreground text-sm mb-6">{errorMessage}</p>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Check your inbox
              </h1>
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

              {resendError && (
                <p className="text-destructive text-sm">{resendError}</p>
              )}
              {resendMessage && (
                <p className="text-primary text-sm font-medium">{resendMessage}</p>
              )}

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
            <Link href="/login" className="hover:underline">
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
