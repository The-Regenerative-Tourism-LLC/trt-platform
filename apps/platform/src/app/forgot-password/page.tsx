import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center fm-cream px-6">
      <div className="max-w-sm w-full space-y-8">
        <div className="space-y-2 space-y-2 flex flex-col items-center justify-center">
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
            Reset your password
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email address and we will send you a reset link.
          </p>
        </div>

        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
