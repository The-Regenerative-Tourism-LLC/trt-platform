"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { withLocalePath } from "@/i18n/pathname";

type Status = "verifying" | "success" | "error";

export default function VerifyEmailClient() {
  const t = useTranslations("auth.verifyEmail");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus, update } = useSession();
  const token = searchParams.get("token");
  const loginHref = withLocalePath("/login", locale);

  const [status, setStatus] = useState<Status>("verifying");
  const [errorMessage, setErrorMessage] = useState("");
  const [verificationDone, setVerificationDone] = useState(false);
  const redirectDone = useRef(false);

  const [resendEmail, setResendEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [resendError, setResendError] = useState("");

  const getDashboardUrl = (roles: string[]) => {
    if (roles.includes("admin")) return withLocalePath("/admin/dashboard", locale);
    if (roles.includes("operator")) return withLocalePath("/operator/dashboard", locale);
    if (roles.includes("traveler")) return withLocalePath("/traveler/dashboard", locale);
    return withLocalePath("/", locale);
  };

  useEffect(() => {
    if (token) return;

    let cancelled = false;

    async function tryRedirectIfVerified() {
      const updated = await update({});
      if (!cancelled && updated?.user?.isEmailVerified) {
        window.location.href = getDashboardUrl(
          (updated.user.roles ?? []) as string[]
        );
      }
    }

    void tryRedirectIfVerified();

    const onFocus = () => void tryRedirectIfVerified();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, [token, update, locale]);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage(t("errors.openLink"));
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
          setErrorMessage(data.error ?? t("errors.verificationFailed"));
          setStatus("error");
          return;
        }

        setStatus("success");
        setVerificationDone(true);
      } catch {
        setErrorMessage(t("errors.unexpected"));
        setStatus("error");
      }
    })();
  }, [token, t]);

  useEffect(() => {
    if (!verificationDone || sessionStatus === "loading" || redirectDone.current) {
      return;
    }
    redirectDone.current = true;

    void (async () => {
      if (sessionStatus === "authenticated") {
        const updated = await update({});
        const roles = (updated?.user?.roles ?? session?.user?.roles ?? []) as string[];
        window.location.href = getDashboardUrl(roles);
      } else {
        window.location.href = `${loginHref}?verified=1`;
      }
    })();
  }, [verificationDone, sessionStatus, update, session?.user?.roles, locale, loginHref]);

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

      if (res.status === 429) {
        setResendError(data.error);
        return;
      }
      if (!res.ok) {
        setResendError(data.error ?? t("errors.resendFailed"));
        return;
      }
      if (data.alreadyVerified) {
        setResendMessage(t("messages.alreadyVerified"));
        return;
      }
      setResendMessage(t("messages.sent"));
    } catch {
      setResendError(t("errors.resendUnexpected"));
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
            {t("verifying.title")}
          </h1>
          <p className="text-muted-foreground text-sm">{t("verifying.body")}</p>
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
            {t("success.title")}
          </h1>
          <p className="text-muted-foreground text-sm mb-4">
            {sessionStatus === "authenticated"
              ? t("success.redirecting")
              : t("success.body")}
          </p>
          {sessionStatus !== "authenticated" && (
            <Link href={loginHref} className="text-foreground text-sm font-medium hover:underline">
              {t("success.cta")}
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
                {t("expired.title")}
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
                {t("checkInbox.title")}
              </h1>
              <p className="text-muted-foreground text-sm mb-6">
                {t.rich("checkInbox.body", {
                  email: () => (
                    <strong>{session?.user?.email ?? t("checkInbox.fallbackEmail")}</strong>
                  ),
                })}
              </p>
            </>
          )}

          <div className="border-t border-border pt-6 mt-2">
            <p className="text-sm text-muted-foreground mb-3">
              {t("resend.prompt")}
            </p>

            <form onSubmit={handleResend} className="space-y-3">
              {sessionStatus !== "authenticated" && (
                <input
                  type="email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder={t("resend.emailPlaceholder")}
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
                {resendLoading ? t("resend.sending") : t("resend.submit")}
              </button>
            </form>

            <p className="mt-4 text-xs text-muted-foreground/60">
              {t("resend.rateLimit")}
            </p>
          </div>

          <p className="mt-6 text-xs text-muted-foreground/60">
            <button
              onClick={() => signOut({ redirectTo: loginHref })}
              className="hover:underline"
            >
              {t("backToLogin")}
            </button>
          </p>
        </>
      )}
    </div>
  );
}
