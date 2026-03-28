"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { z } from "zod";

const SignupSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters"),
    role: z.enum(["operator", "traveler"], {
      required_error: "Please select a role",
    }),
  });

type Role = "operator" | "traveler";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validate = () => {
    const result = SignupSchema.safeParse({ name, email, password, role });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) fieldErrors[e.path[0] as string] = e.message;
      });
      setErrors(fieldErrors);
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
        body: JSON.stringify({ name, email, password, role }),
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
        // Middleware will redirect to the correct dashboard based on role
        window.location.href = "/";
      }
    } catch {
      setGlobalError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="space-y-4">
      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {googleLoading ? (
          <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-100" />
        </div>
        <div className="relative flex justify-center text-xs text-gray-400 uppercase tracking-wider">
          <span className="bg-white px-3">or</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {globalError && (
          <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
            {globalError}
          </div>
        )}

        {/* Role selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I am a…
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                {
                  value: "operator",
                  label: "Tourism Operator",
                  description: "Lodge, tour, experience",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5"
                      />
                    </svg>
                  ),
                },
                {
                  value: "traveler",
                  label: "Traveler",
                  description: "Discover & book",
                  icon: (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064"
                      />
                    </svg>
                  ),
                },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRole(option.value)}
                className={`flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all ${
                  role === option.value
                    ? "border-emerald-500 bg-emerald-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span
                  className={`${role === option.value ? "text-emerald-600" : "text-gray-500"}`}
                >
                  {option.icon}
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {option.label}
                </span>
                <span className="text-xs text-gray-500">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          {errors.role && (
            <p className="text-xs text-red-600 mt-1">{errors.role}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
              errors.name ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.name && (
            <p className="text-xs text-red-600 mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
              errors.email ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.email && (
            <p className="text-xs text-red-600 mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 ${
              errors.password ? "border-red-300 bg-red-50" : "border-gray-200"
            }`}
          />
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {loading ? (
            <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
          ) : null}
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </div>
  );
}
