import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Operator Signup",
  robots: { index: false, follow: false },
};

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col fm-cream">
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2 flex flex-col items-center justify-center">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/assets/logo-regenerative-tourism-black.svg"
                alt="Green Passport"
                width={130}
                height={30}
                className="h-7 w-auto"
              />
            </Link>
            <h1 className="fm-sub-heading text-foreground">
              Create your account.
            </h1>
            <p className="text-sm text-muted-foreground">
              Join the verification layer for regenerative tourism.
            </p>
          </div>

          <SignupForm />

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/login"
              className="text-foreground font-medium hover:underline"
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
