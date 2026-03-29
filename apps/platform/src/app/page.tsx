import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Leaf,
  TrendingUp,
  Globe,
  Building2,
  Compass,
  Users,
  HeartHandshake,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Green Passport · The Regenerative Tourism",
};

const HOW_IT_WORKS = [
  {
    num: "1",
    title: "Create your operator account",
    desc: "Sign up and tell us about your operation — it takes 10 minutes.",
  },
  {
    num: "2",
    title: "Submit evidence",
    desc: "Certifications, photos, contracts — whatever proves what you actually do.",
  },
  {
    num: "3",
    title: "Get your score",
    desc: "Your verified Green Passport Score appears on your listing — visible at booking.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ═══ MARQUEE TICKER ═══ */}
      <div className="bg-navy text-white overflow-hidden border-b border-white/5">
        <div className="animate-marquee whitespace-nowrap py-2.5 flex">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mr-8 shrink-0">
              <span className="text-[11px] tracking-wide text-white/40">
                30 FOUNDING OPERATORS — MADEIRA&apos;S FIRST REGENERATIVE MAP
              </span>
              <span className="text-white/15">·</span>
              <span className="text-[11px] tracking-wide text-white/40">
                OPEN TO ALL OPERATORS — GET YOUR GPS SCORE
              </span>
              <span className="text-white/15">·</span>
              <span className="text-[11px] tracking-wide text-white/40">
                METHODOLOGY V1.0 — EVIDENCE-VERIFIED
              </span>
              <span className="text-white/15">·</span>
              <span className="text-[11px] tracking-wide text-white/40">
                ONLY 7% OF SUSTAINABILITY CLAIMS CAN BE VERIFIED AT BOOKING
              </span>
              <span className="text-white/15">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ SPLIT HERO — OPERATORS LEFT + TRAVELERS RIGHT ═══ */}
      <section className="grid md:grid-cols-2 min-h-[50vh] md:min-h-[75vh]">
        {/* Left — Operators */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 gradient-olive" />
          <div className="absolute inset-0 bg-gradient-to-t from-[hsl(80,15%,10%)] via-[hsl(80,15%,10%,0.5)] to-transparent" />
          <div className="relative z-10 flex flex-col justify-end h-full px-5 sm:px-6 md:px-10 lg:px-14 pb-8 sm:pb-10 md:pb-14 pt-16 sm:pt-20 md:pt-32">
            <p className="editorial-label text-white/40 mb-4">For operators</p>
            <h1 className="text-[1.75rem] sm:text-[2.2rem] md:text-[2.8rem] lg:text-[3.2rem] font-bold text-white leading-[0.95] tracking-tight">
              Everything you do right —
              <br />
              <span className="text-accent">finally visible.</span>
            </h1>
            <p className="text-white/50 text-sm max-w-sm mt-4 leading-relaxed">
              You invest in sustainability. You train locally. You reinvest.
              Right now, none of that shows on any booking platform. Get your
              Green Passport Score — the first verified metric visible at the
              moment of booking.
            </p>
            <Link
              href="/auth/signup?role=operator"
              className="inline-flex items-center bg-white text-foreground hover:bg-white/90 px-6 h-12 text-sm font-semibold mt-6 w-fit rounded-md transition-colors"
            >
              Get your score
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <p className="text-[10px] text-white/25 mt-3">
              Open to any operator. Free to start.
            </p>
          </div>
        </div>

        {/* Right — Travelers */}
        <div className="bg-background flex flex-col justify-end px-5 sm:px-6 md:px-10 lg:px-14 pb-8 sm:pb-10 md:pb-14 pt-10 sm:pt-14 md:pt-32">
          <p className="editorial-label text-accent mb-4">For travelers</p>
          <h2 className="text-[1.75rem] sm:text-[2.2rem] md:text-[2.8rem] lg:text-[3.2rem] font-bold leading-[0.95] tracking-tight">
            Travel with your
            <br />
            <span className="text-muted-foreground">eyes open.</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm mt-4 leading-relaxed">
            Your travel is a choice you can own. Discover operators verified for
            real impact — before you book, not after.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-6 h-12 text-sm font-semibold mt-6 w-fit rounded-md transition-colors"
          >
            Explore operators
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Open to travelers globally. Free account.
          </p>

          {/* Mini stats */}
          <div className="flex flex-wrap gap-4 sm:gap-6 mt-8 sm:mt-10 pt-5 sm:pt-6 border-t border-border">
            <div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
                84%
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px]">
                of modern sustainability metrics in tourism are self-reported
              </p>
            </div>
            <div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
                7%
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px]">
                can verify any of it — because no standard exists at booking
              </p>
            </div>
            <div>
              <span className="text-xl sm:text-2xl md:text-3xl font-bold text-accent">
                0
              </span>
              <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[120px]">
                verified options exist at the moment travelers choose today
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOR OPERATORS — FULL SECTION ═══ */}
      <section className="bg-navy text-white">
        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-28">
          <p className="editorial-label text-white/30 mb-4">For operators</p>
          <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[3rem] font-bold leading-[0.95] tracking-tight max-w-xl">
            Your sustainability work isn&apos;t{" "}
            <span className="text-accent">invisible</span> anymore.
          </h2>
          <p className="text-sm text-white/40 max-w-lg mt-4 leading-relaxed">
            Any tourism operator can get a verified Green Passport Score. Submit
            your data, get scored, get discovered — and let your performance
            drive your differentiation.
          </p>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12 mt-12 md:mt-16">
            {/* Left — GPS Score preview */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 md:p-8 space-y-6">
              <h3 className="text-sm font-bold text-white">
                Your Green Passport Score
              </h3>
              <p className="text-xs text-white/40">
                A real, third-party-verified score based on what you actually do
                — not a claim. Over 20 indicators. Three pillars. One verified
                result.
              </p>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-black tabular-nums text-white">
                    74
                  </div>
                  <p className="text-[10px] text-white/30 mt-1">GPS Score</p>
                </div>
                <div className="space-y-2 flex-1">
                  {[
                    { label: "Footprint", value: 78, color: "hsl(var(--gps-footprint))" },
                    { label: "Local", value: 71, color: "hsl(var(--gps-local))" },
                    { label: "Regen", value: 65, color: "hsl(var(--gps-regen))" },
                  ].map((p) => (
                    <div key={p.label} className="space-y-1">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-white/40">{p.label}</span>
                        <span className="text-white/60 font-mono">{p.value}</span>
                      </div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${p.value}%`, backgroundColor: p.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — How it works */}
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-white">How it works</h3>
              <p className="text-xs text-white/40">
                Three steps from invisible to verified. Open to any operator
                worldwide.
              </p>
              <div className="space-y-5">
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.num} className="flex gap-4">
                    <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-white/60">
                        {step.num}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {step.title}
                      </p>
                      <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/auth/signup?role=operator"
                className="inline-flex items-center bg-white text-foreground hover:bg-white/90 px-6 h-11 text-sm font-semibold mt-4 rounded-md transition-colors"
              >
                Create operator account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <p className="text-[10px] text-white/25 mt-2">
                Free to start. No commitment until you publish your score.
              </p>
            </div>
          </div>

          {/* DPI Preview + Cohort CTA */}
          <div className="grid md:grid-cols-2 gap-8 mt-10">
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">
                Know your destination&apos;s pressure
              </h3>
              <p className="text-xs text-white/40 max-w-sm">
                Your score is contextualised against where you operate. See
                tourist intensity, ecological sensitivity, and economic leakage
                — in real time.
              </p>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl p-4 mt-2">
                <p className="text-[10px] uppercase tracking-widest text-white/25 mb-2">
                  Destination Pressure Index · Madeira
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl sm:text-4xl font-bold tabular-nums text-white">
                    48
                  </span>
                  <span className="text-sm text-white/30 mb-1">/100</span>
                </div>
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 bg-accent/20 text-accent mt-2 uppercase tracking-wider">
                  Moderate Pressure
                </span>
                <div className="flex gap-4 mt-3 pt-3 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-white/30 block">
                      Intensity
                    </span>
                    <span className="text-xs font-mono text-white/60">
                      68/100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/30 block">
                      Sensitivity
                    </span>
                    <span className="text-xs font-mono text-white/60">
                      72/100
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/30 block">
                      Leakage
                    </span>
                    <span className="text-xs font-mono text-white/60">
                      38/100
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Founding Operators CTA */}
            <div className="relative overflow-hidden rounded-2xl gradient-olive">
              <div className="absolute inset-0 bg-gradient-to-t from-[hsl(80,30%,20%)] via-[hsl(80,25%,25%,0.85)] to-[hsl(80,20%,30%,0.7)]" />
              <div className="relative z-10 p-6 flex flex-col justify-end h-full min-h-[280px]">
                <span className="text-[10px] uppercase tracking-widest text-white/40 mb-2">
                  Closed cohort · 30 operators
                </span>
                <h3 className="text-lg font-bold text-white">
                  Founding Operators of Madeira&apos;s
                  <br />
                  Regenerative Map
                </h3>
                <p className="text-xs text-white/60 mt-2 max-w-xs leading-relaxed">
                  30 operators will collectively build the first verified
                  Regenerative Map of Madeira. They aren&apos;t early adopters —
                  they are the dataset that makes the map real.
                </p>
                <Link
                  href="/auth/signup?role=operator"
                  className="inline-flex items-center bg-white text-foreground hover:bg-white/90 px-6 h-11 text-sm font-semibold mt-5 w-fit rounded-md transition-colors"
                >
                  Apply as Founding Operator
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOR TRAVELERS — "You already care" ═══ */}
      <section className="bg-background">
        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-28">
          <p className="editorial-label text-accent mb-4">For travelers</p>
          <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[3rem] font-bold leading-[0.95] tracking-tight max-w-lg">
            You already care.
            <br />
            Now you can
            <br />
            <span className="text-muted-foreground">act on it.</span>
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mt-4 leading-relaxed">
            Discover operators with a verified Green Passport Score. See the
            pressure on your destination. And after the trip — see what your
            visit actually built.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">
            {/* Discover operators */}
            <div className="border border-border rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold">
                Discover verified operators
              </h3>
              <p className="text-xs text-muted-foreground">
                Browse verified scores in real time. Sort by score, filter by
                pillar — find operators doing real work.
              </p>
              <div className="space-y-3">
                {[
                  {
                    name: "Wild Trails Madeira",
                    region: "Ribeira Brava, PT",
                    score: 74,
                  },
                  {
                    name: "Levada Walks",
                    region: "São Vicente, PT",
                    score: 68,
                  },
                ].map((op) => (
                  <div
                    key={op.name}
                    className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {op.name.charAt(0)}
                        {op.name.split(" ")[1]?.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {op.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {op.region}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-bold text-accent">
                      {op.score}
                    </span>
                  </div>
                ))}
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" /> More joining every month
                </p>
              </div>
            </div>

            {/* Post-trip report */}
            <div className="border border-border rounded-2xl p-6 space-y-5">
              <h3 className="text-sm font-bold">
                See your impact after the trip
              </h3>
              <p className="text-xs text-muted-foreground">
                After you go, we&apos;ll show you what your stay contributed —
                based on verified data, not estimates.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { icon: Leaf, label: "Renewable energy", value: "92%" },
                  { icon: TrendingUp, label: "Local economy", value: "€48/day" },
                  { icon: Globe, label: "Carbon offset", value: "3.2 tCO₂" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-secondary/60 rounded-xl p-3 text-center space-y-1.5"
                  >
                    <m.icon className="w-4 h-4 text-accent mx-auto" />
                    <p className="text-xs font-bold">{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Choice Score", value: "+12 pts" },
                  { label: "Contribution events", value: "3 activities" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="bg-secondary/40 rounded-xl p-3 text-center space-y-1"
                  >
                    <p className="text-xs font-bold">{m.value}</p>
                    <p className="text-[9px] text-muted-foreground">
                      {m.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOUNDING OPERATORS ═══ */}
      <section className="bg-navy text-white border-y border-white/5">
        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="editorial-label text-white/30 mb-4">
              Founding cohort · Madeira
            </p>
            <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[3rem] font-bold leading-[0.95] tracking-tight">
              30 operators will build
              <br />
              <span className="text-accent">the first Regenerative Map.</span>
            </h2>
            <p className="text-sm text-white/40 mt-5 max-w-lg mx-auto leading-relaxed">
              The Founding Operators of Madeira are not early adopters. They are
              the dataset that makes the map real. Their willingness to be
              measured, documented, and verified produces the first
              evidence-based picture of regenerative practices in this territory.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: Building2,
                title: "Permanent Founder status",
                desc: "Permanent designation on your public profile. Fixed pricing at €29/month — forever, as long as you stay. 3 months free to start.",
              },
              {
                icon: Compass,
                title: "Field documentation",
                desc: "Professional photography and video of your regenerative practices — published through the platform's editorial channels.",
              },
              {
                icon: Users,
                title: "Pillar 3 guidance",
                desc: "No active conservation programme yet? Included: a 30-minute orientation session and a Forward Commitment Record.",
              },
            ].map((card) => (
              <div
                key={card.title}
                className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4"
              >
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <card.icon className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-sm font-bold text-white">{card.title}</h3>
                <p className="text-xs text-white/40 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FORWARD COMMITMENT ═══ */}
      <section className="bg-background border-b border-border">
        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--trt-amber))]/15 flex items-center justify-center mb-5">
                <HeartHandshake className="w-5 h-5 text-[hsl(var(--trt-amber))]" />
              </div>
              <p className="editorial-label text-[hsl(var(--trt-amber))] mb-3">
                Forward Commitment
              </p>
              <h2 className="text-[1.5rem] sm:text-[1.8rem] md:text-[2.4rem] font-bold leading-[0.95] tracking-tight">
                Low score today?
                <br />
                <span className="text-muted-foreground">
                  That&apos;s a starting point,
                  <br />
                  not a verdict.
                </span>
              </h2>
              <p className="text-sm text-muted-foreground max-w-md mt-5 leading-relaxed">
                The Green Passport doesn&apos;t penalise — it maps where you are
                and helps you move forward. If you don&apos;t have an active
                regenerative programme yet, you can sign a{" "}
                <strong className="text-foreground">Forward Commitment</strong>:
                a declaration that you intend to implement one within the next
                assessment cycle.
              </p>
              <Link
                href="/auth/signup?role=operator"
                className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-6 h-11 text-sm font-semibold mt-6 rounded-md transition-colors"
              >
                Sign your Forward Commitment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-bold">
                  For operators with a low score
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A low score means you have room to grow — and now you have a
                  clear roadmap. Sign your Forward Commitment, get matched with
                  a local partner, and start building your regenerative
                  programme.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />
                  <span className="text-[10px] text-muted-foreground">
                    15 baseline P3 points · Institutional matching · Guidance
                    session included
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ OPEN PLATFORM ═══ */}
      <section className="bg-secondary/40 border-b border-border">
        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <p className="editorial-label text-accent mb-4">Open to all</p>
            <h2 className="text-[1.6rem] sm:text-[2rem] md:text-[3rem] font-bold leading-[0.95] tracking-tight">
              Not in Madeira?
              <br />
              <span className="text-muted-foreground">
                Get your score anyway.
              </span>
            </h2>
            <p className="text-sm text-muted-foreground mt-5 max-w-md mx-auto leading-relaxed">
              The GPS methodology works for any tourism operator worldwide.
              Create your account, submit your data, and receive a verified
              Green Passport Score — regardless of location.
            </p>
            <Link
              href="/auth/signup?role=operator"
              className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-6 h-12 text-sm font-semibold mt-8 rounded-md transition-colors"
            >
              Get your score — it&apos;s free to start
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DUAL CTA — OPERATORS + TRAVELERS ═══ */}
      <section className="grid md:grid-cols-2">
        <div className="bg-background px-5 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 md:py-24 md:border-r border-border">
          <p className="editorial-label text-accent mb-3">For operators</p>
          <h2 className="text-[1.5rem] sm:text-[1.8rem] md:text-[2.4rem] font-bold leading-[0.95] tracking-tight">
            Get your
            <br />
            score.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mt-4 leading-relaxed">
            Any operator, anywhere. Submit your data, get a verified GPS, and
            make your sustainability investment visible at the point of booking.
          </p>
          <Link
            href="/auth/signup?role=operator"
            className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-6 h-12 text-sm font-semibold mt-6 rounded-md transition-colors"
          >
            Get your score
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Free to start. Open to operators worldwide.
          </p>
        </div>

        <div className="bg-secondary/40 px-5 sm:px-6 md:px-10 lg:px-14 py-12 sm:py-16 md:py-24">
          <p className="editorial-label text-accent mb-3">For travelers</p>
          <h2 className="text-[1.5rem] sm:text-[1.8rem] md:text-[2.4rem] font-bold leading-[0.95] tracking-tight">
            Explore verified
            <br />
            operators.
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs mt-4 leading-relaxed">
            Browse verified operators now. Traveler accounts with QR scanning
            and impact tracking are coming soon.
          </p>
          <Link
            href="/discover"
            className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-6 h-12 text-sm font-semibold mt-6 rounded-md transition-colors"
          >
            Explore operators
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          <p className="text-[10px] text-muted-foreground/50 mt-3">
            Free. Browse all verified operators.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
