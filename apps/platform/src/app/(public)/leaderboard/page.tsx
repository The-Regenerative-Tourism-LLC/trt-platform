import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Leaderboard",
  description:
    "Top regenerative travelers ranked by cumulative Choice Score.",
};

export default function LeaderboardPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-navy text-white">
        <div className="container mx-auto max-w-7xl py-14 md:py-24 px-5 md:px-6 space-y-4">
          <p className="editorial-label text-white/30">Community</p>
          <h1 className="text-2xl md:text-[3rem] font-bold tracking-tight leading-[1.05]">
            Regenerative leaderboard
          </h1>
          <p className="text-sm text-white/50 max-w-lg leading-relaxed">
            Travelers ranked by cumulative Choice Score — earned through
            verified regenerative bookings, activities, and check-ins.
          </p>
        </div>
      </section>

      <div className="container mx-auto max-w-3xl py-8 md:py-12 px-5 md:px-6">
        <div className="text-center py-20 space-y-4">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto" />
          <h2 className="text-lg font-bold">Coming soon</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">
            The traveler leaderboard will be available once traveler accounts
            launch. Earn points by booking verified operators, checking in via QR
            code, and joining regenerative activities.
          </p>
          <Button variant="outline" asChild>
            <Link href="/auth/signup?role=traveler">
              Join as traveler
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
}
