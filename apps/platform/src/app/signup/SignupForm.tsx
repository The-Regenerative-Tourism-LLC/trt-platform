"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { z } from "zod";
import Link from "next/link";

const SignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["operator"]),
});

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [termsOptIn, setTermsOptIn] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"operator" | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    if (!selectedRole) {
      setErrors({ role: "Please select your role to continue" });
      return false;
    }
    const result = SignupSchema.safeParse({ name, email, password, role: selectedRole });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    if (!termsOptIn) {
      setErrors({ terms: "You must accept the Terms & Conditions and Privacy Policy" });
      return false;
    }
    setErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setGlobalError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: selectedRole, termsOptIn, marketingOptIn }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGlobalError(data.error ?? "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Auto sign-in after successful signup
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setGlobalError("Account created! Please sign in.");
        window.location.href = "/login";
      } else {
        window.location.href = "/operator/dashboard";
      }
    } catch {
      setGlobalError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/select-role" });
  };

  return (
    <div className="space-y-5">
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-border rounded-lg text-sm font-medium text-foreground bg-card hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="w-5 h-5 rounded-full border-2 border-border border-t-foreground animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground uppercase tracking-wider">
          <span className="bg-cream px-3">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {globalError && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-3 rounded-lg border border-destructive/20">
            {globalError}
          </div>
        )}

        {/* Role selection */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">I am joining as</p>
          <button
            type="button"
            onClick={() => setSelectedRole("operator")}
            className={`w-full flex gap-5 items-start p-5 rounded-2xl border-2 text-left transition-all ${
              selectedRole === "operator"
                ? "border-foreground bg-secondary"
                : "border-border hover:border-foreground/30 hover:bg-secondary/50"
            }`}
          >
            <span className={`mt-0.5 flex-shrink-0 ${selectedRole === "operator" ? "text-foreground" : "text-muted-foreground"}`}>
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">Tourism Operator</span>
                {selectedRole === "operator" && (
                  <span className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center flex-shrink-0">
                    <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                I manage a lodge, tour, or experience and want to get my Green Passport Score.
              </p>
              <div className="flex flex-wrap gap-2">
                {["GPS assessment", "DPI context", "Public passport"].map((f) => (
                  <span
                    key={f}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      selectedRole === "operator"
                        ? "bg-foreground/10 text-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </button>
          {/* Traveler card — redirects to waitlist */}
          <button
            type="button"
            onClick={() => router.push("/traveler/waitlist")}
            className="w-full flex gap-5 items-start p-5 rounded-2xl border-2 border-border hover:border-foreground/30 hover:bg-secondary/50 text-left transition-all opacity-70"
          >
            <span className="mt-0.5 flex-shrink-0 text-muted-foreground">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">Traveler</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">Coming soon</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                The traveler experience isn&apos;t open yet. Join the waitlist to be first when it launches.
              </p>
              <span className="text-xs font-medium text-foreground underline underline-offset-2">
                Join the waitlist →
              </span>
            </div>
          </button>

          {errors.role && (
            <p className="text-xs text-destructive">{errors.role}</p>
          )}
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-surface/30 p-5">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Full name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Smith"
              className={`flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.name ? "border-destructive" : ""
              }`}
            />
            {errors.name && (
              <p className="text-xs text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={`flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.email ? "border-destructive" : ""
              }`}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={`flex h-12 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.password ? "border-destructive" : ""
              }`}
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
          </div>
        </div>

        <div className="space-y-3">
           {/* Optional marketing consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
            />
            <span className="text-sm text-muted-foreground">
              I want to receive news, tips, and updates about regenerative tourism. (Optional)
            </span>
          </label>
          
        {/* Required legal acceptance */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={termsOptIn}
              onChange={(e) => setTermsOptIn(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-border accent-primary flex-shrink-0"
              required
            />
            <span className="text-sm text-foreground">
              I have read and agree to the{" "}
              <Link href="/terms" target="_blank" className="underline hover:text-primary">
                Terms &amp; Conditions
              </Link>{" "}
              and{" "}
              <Link href="/privacy" target="_blank" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              . <span className="text-destructive">*</span>
            </span>
          </label>
          {errors.terms && (
            <p className="text-xs text-destructive">{errors.terms}</p>
          )}

         
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading || !termsOptIn || !selectedRole}
          className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 px-4 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
          ) : null}
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-center text-xs text-muted-foreground">
          By signing up with Google, you also agree to our{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
    </div>
  );
}
