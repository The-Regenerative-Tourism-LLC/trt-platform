"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { withLocalePath } from "@/i18n/pathname";

export function Footer() {
  const t = useTranslations("public.footer");
  const locale = useLocale();
  const withLocale = (path: string) => withLocalePath(path, locale);

  return (
    <footer className="section-dark">
      <div className="container mx-auto max-w-page py-12 md:py-20 px-5 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-5 space-y-3">
            <Image
              src="/assets/logo-regenerative-tourism-white.svg"
              alt="The Regenerative Tourism"
              width={140}
              height={32}
              className="h-7 w-auto"
            />
            <p className="type-s text-pink max-w-xs">{t("tagline")}</p>
          </div>

          {/* Platform */}
          <div className="md:col-span-3 space-y-4">
            <p className="type-label text-pink">{t("platform")}</p>
            <div className="space-y-2.5">
              {[
                { href: withLocale("/discover"), label: t("discover") },
                { href: withLocale("/destinations"), label: t("destinations") },
                { href: withLocale("/signup"), label: t("operatorSignup") },
                { href: withLocale("/leaderboard"), label: t("impactRecord") },
                { href: withLocale("/pricing"), label: t("pricing") },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="block type-s text-dark-foreground hover:text-lime transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Journal */}
          <div className="md:col-span-2 space-y-4">
            <p className="type-label text-pink">{t("journal")}</p>
            <div className="space-y-2.5">
              <Link href={withLocale("/journal")} className="block type-s text-dark-foreground hover:text-lime transition-colors">{t("blog")}</Link>
              <Link href={withLocale("/journal?tab=press")} className="block type-s text-dark-foreground hover:text-lime transition-colors">{t("press")}</Link>
              <Link href={withLocale("/journal?tab=research")} className="block type-s text-dark-foreground hover:text-lime transition-colors">{t("research")}</Link>
            </div>
          </div>

          {/* Methodology */}
          <div className="md:col-span-2 space-y-4">
            <p className="type-label text-pink">{t("methodology")}</p>
            <div className="space-y-2.5">
              {[
                { href: withLocale("/methodology"), label: t("fullMethodology") },
                { href: withLocale("/methodology?tab=gps"), label: t("gps") },
                { href: withLocale("/methodology?tab=dpi"), label: t("dpi") },
                { href: withLocale("/methodology?tab=tip"), label: t("tip") },
                { href: withLocale("/methodology?tab=evidence"), label: t("evidence") },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="block type-s text-dark-foreground hover:text-lime transition-colors">
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="divider-light mt-12 md:mt-16" />
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-6">
          <p className="type-xs text-pink">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>
          <div className="flex flex-wrap gap-4">
            {[
              { href: withLocale("/privacy"), label: t("privacy") },
              { href: withLocale("/terms"), label: t("terms") },
              { href: withLocale("/cookies"), label: t("cookies") },
            ].map(({ href, label }) => (
              <Link key={href} href={href} className="type-xs text-pink hover:text-dark-foreground transition-colors">{label}</Link>
            ))}
            <a href="https://theregenerativetourism.com" target="_blank" rel="noopener noreferrer" className="type-xs text-pink hover:text-dark-foreground transition-colors">
              theregenerativetourism.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
