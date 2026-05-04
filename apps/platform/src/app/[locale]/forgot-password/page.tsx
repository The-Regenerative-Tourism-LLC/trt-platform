import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { withLocalePath } from "@/i18n/pathname";
import ForgotPasswordForm from "./ForgotPasswordForm";

export default async function ForgotPasswordPage() {
  const t = await getTranslations("auth.forgotPassword");
  const locale = await getLocale();
  const homeHref = withLocalePath("/", locale);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="max-w-sm w-full space-y-8">
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
          <p className="type-s text-muted-foreground text-center">
            {t("subtitle")}
          </p>
        </div>

        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
