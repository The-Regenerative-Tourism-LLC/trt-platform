"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ name: "", password: "", confirmPassword: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-destructive type-s mb-4">
          Invalid invitation link.
        </p>
        <Link href="/login" className="text-primary type-s font-medium hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: form.name, password: form.password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-success-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="type-m font-semibold text-foreground mb-2">Account created</h2>
        <p className="text-black type-s mb-4">
          Your account is ready. Redirecting to login…
        </p>
        <Link href="/login" className="text-primary type-s font-medium hover:underline">
          Go to login now
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block type-s font-medium text-foreground mb-1">
          Full name
        </label>
        <input
          id="name"
          type="text"
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Your name"
          className="w-full px-3 py-2 border border-border type-s focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="password" className="block type-s font-medium text-foreground mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="Min. 8 characters"
          className="w-full px-3 py-2 border border-border type-s focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block type-s font-medium text-foreground mb-1">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
          placeholder="Repeat password"
          className="w-full px-3 py-2 border border-border type-s focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
      </div>

      {error && <p className="text-destructive type-s">{error}</p>}

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full disabled:bg-muted disabled:text-black disabled:cursor-not-allowed"
      >
        {isLoading ? "Creating account…" : "Accept invitation"}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-5">
            <Image
              src="/assets/logo-regenerative-tourism-black.svg"
              alt="The Regenerative Tourism"
              width={130}
              height={30}
              className="h-7 w-auto mx-auto"
            />
          </Link>
          <h1 className="type-h2 text-foreground mb-2">
            Accept your invitation
          </h1>
          <p className="text-black type-s">
            Create your account to get started.
          </p>
        </div>

        <div className="card">
          <Suspense>
            <AcceptInviteForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
