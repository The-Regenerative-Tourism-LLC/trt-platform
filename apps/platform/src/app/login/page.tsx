import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col fm-cream">
      <div className="flex-1 flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-2">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/assets/logo-regenerative-tourism-black.svg"
                alt="Green Passport"
                width={130}
                height={30}
                className="h-7 w-auto"
              />
            </Link>
            <h1 className="fm-sub-heading text-foreground">Welcome back.</h1>
            <p className="text-sm text-muted-foreground">
              Sign in to your Green Passport account.
            </p>
          </div>

          <Suspense
            fallback={
              <div className="h-64 flex items-center justify-center">
                <span className="w-6 h-6 rounded-full border-2 border-border border-t-foreground animate-spin" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-foreground font-medium hover:underline"
            >
              Create one
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
