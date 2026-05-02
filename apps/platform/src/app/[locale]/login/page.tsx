import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { withLocalePath } from "@/i18n/pathname";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign In",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const t = await getTranslations("auth.login");
  const locale = await getLocale();
  const homeHref = withLocalePath("/", locale);
  const signupHref = withLocalePath("/signup", locale);

  return (
    <div className="min-h-screen flex flex-col fm-cream">
      <div className="flex-1 flex items-center justify-center px-6 py-16 md:py-24">
        <div className="w-full max-w-sm space-y-8">
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
            <h1 className="fm-sub-heading text-foreground text-center">{t("title")}</h1>
            <p className="text-sm text-muted-foreground text-center">
              {t("subtitle")}
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
            {t("noAccount")}{" "}
            <Link href={signupHref} className="text-foreground font-medium hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
