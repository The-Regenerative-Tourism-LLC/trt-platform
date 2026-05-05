import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Leaf } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { LookbookCta } from "@/components/sections/LookbookCta";

export const metadata: Metadata = {
  title: "The Regenerative Tourism",
};

// ── Hero: placeholder activity cards ──────────────────────────────────────────

const ACCENT_BG: Record<string, string> = {
  lime: "bg-accent",
  blue: "bg-primary",
  green: "bg-success",
  pink: "bg-muted",
};

const PLACEHOLDER_ACTIVITIES = [
  {
    id: 1,
    title: "Levada da Caldeirão Verde",
    location: "Santana, Madeira",
    gps: 82,
    image: "/assets/editorial-levada-trail.jpg",
    accent: "lime",
  },
  {
    id: 2,
    title: "Madeira Embroidery Workshop",
    location: "Funchal, Madeira",
    gps: 74,
    image: "/assets/editorial-craft-workshop.jpg",
    accent: "blue",
  },
  {
    id: 3,
    title: "Story of Passion Fruit in Madeira",
    location: "Madeira, Portugal",
    gps: 68,
    image: "/assets/editorial-local-hands.jpg",
    accent: "green",
  },
  {
    id: 4,
    title: "Eco-Friendly Private Tours",
    location: "Madeira, Portugal",
    gps: 79,
    image: "/assets/editorial-nature-tour.jpg",
    accent: "blue",
  },
  {
    id: 5,
    title: "Porto Santo Eco Hostel",
    location: "Porto Santo",
    gps: 61,
    image: "/assets/stay-pontadosol-madeira.jpg",
    accent: "pink",
    comingSoon: true,
  },
  {
    id: 6,
    title: "Quinta Rural Stay",
    location: "Madeira, Portugal",
    gps: 85,
    image: "/assets/stay-rural-madeira.jpg",
    accent: "lime",
  },
  {
    id: 7,
    title: "Marine Research Expedition",
    location: "Madeira, Portugal",
    gps: 91,
    image: "/assets/editorial-marine-research.jpg",
    accent: "blue",
  },
];

