"use client";

import { useState } from "react";

interface FormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const INITIAL: FormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function ChangePasswordForm() {
  const [form, setForm] = useState<FormState>(INITIAL);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function set(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (form.currentPassword === form.newPassword) {
      setError("New password must be different from your current password.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/account/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setForm(INITIAL);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex items-start gap-3 bg-secondary border border-primary/20 rounded-lg p-4">
        <svg
          className="w-5 h-5 text-primary mt-0.5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold text-foreground">Password updated</p>
          <p className="text-sm text-muted-foreground mt-0.5">
            A confirmation email has been sent to your address.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="mt-3 text-xs text-primary underline"
          >
            Change again
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Current password
        </label>
        <input
          id="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          value={form.currentPassword}
          onChange={set("currentPassword")}
          className="w-full h-12 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-foreground mb-1"
        >
          New password
        </label>
        <input
          id="newPassword"
          type="password"
          required
          autoComplete="new-password"
          value={form.newPassword}
          onChange={set("newPassword")}
          placeholder="Min. 8 characters"
          className="w-full h-12 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-foreground mb-1"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="Repeat new password"
          className="w-full h-12 px-3 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-transparent"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
