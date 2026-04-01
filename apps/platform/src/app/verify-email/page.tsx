"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Status = "verifying" | "success" | "error" | "already_verified";

function getDashboardUrl(roles: string[]): string {
  if (roles.includes("admin")) return "/admin/dashboard";
  if (roles.includes("operator")) return "/operator/dashboard";
  if (roles.includes("traveler")) return "/traveler/dashboard";
  return "/";
}

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status: sessionStatus, update } = useSession();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");

  // Resend state
  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  useEffect(() => {
    // No token — show the "check your inbox" holding page for logged-in
    // but unverified users redirected here by middleware.
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

        // If the user is already authenticated, refresh the JWT so the
        // emailVerified field is updated in the session. The trigger="update"
        // callback in auth.ts re-fetches emailVerified from the DB.
        if (sessionStatus === "authenticated") {
          await update();
          // Small delay for the session update to propagate before navigating
          await new Promise((r) => setTimeout(r, 300));
          const dashboardUrl = getDashboardUrl(
            (session?.user?.roles ?? []) as string[]
          );
          router.push(dashboardUrl);
        } else {
          // Not authenticated — redirect to login after a short pause
          setTimeout(() => router.push("/login?verified=1"), 2500);
        }
      } catch {
        setErrorMessage("An unexpected error occurred. Please try again.");
        setStatus("error");
      }
    }

    void verify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Pre-fill resend email from session
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">

        {/* Verifying */}
        {status === "verifying" && token && (
          <>
            <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying your email…
            </h1>
            <p className="text-gray-500 text-sm">This will only take a moment.</p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Email verified
            </h1>
            <p className="text-gray-500 text-sm mb-4">
              {sessionStatus === "authenticated"
                ? "Taking you to your dashboard…"
                : "You can now sign in to your account."}
            </p>
            {sessionStatus !== "authenticated" && (
              <Link href="/login" className="text-green-700 text-sm font-medium hover:underline">
                Go to login
              </Link>
            )}
          </>
        )}

        {/* Error / No-token holding page */}
        {status === "error" && (
          <>
            {token ? (
              /* Token present but invalid/expired */
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 110 18A9 9 0 0112 3z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Link expired or already used
                </h1>
                <p className="text-gray-500 text-sm mb-6">{errorMessage}</p>
              </>
            ) : (
              /* No token — middleware redirected unverified user here */
              <>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">
                  Check your inbox
                </h1>
                <p className="text-gray-500 text-sm mb-6">
                  We sent a verification link to{" "}
                  <strong>{session?.user?.email ?? "your email address"}</strong>.
                  Click it to activate your account.
                </p>
              </>
            )}

            {/* Resend form */}
            <div className="border-t border-gray-100 pt-6 mt-2">
              <p className="text-sm text-gray-500 mb-3">
                Didn&apos;t receive it? Request a new link.
              </p>

              <form onSubmit={handleResend} className="space-y-3">
                {/* Only show email field if user is not authenticated */}
                {sessionStatus !== "authenticated" && (
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
                  />
                )}

                {resendError && (
                  <p className="text-red-600 text-sm">{resendError}</p>
                )}
                {resendMessage && (
                  <p className="text-green-700 text-sm font-medium">{resendMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={resendLoading}
                  className="w-full bg-green-700 text-white text-sm font-semibold py-2 rounded-lg hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {resendLoading ? "Sending…" : "Resend verification email"}
                </button>
              </form>

              <p className="mt-4 text-xs text-gray-400">
                You can request one email per minute.
              </p>
            </div>

            <p className="mt-6 text-xs text-gray-400">
              <Link href="/login" className="hover:underline">
                Back to login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
