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
    <footer className="bg-[#1C1C1C] text-[#FDF5EA]">
      <div className="container mx-auto max-w-7xl py-12 md:py-20 px-5 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2">
              <Image
                src="/assets/logo-regenerative-tourism-white.svg"
                alt="The Regenerative Tourism"
                width={140}
                height={32}
                className="h-7 w-auto"
              />
            </div>
            <p className="text-sm text-white/50 max-w-xs leading-relaxed">
              {t("tagline")}
            </p>
          </div>

          {/* Platform */}
          <div className="md:col-span-3 space-y-4">
            <p className="font-hand text-xl text-white/50">
              {t("platform")}
            </p>
            <div className="space-y-2.5">
              <Link
                href={withLocale("/discover")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("discover")}
              </Link>
              <Link
                href={withLocale("/destinations")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("destinations")}
              </Link>
              <Link
                href={withLocale("/signup")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("operatorSignup")}
              </Link>
              <Link
                href={withLocale("/leaderboard")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("impactRecord")}
              </Link>
              <Link
                href={withLocale("/pricing")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("pricing")}
              </Link>
            </div>
          </div>

          {/* Journal */}
          <div className="md:col-span-2 space-y-4">
            <p className="font-hand text-xl text-white/50">
              {t("journal")}
            </p>
            <div className="space-y-2.5">
              <Link
                href={withLocale("/journal")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("blog")}
              </Link>
              <Link
                href={withLocale("/journal?tab=press")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("press")}
              </Link>
              <Link
                href={withLocale("/journal?tab=research")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("research")}
              </Link>
            </div>
          </div>

          {/* Methodology */}
          <div className="md:col-span-2 space-y-4">
            <p className="font-hand text-xl text-white/50">
              {t("methodology")}
            </p>
            <div className="space-y-2.5">
              <Link
                href={withLocale("/methodology")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("fullMethodology")}
              </Link>
              <Link
                href={withLocale("/methodology?tab=gps")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("gps")}
              </Link>
              <Link
                href={withLocale("/methodology?tab=dpi")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("dpi")}
              </Link>
              <Link
                href={withLocale("/methodology?tab=tip")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("tip")}
              </Link>
              <Link
                href={withLocale("/methodology?tab=evidence")}
                className="block text-sm text-white/60 hover:text-white transition-colors"
              >
                {t("evidence")}
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 md:mt-16 pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-[11px] text-white/40">
            {t("copyright", { year: new Date().getFullYear() })}
          </p>

          {/* Legal links */}
          <div className="flex flex-wrap gap-4">
            <Link
              href={withLocale("/privacy")}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {t("privacy")}
            </Link>
            <Link
              href={withLocale("/terms")}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {t("terms")}
            </Link>
            <Link
              href={withLocale("/cookies")}
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              {t("cookies")}
            </Link>
            <a
              href="https://theregenerativetourism.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-white/40 hover:text-white/70 transition-colors"
            >
              theregenerativetourism.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
