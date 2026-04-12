import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AcceptTermsForm } from "./AcceptTermsForm";

export const metadata: Metadata = {
  title: "Terms & Privacy",
  robots: { index: false, follow: false },
};

export default function AcceptTermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center fm-cream px-6 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 flex flex-col items-center text-center">
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
            One last step
          </h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            We&apos;ve updated our terms. Please review and accept them to continue using Green Passport.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <AcceptTermsForm />
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Read our{" "}
          <Link href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </Link>
          ,{" "}
          <Link href="/terms" className="underline hover:text-foreground">
            Terms &amp; Conditions
          </Link>
          , and{" "}
          <Link href="/cookies" className="underline hover:text-foreground">
            Cookie Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
