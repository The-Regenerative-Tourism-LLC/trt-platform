import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { withLocalePath } from "@/i18n/pathname";
import { SignupForm } from "./SignupForm";

export const metadata: Metadata = {
  title: "Operator Signup",
  robots: { index: false, follow: false },
};

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");
  const locale = await getLocale();
  const homeHref = withLocalePath("/", locale);
  const loginHref = withLocalePath("/login", locale);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:py-20">
        <div className="w-full max-w-lg space-y-8">
          <div className="space-y-2 flex flex-col items-center justify-center">
            <Link href={homeHref} className="inline-block mb-4">
              <Image
                src="/assets/logo-regenerative-tourism-black.svg"
                alt="The Regenerative Tourism"
                width={130}
                height={30}
                className="h-7 w-auto"
              />
            </Link>
            <h1 className="type-h2 text-foreground text-center">
              {t("title")}
            </h1>
            <p className="type-s text-black text-center">
              {t("subtitle")}
            </p>
          </div>

          <SignupForm />

          <p className="text-center type-s text-black">
            {t("hasAccount")}{" "}
            <Link href={loginHref} className="text-foreground font-medium hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
