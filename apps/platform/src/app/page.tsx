import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Leaf } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Green Passport · The Regenerative Tourism",
};

function ScoreRings({
  fp,
  lc,
  rg,
  total,
  size = 120,
}: {
  fp: number;
  lc: number;
  rg: number;
  total: number;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const sw = Math.max(size * 0.065, 5);
  const r1 = cx - sw / 2 - 2;
  const r2 = r1 - sw - 5;
  const r3 = r2 - sw - 5;
  const dash = (r: number, v: number) => {
    const c = 2 * Math.PI * r;
    return `${(v / 100) * c} ${c}`;
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={cx}
        cy={cy}
        r={r1}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth={sw}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r2}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth={sw}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r3}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.1"
        strokeWidth={sw}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r1}
        fill="none"
        stroke="hsl(var(--gps-footprint))"
        strokeWidth={sw}
        strokeDasharray={dash(r1, fp)}
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r2}
        fill="none"
        stroke="hsl(var(--gps-local))"
        strokeWidth={sw}
        strokeDasharray={dash(r2, lc)}
        strokeLinecap="round"
      />
      <circle
        cx={cx}
        cy={cy}
        r={r3}
        fill="none"
        stroke="hsl(var(--gps-regen))"
        strokeWidth={sw}
        strokeDasharray={dash(r3, rg)}
        strokeLinecap="round"
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90,${cx},${cy})`}
        fontSize={size * 0.22}
        fontWeight="700"
        fill="currentColor"
      >
        {total}
      </text>
    </svg>
  );
}

const FAQ_ITEMS = [
  {
    question: "What is The Regenerative Tourism platform?",
    answer:
      "A verification layer for tourism. We measure and make visible the real environmental and social impact of operators — at the moment of booking.",
  },
  {
    question: "What is the Green Passport?",
    answer:
      "Your verified impact identity as a tourism operator. A score from 0 to 100 across three pillars, updated each cycle, visible to travelers when they book.",
  },
  {
    question: "How is this different from sustainability certifications?",
    answer:
      "Most certifications are static and hard to compare. We use a dynamic scoring system designed to be visible, transparent, and continuously updated.",
  },
  {
    question: "How does the verification process work?",
    answer:
      "Operators complete an assessment, submit supporting data, and receive a verified score. The process is structured, but designed to be simple.",
  },
  {
    question: "What if my score is low?",
    answer:
      "That's a starting point. We provide insights and guidance to help improve over time. The goal is progress — not perfection.",
  },
  {
    question: "How can I join?",
    answer:
      "You can apply to be part of the founding cohort or start the free assessment to understand your impact.",
  },
];

export default function LandingPage() {
  const mid = Math.ceil(FAQ_ITEMS.length / 2);
  const faqLeft = FAQ_ITEMS.slice(0, mid);
  const faqRight = FAQ_ITEMS.slice(mid);

  return (
    <div className="min-h-screen bg-[hsl(0,0%,8%)] overflow-x-hidden">
      <Navbar />

      {/* ═══ 1. HERO ═══ */}
      <section className="relative min-h-screen overflow-hidden flex items-end">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/hero-walk.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-[hsl(0,0%,5%)] via-[hsl(0,0%,6%)]/55 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[hsl(0,0%,6%)]/40 to-transparent" />

        <div className="relative z-10 w-full px-6 md:px-16 lg:px-24 pb-16 md:pb-24">
          <div className="max-w-[1400px] mx-auto grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-20 items-end">
            <div>
              <p className="font-[var(--font-hand)] text-base md:text-lg text-white/60 mb-4 italic">
                The first regenerative map of tourism
              </p>
              <h1 className="fm-hero-heading text-white">
                Travel impact.
                <br />
                Visible at the
                <br />
                moment of booking.
              </h1>
            </div>

            <div className="space-y-6 md:pb-4">
              <p className="text-base md:text-lg text-white/70 leading-relaxed max-w-md">
                We&apos;re building something that&apos;s never existed in
                tourism — a live impact layer that tells what tourism does to
                places, people and communities.
                <br />
                <br />
                For operators ready to measure and improve — a way to be found
                by travelers who care. For travelers — a way to make every trip
                count.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <Link
                  href="/signup"
                  className="inline-flex items-center bg-[hsl(var(--cream))] text-foreground hover:bg-[hsl(var(--cream))]/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
                >
                  Join as operator
                </Link>
                <Link
                  href="/traveler/waitlist"
                  className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white font-medium transition-colors"
                >
                  For travelers <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. PRESS & PARTNERS — Marquee ═══ */}
      <section className="bg-white border-b border-border overflow-hidden">
        <div className="py-5 md:py-6">
          <div className="animate-marquee flex w-max gap-8 md:gap-12 items-center">
            {[0, 1, 2].map((dup) => (
              <div
                key={dup}
                className="flex items-center gap-8 md:gap-12 shrink-0"
              >
                <a
                  href="https://retreat.startupmadeira.eu/finalists-2026/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:opacity-70 transition-opacity shrink-0"
                >
                  <Image
                    src="/assets/madeira-startup-retreat.png"
                    alt="Madeira Startup Retreat"
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain grayscale opacity-50"
                  />
                  <span className="text-[10px] uppercase tracking-[0.15em] font-medium text-[hsl(var(--tan))]">
                    Cohort 2026
                  </span>
                </a>
                <div className="w-px h-5 shrink-0 bg-[hsl(var(--tan))]/30" />
                <a
                  href="https://www.clarin.com/viajes/viajar-cuidar-destino-innovador-proyecto-jovenes-argentinos-brasileno-llego-europa_0_fexstVhMcf.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity shrink-0"
                >
                  <Image
                    src="/assets/clarin-logo.svg"
                    alt="Clarín"
                    width={80}
                    height={32}
                    className="h-8 w-auto object-contain grayscale opacity-50"
                  />
                </a>
                <div className="w-px h-5 shrink-0 bg-[hsl(var(--tan))]/30" />
                <a
                  href="https://www.canal12misiones.com/noticias-de-misiones/turismo/misioneros-finalistas-concurso-portugal"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity shrink-0"
                >
                  <Image
                    src="/assets/canal12-logo.png"
                    alt="Canal 12 Misiones"
                    width={120}
                    height={40}
                    className="h-10 w-auto object-contain grayscale opacity-50"
                  />
                </a>
                <div className="w-px h-5 shrink-0 bg-[hsl(var(--tan))]/30" />
                <a
                  href="https://www.instagram.com/reel/DUGuXlpjtDp/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:opacity-70 transition-opacity shrink-0"
                >
                  <Image
                    src="/assets/silicon-misiones-logo.png"
                    alt="Silicon Misiones"
                    width={100}
                    height={32}
                    className="h-8 w-auto object-contain grayscale opacity-50"
                  />
                </a>
                <div className="w-px h-5 shrink-0 bg-[hsl(var(--tan))]/30" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3. MANIFESTO ═══ */}
      <section className="fm-cream">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 items-end">
            <div className="reveal">
              <h2 className="fm-sub-heading text-foreground">
                There will be no tourism industry on a dead planet.
                <span className="block mt-1 text-muted-foreground">
                  We keep talking about sustainable travel while the places we
                  love quietly disappear. The problem isn&apos;t that travelers
                  don&apos;t care. The problem is that caring has never been
                  enough.
                </span>
              </h2>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mt-10">
                You can want to do the right thing and still have no way to know
                if you are. You can be an operator doing everything right — and
                still lose to someone who isn&apos;t. Because the system
                wasn&apos;t built to tell the difference. We&apos;re building
                that system.
              </p>
              <div className="mt-8">
                <Link
                  href="/signup"
                  className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
                >
                  Join us
                </Link>
              </div>
            </div>

            <div className="space-y-4 reveal">
              <div className="rounded-2xl overflow-hidden aspect-[3/4] max-h-[480px]">
                <Image
                  src="/assets/madeira-nature.jpg"
                  alt="Mountain stream and wildflowers in Madeira"
                  width={600}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="font-[var(--font-hand)] text-lg md:text-xl text-muted-foreground italic text-right">
                2026 — We start here in Madeira
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. FOUNDING COHORT ═══ */}
      <section className="relative overflow-hidden bg-[hsl(var(--tan))]">
        <Image
          src="/assets/madeira-map.svg"
          alt=""
          fill
          className="object-contain opacity-30 pointer-events-none"
          style={{ objectPosition: "center 60%" }}
          aria-hidden="true"
        />
        <div className="relative max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-28 md:py-44 text-center">
          <div className="reveal">
            <p className="font-[var(--font-hand)] text-lg md:text-xl text-white/70 italic">
              Founding cohort · Madeira 2026
            </p>
            <h2 className="fm-section-heading text-white mt-4 max-w-3xl mx-auto">
              30 operators.
              <br />
              One island.
              <br />
              The first regenerative map
              <br />
              in tourism history.
            </h2>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center bg-[hsl(var(--cream))] text-foreground hover:bg-[hsl(var(--cream))]/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
              >
                Join us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. EXPERIENCE PREVIEW ═══ */}
      <section className="fm-cream border-t border-border">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 pt-24 pb-12 md:pt-40 md:pb-20">
          <div className="text-center reveal">
            <p className="font-[var(--font-hand)] text-lg md:text-xl text-muted-foreground italic">
              Coming soon — Off the beaten track.
            </p>
            <h2 className="fm-section-heading text-foreground mt-4">
              This is what booking looks like
              <br />
              when impact is visible.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-lg mx-auto mt-5">
              Local Madeiran guide running electric-car tours to places most
              visitors never reach. 100% local operator, zero direct emissions,
              low-pressure destinations.
            </p>
            <div className="flex justify-center mt-6">
              <Link
                href="/discover"
                className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
              >
                Explore more
              </Link>
            </div>
          </div>

          <div className="relative mt-16 max-w-3xl mx-auto reveal">
            {/* Green Passport card — desktop */}
            <div className="hidden md:block absolute -left-24 top-8 w-52 bg-background rounded-2xl border border-border shadow-lg p-4 space-y-3 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-accent/15 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-accent" />
                </div>
                <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.2em]">
                  Green Passport
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ScoreRings fp={82} lc={88} rg={61} total={76} size={80} />
              </div>
              <div className="text-center">
                <span className="inline-block text-[10px] font-semibold px-2.5 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wide">
                  Regenerative Practice
                </span>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-2xl aspect-[3/4] max-h-[550px] mx-auto md:max-w-md">
              <Image
                src="/assets/madeira-coast-drone.jpg"
                alt="Aerial view of Madeira coastline"
                width={500}
                height={667}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Verified Metrics card — desktop */}
            <div className="hidden md:block absolute -right-20 bottom-12 w-56 bg-background rounded-2xl border border-border shadow-lg p-4 space-y-2.5 z-10">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Verified Metrics
              </p>
              <div className="space-y-2">
                {[
                  { label: "Direct emissions", value: "0 kg CO₂" },
                  { label: "Local employment", value: "100%" },
                  { label: "Direct booking rate", value: "92%" },
                  { label: "Regen programme", value: "Active" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {m.label}
                    </span>
                    <span className="text-[10px] font-bold text-foreground">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile-only cards */}
          <div className="grid grid-cols-2 gap-3 mt-6 md:hidden">
            <div className="bg-background rounded-2xl border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-[9px] font-bold text-foreground uppercase tracking-[0.15em]">
                  Green Passport
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ScoreRings fp={82} lc={88} rg={61} total={76} size={70} />
              </div>
              <div className="text-center">
                <span className="inline-block text-[10px] font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wide">
                  Regen Practice
                </span>
              </div>
            </div>
            <div className="bg-background rounded-2xl border border-border p-4 space-y-2.5">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                Verified Metrics
              </p>
              <div className="space-y-2">
                {[
                  { label: "Direct emissions", value: "0 kg CO₂" },
                  { label: "Local employment", value: "100%" },
                  { label: "Direct booking rate", value: "92%" },
                  { label: "Regen programme", value: "Active" },
                ].map((m) => (
                  <div
                    key={m.label}
                    className="flex justify-between items-center"
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {m.label}
                    </span>
                    <span className="text-[10px] font-bold text-foreground">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="font-[var(--font-hand)] text-base text-muted-foreground italic text-center mt-8">
            100% electric · 100% local
          </p>
        </div>
      </section>

      {/* ═══ 6. MEET THE SCORE ═══ */}
      <section className="fm-cream">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-24 md:py-40">
          <div className="text-center reveal">
            <p className="font-[var(--font-hand)] text-lg md:text-xl text-muted-foreground italic mb-4">
              Meet the Green Passport
            </p>
            <h2 className="fm-section-heading text-foreground">
              Your verified impact score — visible at the moment of booking.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-16">
            {[
              {
                title: "Operational Footprint",
                desc: "How light is your operation on the planet? Energy, water, waste and carbon — measured against real data, not estimates.",
              },
              {
                title: "Local Integration",
                desc: "How much of what you earn stays here? Local jobs, local suppliers, direct bookings.",
              },
              {
                title: "Regenerative Contribution",
                desc: "What do you actively give back? Your own programmes, community initiatives, or institutional partnerships — as long as it's real and traceable.",
              },
            ].map((pillar, i) => (
              <div
                key={i}
                className="bg-[hsl(var(--surface))] rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform duration-500 h-full reveal"
              >
                <div className="p-8 md:p-10 space-y-4">
                  <h3 className="fm-card-heading text-foreground">
                    {pillar.title}
                  </h3>
                  <p className="text-base text-foreground/70 leading-relaxed">
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-[hsl(var(--tan))] rounded-2xl p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center reveal">
            <div className="text-center md:text-left">
              <h3 className="fm-sub-heading text-foreground mt-3">
                Your Green Passport Score — verified and live at booking.
              </h3>
              <div className="mt-6">
                <Link
                  href="/signup"
                  className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
                >
                  Join us
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center">
              <ScoreRings fp={78} lc={71} rg={65} total={74} size={200} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7. HOW IT WORKS ═══ */}
      <section className="fm-cream">
        <div className="grid md:grid-cols-[1fr_1fr] min-h-[600px] md:min-h-[700px]">
          <div className="relative h-[350px] md:h-auto overflow-hidden">
            <Image
              src="/assets/verification-steps.jpg"
              alt="Coastal street scene in Madeira"
              fill
              className="object-cover"
            />
            <a
              href="https://www.instagram.com/julieta.artsphotos/"
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 left-4 z-10 bg-foreground/70 backdrop-blur-sm text-white/90 text-[10px] tracking-wide px-3 py-1.5 rounded-full hover:bg-foreground/90 transition-colors"
            >
              📷 @julieta.artsphotos
            </a>
          </div>

          <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 md:py-24">
            <div className="reveal">
              <p className="font-[var(--font-hand)] text-lg md:text-xl text-muted-foreground italic mb-3">
                Simple, transparent, verified
              </p>
              <h2 className="fm-section-heading text-foreground mb-12">
                Here&apos;s what happens when you apply
              </h2>
            </div>

            <div className="space-y-0">
              {[
                {
                  num: "01",
                  title: "Complete your assessment",
                  desc: "Answer questions about your real operations — energy, water, local employment, what you give back. No estimates unless that's all you have. No greenwashing.",
                },
                {
                  num: "02",
                  title: "We verify",
                  desc: "Our team reviews your data before anything goes live. Not automated. Not instant. Rigorous on purpose.",
                },
                {
                  num: "03",
                  title: "Your score goes live",
                  desc: "Visible to travelers at the moment they book. Everything you do right — finally visible to the people looking for exactly that.",
                },
              ].map((step, i) => (
                <div
                  key={i}
                  className="flex items-start gap-6 py-7 border-t border-border reveal"
                >
                  <span className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground leading-none min-w-[60px]">
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <span className="font-[var(--font-hand)] text-lg md:text-xl text-foreground block mb-1">
                      {step.title}
                    </span>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center reveal">
              <Link
                href="/signup"
                className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors"
              >
                Join us as operator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 8. DPI — Context matters ═══ */}
      <section className="bg-[hsl(var(--surface))]">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-24 md:py-40">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="reveal">
              <p className="font-[var(--font-hand)] text-lg md:text-xl text-foreground/60 italic mb-4">
                Every destination is different
              </p>
              <h2 className="fm-section-heading text-foreground">
                Context matters.
                <br />
                We measure that too.
              </h2>
              <p className="text-base md:text-lg text-foreground/70 leading-relaxed max-w-md mt-6">
                The Destination Pressure Index contextualises your score against
                where you operate — tourist intensity, ecological sensitivity,
                economic leakage.
                <br />
                <br />
                Operating responsibly here isn&apos;t abstract. It&apos;s
                urgent. And now it&apos;s measurable.
              </p>
              <Link
                href="/destinations"
                className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 px-7 h-12 text-sm font-semibold rounded-lg transition-colors mt-8"
              >
                Explore destinations
              </Link>
            </div>

            <div className="reveal">
              <div className="border border-[hsl(var(--tan))]/40 rounded-2xl p-8 md:p-10 bg-[hsl(var(--tan))]/10">
                <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/60 font-medium mb-4">
                  DPI · Madeira
                </p>
                <div className="flex items-end gap-2">
                  <span className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">
                    73
                  </span>
                  <span className="text-lg text-foreground/50 mb-2">/100</span>
                </div>
                <span className="inline-block text-[10px] font-semibold px-3 py-1 bg-destructive/20 text-destructive mt-4 rounded-full uppercase tracking-wider">
                  High Pressure
                </span>
                <div className="flex gap-8 mt-6 pt-6 border-t border-[hsl(var(--tan))]/15">
                  {[
                    { label: "Intensity", value: "100/100" },
                    { label: "Sensitivity", value: "72/100" },
                    { label: "Leakage", value: "51/100" },
                  ].map((m) => (
                    <div key={m.label}>
                      <span className="text-[10px] text-foreground/50 block uppercase tracking-wider">
                        {m.label}
                      </span>
                      <span className="text-sm font-mono text-foreground">
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. FORWARD COMMITMENT ═══ */}
      <section style={{ backgroundColor: "#F5F1EB" }}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 lg:px-12 py-10 md:py-14">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 md:gap-5">
            {/* Image card */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] md:aspect-auto md:h-full min-h-[240px] reveal">
              <Image
                src="/assets/madeira-cliff-coast.jpg"
                alt="Dramatic cliff coastline in Madeira"
                fill
                className="object-cover"
              />
              <a
                href="https://www.instagram.com/javierlomont/"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 left-4 z-10 bg-foreground/70 backdrop-blur-sm text-white/90 text-[10px] tracking-wide px-3 py-1.5 rounded-full hover:bg-foreground/90 transition-colors"
              >
                📷 @javierlomont
              </a>
            </div>

            {/* Text card */}
            <div className="bg-[hsl(var(--surface))] rounded-2xl p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[240px] text-center reveal">
              <div>
                <h2 className="fm-sub-heading text-foreground">
                  Low score today?
                  <br />
                  That&apos;s a starting point.
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-lg mt-4 mx-auto">
                  The Green Passport doesn&apos;t penalise — it maps where you
                  are. Sign a Forward Commitment, receive 15 baseline Pillar 3
                  points, and get matched with verified local institutions.
                </p>
              </div>
              <div className="mt-8 flex justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-semibold rounded-lg transition-colors"
                >
                  Join us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10. TRAVELER LOOKBOOK ═══ */}
      <section
        className="relative overflow-hidden py-24 md:py-36"
        style={{ backgroundColor: "#F5F1EB" }}
      >
        {/* Floating images — fixed positions, subtle rotations */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute left-[2%] md:left-[6%] top-[8%] w-[42vw] md:w-[22vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ transform: "rotate(-5deg)" }}
          >
            <Image
              src="/assets/lookbook-friends.jpg"
              alt="Travelers at the beach"
              width={400}
              height={300}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div
            className="absolute right-[2%] md:right-[5%] top-[5%] w-[36vw] md:w-[18vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ transform: "rotate(3deg)" }}
          >
            <Image
              src="/assets/lookbook-hiker.jpg"
              alt="Hiker on a trail"
              width={300}
              height={225}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div
            className="absolute left-[6%] md:left-[12%] bottom-[6%] w-[40vw] md:w-[20vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ transform: "rotate(2deg)" }}
          >
            <Image
              src="/assets/lookbook-market.jpg"
              alt="Local food experience"
              width={350}
              height={263}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div
            className="absolute right-[3%] md:right-[7%] bottom-[10%] w-[34vw] md:w-[16vw] rounded-2xl overflow-hidden shadow-2xl"
            style={{ transform: "rotate(-3deg)" }}
          >
            <Image
              src="/assets/lookbook-scan.jpg"
              alt="Scanning a QR code"
              width={280}
              height={210}
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>

        {/* Centered heading + CTA */}
        <div className="relative z-20 flex flex-col items-center justify-center min-h-[60vh] md:min-h-[70vh] px-6 text-center">
          <p className="font-[var(--font-hand)] text-base md:text-xl text-muted-foreground italic mb-4">
            For travelers
          </p>
          <h2 className="fm-hero-heading text-foreground mb-10">
            You care where you go.
            <br />
            Now you can prove it.
          </h2>
          <Link
            href="/traveler/waitlist"
            className="inline-flex items-center bg-foreground text-background hover:bg-foreground/90 h-12 px-8 text-sm font-semibold rounded-lg transition-colors"
          >
            Join as a traveler
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      {/* ═══ 11. FAQ ═══ */}
      <section className="fm-dark">
        <div className="max-w-[1400px] mx-auto px-6 md:px-16 lg:px-24 py-16 md:py-24 space-y-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="font-[var(--font-hand)] text-lg md:text-xl italic mb-3">
                FAQs
              </p>
              <h2 className="fm-section-heading">Common Questions</h2>
            </div>
            <a
              href="mailto:hello@theregenerativetourism.com"
              className="inline-flex items-center bg-[hsl(var(--cream))] text-foreground hover:bg-[hsl(var(--cream))]/90 h-12 px-7 text-sm font-semibold rounded-lg transition-colors shrink-0"
            >
              Contact us
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12">
            <div>
              {faqLeft.map((item, i) => (
                <details
                  key={i}
                  className="group border-t border-white/10"
                >
                  <summary className="flex items-center justify-between w-full py-5 text-sm font-semibold cursor-pointer list-none gap-4">
                    <span>{item.question}</span>
                    <span className="shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-45 text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-white/60 leading-relaxed pb-5">
                    {item.answer}
                  </p>
                </details>
              ))}
              <div className="border-t border-white/10" />
            </div>
            <div>
              {faqRight.map((item, i) => (
                <details
                  key={i}
                  className="group border-t border-white/10"
                >
                  <summary className="flex items-center justify-between w-full py-5 text-sm font-semibold cursor-pointer list-none gap-4">
                    <span>{item.question}</span>
                    <span className="shrink-0 text-white/50 transition-transform duration-200 group-open:rotate-45 text-lg leading-none">
                      +
                    </span>
                  </summary>
                  <p className="text-sm text-white/60 leading-relaxed pb-5">
                    {item.answer}
                  </p>
                </details>
              ))}
              <div className="border-t border-white/10" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
