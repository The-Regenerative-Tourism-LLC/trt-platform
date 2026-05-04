import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { withLocalePath } from "@/i18n/pathname";
import { AcceptTermsForm } from "./AcceptTermsForm";

export const metadata: Metadata = {
  title: "Terms & Privacy",
  robots: { index: false, follow: false },
};

export default async function AcceptTermsPage() {
  const t = await getTranslations("auth.acceptTerms");
  const locale = await getLocale();
  const homeHref = withLocalePath("/", locale);
  const privacyHref = withLocalePath("/privacy", locale);
  const termsHref = withLocalePath("/terms", locale);
  const cookiesHref = withLocalePath("/cookies", locale);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2 flex flex-col items-center text-center">
          <Link href={homeHref} className="inline-block mb-4">
            <Image
              src="/assets/logo-regenerative-tourism-black.svg"
              alt="The Regenerative Tourism"
              width={130}
              height={30}
              className="h-7 w-auto"
            />
          </Link>
          <h1 className="type-h2 text-foreground">
            {t("title")}
          </h1>
          <p className="type-s text-black max-w-sm">
            {t("subtitle")}
          </p>
        </div>

        <div className="card">
          <AcceptTermsForm />
        </div>

        <p className="text-center type-xs text-black">
          {t.rich("footer", {
            privacy: (chunks) => (
              <Link href={privacyHref} className="underline hover:text-foreground">
                {chunks}
              </Link>
            ),
            terms: (chunks) => (
              <Link href={termsHref} className="underline hover:text-foreground">
                {chunks}
              </Link>
            ),
            cookies: (chunks) => (
              <Link href={cookiesHref} className="underline hover:text-foreground">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </div>
    </div>
  );
}
