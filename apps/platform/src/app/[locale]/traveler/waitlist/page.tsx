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
      <section className="relative min-h-[60vh] flex items-end overflow-hidden">
        <Image
          src="/assets/waitlist-hero.jpg"
          alt="Travelers in nature"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Image overlay — opacity allowed */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
        <div className="relative z-10 container-section pb-16 md:pb-24 grid md:grid-cols-2 gap-10 items-end">
          <div>
            <p className="type-label text-pink italic mb-4">For travelers</p>
            <h1 className="type-h1 text-dark-foreground">
              Your impact
              <br />
              will be
              <br />
              visible soon
            </h1>
          </div>
          <div className="space-y-5">
            <p className="type-m text-pink max-w-sm">
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
      <section className="section">
        <div className="container-section">
          <p className="type-label text-muted-foreground italic mb-3">
            Available now
          </p>
          <h2 className="type-h2 mb-3">What you can do today</h2>
          <p className="type-s text-muted-foreground max-w-md mb-10">
            While the full traveler experience is being built, you can already
            explore what&apos;s on the map.
          </p>
          <div className="grid md:grid-cols-2 gap-4 max-w-3xl">
            <div className="card flex flex-col gap-4">
              <h3 className="type-m font-semibold">Browse destinations</h3>
              <p className="type-s text-muted-foreground flex-1">
                See the Destination Pressure Index for Madeira and upcoming
                territories.
              </p>
              <Link
                href="/destinations"
                className="inline-flex items-center gap-1 type-s font-medium text-foreground hover:underline"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="card flex flex-col gap-4">
              <h3 className="type-m font-semibold">Discover operators</h3>
              <p className="type-s text-muted-foreground flex-1">
                See verified Green Passport Scores for operators already in the
                program.
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-1 type-s font-medium text-foreground hover:underline"
              >
                Browse <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. HOW IT WILL WORK ═══ */}
      <section className="section section-dark">
        <div className="container-section">
          <p className="type-label text-pink italic mb-3">Coming soon</p>
          <h2 className="type-h2 text-dark-foreground mb-3">How it will work</h2>
          <p className="type-s text-pink max-w-lg mb-12">
            When you visit a verified operator, scan their QR code. Your visit
            is logged and verified — and after your trip, you see exactly what
            your stay contributed.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card card-dashed space-y-3">
                <span className="text-dark-foreground">{f.icon}</span>
                <h3 className="type-s font-semibold text-dark-foreground">{f.title}</h3>
                <p className="type-xs text-pink">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Dark explainer card */}
          <div className="mt-8 card card-dark">
            <div className="mb-5 text-pink">
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
            <h3 className="type-m font-bold text-dark-foreground mb-5">
              Why use the Green Passport instead of booking directly?
            </h3>
            <p className="type-s text-pink max-w-2xl">
              When you book or check in through the platform, your visit is{" "}
              <strong className="text-dark-foreground font-semibold">
                verified and measured
              </strong>
              . The operator gets credit for the work they do — creating a
              feedback loop that rewards regenerative practices over extractive
              ones.
            </p>
            <p className="type-s text-pink mt-4 max-w-2xl">
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
