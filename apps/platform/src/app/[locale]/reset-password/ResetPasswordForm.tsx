"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { withLocalePath } from "@/i18n/pathname";

export default function ResetPasswordForm() {
  const t = useTranslations("auth.resetPassword");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const forgotPasswordHref = withLocalePath("/forgot-password", locale);
  const loginHref = withLocalePath("/login", locale);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <p className="text-destructive text-sm mb-4">
          {t("invalidLink")}
        </p>
        <Link href={forgotPasswordHref} className="text-foreground text-sm font-medium hover:underline">
          {t("requestNewLink")}
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("errors.mismatch"));
      return;
    }

    if (password.length < 8) {
      setError(t("errors.passwordMin"));
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("errors.unexpected"));
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push(loginHref), 3000);
    } catch {
      setError(t("errors.unexpected"));
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-2">{t("success.title")}</h2>
        <p className="text-black text-sm mb-4">
          {t("success.body")}
        </p>
        <Link href={loginHref} className="text-foreground text-sm font-medium hover:underline">
          {t("success.cta")}
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-foreground">
            {t("passwordLabel")}
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
            {t("confirmPasswordLabel")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("confirmPasswordPlaceholder")}
            className="flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>

        {error && (
          <p className="text-destructive text-sm">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground text-sm font-semibold py-3 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? t("submitting") : t("submit")}
        </button>
      </form>
    </div>
  );
}
