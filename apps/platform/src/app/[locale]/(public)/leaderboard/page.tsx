import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Regenerative Traveler Leaderboard",
  description:
    "Top regenerative travelers ranked by cumulative Choice Score — see who's leading the shift to responsible travel.",
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Regenerative Traveler Leaderboard · The Regenerative Tourism",
    description:
      "Top regenerative travelers ranked by cumulative Choice Score.",
    url: "/leaderboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regenerative Traveler Leaderboard · The Regenerative Tourism",
    description:
      "Top regenerative travelers ranked by cumulative Choice Score.",
  },
};

export default async function LeaderboardPage() {
  const t = await getTranslations("public.leaderboard");
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/assets/leaderboard-hero.jpg"
          alt="Impact Record"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/55 via-[#1C1C1C]/70 to-[#1C1C1C]/85" />
        <div className="relative z-10 container mx-auto max-w-7xl py-14 md:py-24 px-5 md:px-6 space-y-4">
          <p className="editorial-label text-white/50">{t("hero.label")}</p>
          <h1 className="text-2xl md:text-[3rem] font-bold tracking-tight leading-[1.05]">
            {t("hero.title")}
          </h1>
          <p className="text-sm text-white/60 max-w-lg leading-relaxed">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl py-8 md:py-12 px-5 md:px-6">
        <div className="text-center py-20 space-y-4">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold">{t("comingSoon.title")}</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            {t("comingSoon.description")}
          </p>
          <Button variant="outline" asChild>
            <Link href="/traveler/waitlist">
              {t("joinAsTraveler")}
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
