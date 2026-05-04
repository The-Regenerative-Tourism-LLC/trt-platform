import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { withLocalePath } from "@/i18n/pathname";
import { SelectRoleForm } from "./SelectRoleForm";

export const metadata: Metadata = {
  title: "Choose Your Role",
  robots: { index: false, follow: false },
};

export default async function SelectRolePage() {
  const t = await getTranslations("auth.selectRole");
  const locale = await getLocale();
  const homeHref = withLocalePath("/", locale);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="space-y-2">
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

        <div className="card">
          <SelectRoleForm />
        </div>
      </div>
    </div>
  );
}
