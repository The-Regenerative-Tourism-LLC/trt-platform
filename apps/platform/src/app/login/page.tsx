import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4 shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Green Passport</h1>
          <p className="text-sm text-gray-500 mt-1">
            Regenerative Tourism Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Welcome back
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Sign in to your account to continue
          </p>
          <LoginForm />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account?{" "}
          <a
            href="/signup"
            className="text-emerald-600 font-medium hover:text-emerald-700"
          >
            Create one
          </a>
        </p>
      </div>
    </div>
  );
}
