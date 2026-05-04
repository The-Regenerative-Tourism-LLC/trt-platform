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
    description: "Top regenerative travelers ranked by cumulative Choice Score.",
    url: "/leaderboard",
  },
  twitter: {
    card: "summary_large_image",
    title: "Regenerative Traveler Leaderboard · The Regenerative Tourism",
    description: "Top regenerative travelers ranked by cumulative Choice Score.",
  },
};

export default async function LeaderboardPage() {
  const t = await getTranslations("public.leaderboard");
  return (
    <>
      {/* Hero — image overlay, opacity allowed */}
      <section className="relative overflow-hidden">
        <Image
          src="/assets/leaderboard-hero.jpg"
          alt="Impact Record"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/70 to-black/85" />
        <div className="relative z-10 container-section py-14 md:py-24 space-y-4">
          <p className="type-label text-pink">{t("hero.label")}</p>
          <h1 className="type-h1 text-dark-foreground">
            {t("hero.title")}
          </h1>
          <p className="type-m text-pink max-w-lg">
            {t("hero.description")}
          </p>
        </div>
      </section>

      <div className="container-text py-8 md:py-12">
        <div className="text-center py-20 space-y-4">
          <Trophy className="w-10 h-10 text-black mx-auto" />
          <h2 className="type-h5">{t("comingSoon.title")}</h2>
          <p className="type-s text-black max-w-md mx-auto">
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
