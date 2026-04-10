import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, QrCode, BarChart2, FileText, Leaf, User, Eye } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LookbookCta } from "@/components/sections/LookbookCta";

export const metadata: Metadata = {
  title: "Traveler Waitlist",
  description:
    "Join the waitlist for the traveler experience. See exactly what your travel choices contribute — before you book, and after you travel.",
};

const features = [
  {
    icon: <QrCode className="w-5 h-5" />,
    title: "Scan on site",
    desc: "Visit a verified operator and scan their QR code. Confirms your visit and starts your contribution record.",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    title: "Track your impact",
    desc: "Every verified stay experiences builds your record — a running account of what your travel choices actually contributed.",
  },
  {
    icon: <FileText className="w-5 h-5" />,
    title: "Post-trip reports",
    desc: "After each stay, see exactly what your visit contributed — renewable energy used, local spend generated, conservation supported.",
  },
  {
    icon: <Leaf className="w-5 h-5" />,
    title: "Biodiversity missions",
    desc: "Join citizen science missions — photograph species, explore habitats, turn your attention into actual conservation data.",
  },
  {
    icon: <User className="w-5 h-5" />,
    title: "Your contribution history",
    desc: "A running record of your role, activity, and mission — what you actually did, in places that needed it.",
  },
  {
    icon: <Eye className="w-5 h-5" />,
    title: "Pre-booking signals",
    desc: "Before you book, see each operator's GPS score and destination pressure — verified data, not marketing.",
  },
];

export default function TravelerWaitlistPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative min-h-[60vh] flex items-end overflow-hidden text-white">
        <Image
          src="/assets/waitlist-hero.jpg"
          alt="Travelers in nature"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1C1C1C]/30 via-[#1C1C1C]/50 to-[#1C1C1C]/80" />
        <div className="relative z-10 max-w-[1400px] mx-auto w-full px-6 md:px-16 lg:px-24 pb-16 md:pb-24 grid md:grid-cols-2 gap-10 items-end">
          <div>
            <p className="font-hand text-base md:text-xl italic mb-4 text-white/70">
              For travelers
            </p>
            <h1 className="fm-hero-heading leading-none">
              Your impact
              <br />
              will be
              <br />
              visible soon
            </h1>
          </div>
          <div className="space-y-5">
            <p className="text-sm md:text-base text-white/80 leading-relaxed max-w-sm">
              We&apos;re building the traveler experience right now. Once our
              first cohort of verified operators is live, you&apos;ll be able to
              see exactly what your travel choices contribute — before you book,
              and after you travel.
            </p>
            <div className="klaviyo-form-TBARtU max-w-[400px]" />
          </div>
        </div>
      </section>

      {/* ═══ 2. WHAT YOU CAN DO TODAY ═══ */}
      <section style={{ backgroundColor: "#F5F1EB" }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24">
          <p className="font-hand text-base md:text-xl italic mb-3 text-muted-foreground">
            Available now
          </p>
          <h2 className="fm-section-heading mb-3">What you can do today</h2>
          <p className="text-sm text-muted-foreground max-w-md mb-10 leading-relaxed">
            While the full traveler experience is being built, you can already
            explore what&apos;s on the map.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            <div className="rounded-2xl border border-border bg-background p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-base">Browse destinations</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                See the Destination Pressure Index for Madeira and upcoming
                territories.
              </p>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="rounded-2xl border border-border bg-background p-6 flex flex-col gap-4">
              <h3 className="font-semibold text-base">Discover operators</h3>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                See verified Green Passport Scores for operators already in the
                program.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground hover:underline"
              >
                Browse <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. HOW IT WILL WORK ═══ */}
      <section style={{ backgroundColor: "#EDEAE4" }}>
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24">
          <p className="font-hand text-base md:text-xl italic mb-3 text-muted-foreground">
            Coming soon
          </p>
          <h2 className="fm-section-heading mb-3">How it will work</h2>
          <p className="text-sm text-muted-foreground max-w-lg mb-12 leading-relaxed">
            When you visit a verified operator, scan their QR code. Your visit
            is logged and verified — and after your trip, you see exactly what
            your stay contributed.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border/60 bg-background/50 p-6 space-y-3"
              >
                <span className="text-muted-foreground">{f.icon}</span>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Dark explainer card */}
          <div className="mt-8 rounded-2xl bg-foreground text-background p-8 md:p-12">
            <div className="mb-5 opacity-50">
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1M3 12h1m16 0h1M5.636 5.636l.707.707m11.314-.707-.707.707M5.636 18.364l.707-.707m11.314.707-.707-.707"
                />
              </svg>
            </div>
            <h3 className="font-bold text-base md:text-lg mb-5">
              Why use the Green Passport instead of booking directly?
            </h3>
            <p className="text-sm text-background/70 leading-relaxed max-w-2xl">
              When you book or check in through the platform, your visit is{" "}
              <strong className="text-background font-semibold">
                verified and measured
              </strong>
              . The operator gets credit for the work they do — creating a
              feedback loop that rewards regenerative practices over extractive
              ones.
            </p>
            <p className="text-sm text-background/70 leading-relaxed mt-4 max-w-2xl">
              And when post-trip reports launch, you&apos;ll see exactly what
              your stay contributed.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ 4. LOOKBOOK / FINAL CTA ═══ */}
      <LookbookCta
        eyebrow="For travelers"
        heading={
          <>
            You care where you go.
            <br />
            Now you can prove it.
          </>
        }
      >
        <div className="klaviyo-form-SbN4HA max-w-[400px]" />
      </LookbookCta>

      <Footer />
    </div>
  );
}