function ActivityCard({
  title,
  location,
  gps,
  image,
  accent,
  comingSoon,
}: {
  title: string;
  location: string;
  gps: number;
  image: string;
  accent: string;
  comingSoon?: boolean;
}) {
  return (
    <div className="relative shrink-0 w-[200px] aspect-[3/4] overflow-hidden rounded-lg">
      <Image src={image} alt={title} fill className="object-cover" sizes="200px" />

      {/* Colored top accent */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${ACCENT_BG[accent] ?? "bg-primary"}`} />

      {/* GPS score badge */}
      <span className="badge badge-lime absolute top-3 left-3">{gps}</span>

      {/* "Soon" badge */}
      {comingSoon && (
        <span className="badge badge-dark absolute top-3 right-3">Soon</span>
      )}

      {/* Title gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10">
        <p className="type-xs font-semibold text-dark-foreground leading-snug">{title}</p>
        <p className="type-xs text-dark-foreground mt-0.5">{location}</p>
      </div>
    </div>
  );
}

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
      <circle cx={cx} cy={cy} r={r1} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r2} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r3} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r1} fill="none" style={{ stroke: "var(--brand-green)" }} strokeWidth={sw} strokeDasharray={dash(r1, fp)} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r2} fill="none" style={{ stroke: "var(--brand-blue)" }} strokeWidth={sw} strokeDasharray={dash(r2, lc)} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r3} fill="none" style={{ stroke: "var(--brand-lime)" }} strokeWidth={sw} strokeDasharray={dash(r3, rg)} strokeLinecap="round" />
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
      "That's a starting point. We provide Insights and guidance to help improve over time. The goal is progress — not perfection.",
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
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ═══ 1. HERO ═══ */}
      <section className="pb-0 bg-background">
        {/* Heading + description + CTA */}
        <div className="section flex flex-col w-full gap-[64px]">
          <div className="flex justify-between">
            <div><p className="type-xl text-blue-50-transparency">[ 32.7607° N, 16.9595° W ]</p></div>
            <div><p className="type-xl text-blue-50-transparency">[ 32.7607° N, 16.9595° W ]</p></div>
          </div>
        <div className="container-section">
          <div className="max-w-[950px] m-auto flex flex-col items-center justify-center gap-[20px]">
            <div className="flex flex-col justify-center items-center gap-[16px]">
              <p className="type-m text-blue">The Generant Mark — Footprint · Roots · Regeneration</p>
             <h1 className="type-h1 text-center">
            Tourism leaves a mark.{" "}
            <br />
            We help you make it a good one.
          </h1>
            </div>
          <p className="type-m text-center max-w-[552px]">
            A score from 0 to 100 — independently assessed across Footprint,
            Roots, and Regeneration. For travelers who choose by what&apos;s
            next. For operators who do the work.
          </p>
            <Link href="/signup" className="btn btn-primary">
              Join as operator
            </Link>
          </div>
         
        </div>
        </div>

        {/* Horizontal activity card strip */}
        <div className="">
        <div className="overflow-x-auto scrollbar-none">
          <div
            className="flex gap-3 pb-4"
          >
            {PLACEHOLDER_ACTIVITIES.map((a) => (
              <ActivityCard key={a.id} {...a} />
            ))}
          </div>
        </div>
        </div>

        {/* Featured in */}
        <div className="section">
        <div className="container-section border-t border-border mt-8 pt-6 pb-[var(--section-y)]">
          <div className="flex items-center gap-8 flex-wrap">
            <span className="type-label text-black shrink-0">
              Featured in
            </span>
            <a
              href="https://retreat.startupmadeira.eu/finalists-2026/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 shrink-0"
            >
              <Image
                src="/assets/madeira-startup-retreat.png"
                alt="Madeira Startup Retreat"
                width={100}
                height={32}
                className="h-8 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
              />
              <span className="type-label text-black">Cohort 2026</span>
            </a>
            <div className="w-px h-4 shrink-0 bg-border" />
            <a
              href="https://www.clarin.com/viajes/viajar-cuidar-destino-innovador-proyecto-jovenes-argentinos-brasileno-llego-europa_0_fexstVhMcf.html"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Image
                src="/assets/clarin-logo.svg"
                alt="Clarín"
                width={70}
                height={28}
                className="h-7 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
              />
            </a>
            <div className="w-px h-4 shrink-0 bg-border" />
            <a
              href="https://www.canal12misiones.com/noticias-de-misiones/turismo/misioneros-finalistas-concurso-portugal"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Image
                src="/assets/canal12-logo.png"
                alt="Canal 12 Misiones"
                width={100}
                height={32}
                className="h-8 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
              />
            </a>
            <div className="w-px h-4 shrink-0 bg-border" />
            <a
              href="https://www.instagram.com/reel/DUGuXlpjtDp/"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Image
                src="/assets/silicon-misiones-logo.png"
                alt="Silicon Misiones"
                width={80}
                height={28}
                className="h-7 w-auto object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all"
              />
            </a>
          </div>
        </div>
        </div>
      </section>

      {/* ═══ 3. MANIFESTO ═══ */}
      <section className="section">
        <div className="container-section">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 items-end">
            <div className="reveal">
              <h2 className="type-h2 text-foreground">
                There will be no tourism industry on a dead planet.
                <span className="block mt-1 text-black">
                  We keep talking about sustainable travel while the places we
                  love quietly disappear. The problem isn&apos;t that travelers
                  don&apos;t care. The problem is that caring has never been
                  enough.
                </span>
              </h2>
              <p className="type-m text-black mt-10">
                You can want to do the right thing and still have no way to know
                if you are. You can be an operator doing everything right — and
                still lose to someone who isn&apos;t. Because the system
                wasn&apos;t built to tell the difference. We&apos;re building
                that system.
              </p>
              <div className="mt-8">
                <Link href="/signup" className="btn btn-dark">
                  Join us
                </Link>
              </div>
            </div>

            <div className="space-y-4 reveal">
              <div className="overflow-hidden aspect-[3/4] max-h-[480px]">
                <Image
                  src="/assets/madeira-nature.jpg"
                  alt="Mountain stream and wildflowers in Madeira"
                  width={600}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="type-s text-black italic text-right">
                2026 — We start here in Madeira
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 4. FOUNDING COHORT ═══ */}
      <section className="section section-dark relative overflow-hidden">
        <Image
          src="/assets/madeira-map.svg"
          alt=""
          fill
          className="object-contain pointer-events-none"
          style={{ objectPosition: "center 60%", opacity: 0.15 }}
          aria-hidden="true"
        />
        <div className="relative container-section text-center">
          <div className="reveal">
            <p className="type-label text-pink italic">
              Founding cohort · Madeira 2026
            </p>
            <h2 className="type-h1 text-dark-foreground mt-4 max-w-text mx-auto">
              30 operators.
              <br />
              One island.
              <br />
              The first regenerative map
              <br />
              in tourism history.
            </h2>
            <div className="mt-8">
              <Link href="/signup" className="btn btn-primary">
                Join us
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 5. EXPERIENCE PREVIEW ═══ */}
      <section className="section border-t border-border">
        <div className="container-section">
          <div className="text-center reveal">
            <p className="type-label text-black italic">
              Coming soon — Off the beaten track.
            </p>
            <h2 className="type-h2 text-foreground mt-4">
              This is what booking looks like
              <br />
              when impact is visible.
            </h2>
            <p className="type-m text-black max-w-text mx-auto mt-5">
              Local Madeiran guide running electric-car tours to places most
              visitors never reach. 100% local operator, zero direct emissions,
              low-pressure destinations.
            </p>
            <div className="flex justify-center mt-6">
              <Link href="/discover" className="btn btn-dark">
                Explore more
              </Link>
            </div>
          </div>

          <div className="relative mt-16 max-w-[768px] mx-auto reveal">
            {/* Green Passport card — desktop */}
            <div className="hidden md:block absolute -left-24 top-8 w-52 card card-sm space-y-3 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-accent-foreground" />
                </div>
                <span className="type-label text-foreground">
                  Green Passport
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ScoreRings fp={82} lc={88} rg={61} total={76} size={80} />
              </div>
              <div className="text-center">
                <span className="badge badge-lime">Regenerative Practice</span>
              </div>
            </div>

            <div className="overflow-hidden aspect-[3/4] max-h-[550px] mx-auto md:max-w-md">
              <Image
                src="/assets/madeira-coast-drone.jpg"
                alt="Aerial view of Madeira coastline"
                width={500}
                height={667}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Verified Metrics card — desktop */}
            <div className="hidden md:block absolute -right-20 bottom-12 w-56 card card-sm space-y-4 z-10">
              <p className="type-label text-black">
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
                    <span className="type-xs text-black">
                      {m.label}
                    </span>
                    <span className="type-xs font-bold text-foreground">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile-only cards */}
          <div className="grid grid-cols-2 gap-3 mt-6 md:hidden">
            <div className="card card-sm space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <Leaf className="w-3.5 h-3.5 text-accent-foreground" />
                </div>
                <span className="type-label text-foreground">
                  Green Passport
                </span>
              </div>
              <div className="flex items-center justify-center">
                <ScoreRings fp={82} lc={88} rg={61} total={76} size={70} />
              </div>
              <div className="text-center">
                <span className="badge badge-lime">Regen Practice</span>
              </div>
            </div>
            <div className="card card-sm space-y-4">
              <p className="type-label text-black">
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
                    <span className="type-xs text-black">
                      {m.label}
                    </span>
                    <span className="type-xs font-bold text-foreground">
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p className="type-s text-black italic text-center mt-8">
            100% electric · 100% local
          </p>
        </div>
      </section>

      {/* ═══ 6. MEET THE SCORE ═══ */}
      <section className="section">
        <div className="container-section">
          <div className="text-center reveal">
            <p className="type-label text-black italic mb-4">
              Meet the Green Passport
            </p>
            <h2 className="type-h2 text-foreground">
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
                className="card card-muted card-interactive space-y-4 h-full reveal"
              >
                <h3 className="type-h5 text-foreground">{pillar.title}</h3>
                <p className="type-m text-black">{pillar.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 card card-dark grid md:grid-cols-2 gap-8 items-center reveal">
            <div className="text-center md:text-left">
              <h3 className="type-h4 text-dark-foreground mt-3">
                Your Green Passport Score — verified and live at booking.
              </h3>
              <div className="mt-6">
                <Link href="/signup" className="btn btn-primary">
                  Join us
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center text-dark-foreground">
              <ScoreRings fp={78} lc={71} rg={65} total={74} size={200} />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7. HOW IT WORKS ═══ */}
      <section>
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
              className="absolute bottom-4 left-4 z-10 bg-dark text-dark-foreground type-xs px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
            >
              📷 @julieta.artsphotos
            </a>
          </div>

          <div className="flex flex-col justify-center px-8 md:px-16 lg:px-24 py-16 md:py-24">
            <div className="reveal">
              <p className="type-label text-black italic mb-3">
                Simple, transparent, verified
              </p>
              <h2 className="type-h2 text-foreground mb-12">
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
                  <span className="type-h2 text-foreground leading-none min-w-[60px]">
                    {step.num}
                  </span>
                  <div className="flex-1">
                    <span className="type-h5 text-foreground block mb-1">
                      {step.title}
                    </span>
                    <p className="type-m text-black">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center reveal">
              <Link href="/signup" className="btn btn-dark">
                Join us as operator
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 8. DPI — Context matters ═══ */}
      <section className="section section-muted">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="reveal">
              <p className="type-label text-black italic mb-4">
                Every destination is different
              </p>
              <h2 className="type-h2 text-foreground">
                Context matters.
                <br />
                We measure that too.
              </h2>
              <p className="type-m text-black mt-6">
                The Destination Pressure Index contextualises your score against
                where you operate — tourist intensity, ecological sensitivity,
                economic leakage.
                <br />
                <br />
                Operating responsibly here isn&apos;t abstract. It&apos;s
                urgent. And now it&apos;s measurable.
              </p>
              <Link href="/destinations" className="btn btn-dark mt-8">
                Explore destinations
              </Link>
            </div>

            <div className="reveal">
              <div className="card">
                <p className="type-label text-black mb-4">
                  DPI · Madeira
                </p>
                <div className="flex items-end gap-2">
                  <span className="type-h1 text-foreground tabular-nums">73</span>
                  <span className="type-m text-black mb-2">/100</span>
                </div>
                <span className="badge badge-pink mt-4">High Pressure</span>
                <div className="flex gap-8 mt-6 pt-6 border-t border-border">
                  {[
                    { label: "Intensity", value: "100/100" },
                    { label: "Sensitivity", value: "72/100" },
                    { label: "Leakage", value: "51/100" },
                  ].map((m) => (
                    <div key={m.label}>
                      <span className="type-label text-black block">
                        {m.label}
                      </span>
                      <span className="type-s font-semibold tabular-nums text-foreground">
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
      <section className="section">
        <div className="container-section">
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-4 md:gap-5">
            <div className="relative overflow-hidden aspect-[4/3] md:aspect-auto md:h-full min-h-[240px] reveal">
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
                className="absolute bottom-4 left-4 z-10 bg-dark text-dark-foreground type-xs px-3 py-1.5 hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                📷 @javierlomont
              </a>
            </div>

            <div className="card card-muted card-lg flex flex-col justify-between min-h-[240px] text-center reveal">
              <div>
                <h2 className="type-h2 text-foreground">
                  Low score today?
                  <br />
                  That&apos;s a starting point.
                </h2>
                <p className="type-m text-black max-w-text mx-auto mt-4">
                  The Green Passport doesn&apos;t penalise — it maps where you
                  are. Sign a Forward Commitment, receive 15 baseline Pillar 3
                  points, and get matched with verified local institutions.
                </p>
              </div>
              <div className="mt-8 flex justify-center">
                <Link href="/signup" className="btn btn-dark">
                  Join us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 10. TRAVELER LOOKBOOK ═══ */}
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

      {/* ═══ 11. FAQ ═══ */}
      <section className="section section-dark">
        <div className="container-section space-y-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="type-label text-pink italic mb-3">FAQs</p>
              <h2 className="type-h2 text-dark-foreground">Common Questions</h2>
            </div>
            <a
              href="mailto:hello@theregenerativetourism.com"
              className="btn btn-primary shrink-0"
            >
              Contact us
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12">
            <div>
              {faqLeft.map((item, i) => (
                <details key={i} className="group border-t border-pink">
                  <summary className="flex items-center justify-between w-full py-5 type-s font-semibold cursor-pointer list-none gap-4 text-dark-foreground">
                    <span>{item.question}</span>
                    <span className="shrink-0 type-xl text-pink transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="type-s text-pink pb-5">{item.answer}</p>
                </details>
              ))}
              <div className="border-t border-pink" />
            </div>
            <div>
              {faqRight.map((item, i) => (
                <details key={i} className="group border-t border-pink">
                  <summary className="flex items-center justify-between w-full py-5 type-s font-semibold cursor-pointer list-none gap-4 text-dark-foreground">
                    <span>{item.question}</span>
                    <span className="shrink-0 type-xl text-pink transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="type-s text-pink pb-5">{item.answer}</p>
                </details>
              ))}
              <div className="border-t border-pink" />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
