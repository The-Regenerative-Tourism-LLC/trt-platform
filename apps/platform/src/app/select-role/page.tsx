import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SelectRoleForm } from "./SelectRoleForm";

export const metadata: Metadata = {
  title: "Choose Your Role",
  robots: { index: false, follow: false },
};

export default function SelectRolePage() {
  return (
    <div className="min-h-screen flex items-center justify-center fm-cream px-6">
      <div className="w-full max-w-lg space-y-8">
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
            Welcome to Green Passport
          </h1>
          <p className="text-sm text-muted-foreground">
            One last step — tell us how you&apos;ll use the platform
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <SelectRoleForm />
        </div>
      </div>
    </div>
  );
}
