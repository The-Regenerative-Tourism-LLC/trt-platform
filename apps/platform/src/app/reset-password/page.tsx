import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center fm-cream px-6">
      <div className="max-w-sm w-full space-y-8">
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
          <h1 className="fm-sub-heading text-foreground">
            Choose a new password
          </h1>
          <p className="text-sm text-muted-foreground">
            Your new password must be at least 8 characters.
          </p>
        </div>

        <Suspense>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
