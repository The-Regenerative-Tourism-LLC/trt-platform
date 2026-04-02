"use client";

import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  CheckCircle2,
  Zap,
  Users,
  Leaf,
  BarChart3,
  Shield,
  Globe,
  Eye,
  TrendingUp,
} from "lucide-react";

const PILLARS = [
  {
    num: "P1",
    icon: Zap,
    title: "Operational Footprint",
    weight: "40%",
    question: "How lightly does this operator touch the land?",
    explanation:
      "We measure five things every tourism operation uses: energy, water, waste, carbon emissions, and land. For each one, we calculate how much the operator uses per guest per night — and compare it to clear benchmarks. The less you consume, the higher you score.",
    indicators: [
      { code: "Energy", weight: "30%", friendly: "How much electricity and fuel is used per guest per night — and how much comes from renewable sources like solar or wind." },
      { code: "Water", weight: "25%", friendly: "Litres of water consumed per guest per night. Bonus points for rainwater harvesting, greywater reuse, or wastewater treatment." },
      { code: "Waste", weight: "20%", friendly: "What percentage of waste is recycled, composted, or otherwise diverted from landfill." },
      { code: "Carbon", weight: "15%", friendly: "The carbon footprint per guest per night — covering the energy the operator directly uses on-site." },
      { code: "Site & Land", weight: "10%", friendly: "How well the property integrates with its natural surroundings — biodiversity, landscaping, and ecological sensitivity." },
    ],
  },
  {
    num: "P2",
    icon: Users,
    title: "Local Integration",
    weight: "30%",
    question: "Does the money stay in the community?",
    explanation:
      "Tourism can either extract wealth from a place or reinvest in it. This pillar measures how deeply an operator is embedded in the local economy — through hiring, sourcing, ownership, and community engagement. The more locally rooted, the higher the score.",
    indicators: [
      { code: "Employment", weight: "35%", friendly: "What percentage of staff are local residents, and whether they have fair wages, permanent contracts, and decent working conditions." },
      { code: "Procurement", weight: "30%", friendly: "How much of the food, supplies, and services are purchased from local businesses — not imported or sourced from global chains." },
      { code: "Revenue Retention", weight: "20%", friendly: "How much revenue stays local — through direct bookings (rather than large OTAs) and local ownership of the business." },
      { code: "Community", weight: "15%", friendly: "Whether the operator actively engages with the local community — through partnerships, open spaces, cultural activities, or shared resources." },
    ],
  },
  {
    num: "P3",
    icon: Leaf,
    title: "Regenerative Contribution",
    weight: "30%",
    question: "Is this operator actively improving the place it depends on?",
    explanation:
      "This is the hardest pillar — and the most important. It asks whether the operator goes beyond \"doing less harm\" and actually contributes to restoring ecological, cultural, or scientific capacity in its territory.",
    indicators: [
      { code: "Scope", weight: "40%", friendly: "How many areas of contribution the programme covers — ecological restoration, cultural preservation, scientific research, or community capacity." },
      { code: "Traceability", weight: "30%", friendly: "Can the contribution be traced to a specific outcome? A tree planted, a species documented, a research paper published — not just a donation." },
      { code: "Additionality", weight: "20%", friendly: "Does the programme create something genuinely new — or is it just relabelling existing activity?" },
      { code: "Continuity", weight: "10%", friendly: "Is this a year-round commitment, or a seasonal gesture? Consistent, ongoing programmes score higher than one-off events." },
    ],
  },
];

const GPS_BANDS = [
  { band: "Regenerative Leader", range: "85 and above", desc: "Exceptional across all three pillars. Active, verified contribution programme." },
  { band: "Regenerative Practice", range: "70 – 84", desc: "Strong performance with measurable regenerative activity in place." },
  { band: "Advancing", range: "55 – 69", desc: "Solid foundations. Actively improving but not yet fully regenerative." },
  { band: "Developing", range: "40 – 54", desc: "Early stage. Committed to improvement but data gaps or weak areas remain." },
  { band: "Not Yet Published", range: "Below 40", desc: "Insufficient data or performance to publish a public score." },
];

const DPI_COMPONENTS = [
  { icon: Globe, label: "Tourist Intensity", weight: "35%", friendly: "How many visitors arrive relative to the local population?" },
  { icon: Leaf, label: "Ecological Sensitivity", weight: "30%", friendly: "How ecologically fragile is this place? We look at protected areas and forest coverage." },
  { icon: TrendingUp, label: "Economic Leakage", weight: "20%", friendly: "How much of the tourism revenue actually stays in the destination?" },
  { icon: BarChart3, label: "Regenerative Performance", weight: "15%", friendly: "How well are the operators in this destination already performing?" },
];

const EVIDENCE_TIERS = [
  { tier: "Best", label: "Direct evidence", emoji: "📊", desc: "Meter readings, utility bills, invoices, payroll records — hard data from the source." },
  { tier: "Good", label: "Supporting documents", emoji: "📋", desc: "Supplier certificates, third-party reports, or audit documentation." },
  { tier: "Acceptable", label: "Self-reported", emoji: "✍️", desc: "Operator declarations — accepted but weighted lower, and flagged for future verification." },
  { tier: "Estimated", label: "Proxy calculation", emoji: "🧮", desc: "When data isn't available, we use validated estimation methods with a correction factor." },
];

type TabId = "gps" | "dpi" | "tip" | "evidence";

const TABS: { id: TabId; label: string }[] = [
  { id: "gps", label: "The Score" },
  { id: "dpi", label: "The Destination" },
  { id: "tip", label: "The Traveler" },
  { id: "evidence", label: "The Evidence" },
];

export function MethodologyClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = (searchParams.get("tab") as TabId) || "gps";

  const setTab = (t: TabId) => router.push(`/methodology?tab=${t}`);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden text-white">
        <Image
          src="/assets/methodology-hero.jpg"
          alt="Methodology"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/85" />
        <div className="relative z-10 container mx-auto max-w-7xl px-5 md:px-6 py-16 md:py-28">
          <div className="max-w-2xl space-y-5">
            <p className="editorial-label text-white/50">How it works</p>
            <h1 className="text-3xl md:text-[3.5rem] font-bold tracking-tight leading-[1.05]">
              How we measure
              <br />
              regenerative tourism
            </h1>
            <p className="text-base md:text-lg text-white/60 leading-relaxed max-w-lg">
              We built a system that answers three questions no booking platform
              can: How lightly does this operator touch the land? Does the money
              stay local? And is the place actually getting better because
              they&apos;re here?
            </p>
          </div>
        </div>
      </section>

      {/* Tab bar */}
      <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto max-w-7xl px-4 sm:px-5 md:px-6">
          <div className="flex h-12 gap-0 overflow-x-auto scrollbar-none">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`relative px-3 sm:px-4 md:px-6 h-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === t.id
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground/70"
                }`}
              >
                {t.label}
                {activeTab === t.id && (
                  <span className="absolute bottom-0 left-3 right-3 sm:left-4 sm:right-4 h-[2px] bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 sm:px-5 md:px-6 py-8 sm:py-10 md:py-16 space-y-8 sm:space-y-10">
        {/* ━━ GPS ━━ */}
        {activeTab === "gps" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                The Green Passport Score
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Every operator receives a single score from 0 to 100 — their{" "}
                <strong className="text-foreground">Green Passport Score</strong>
                . It&apos;s not a badge you buy. It&apos;s not a self-assessment.
                It&apos;s calculated from real data, verified through evidence,
                and published transparently.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The score is built from three pillars, each measuring a different
                dimension of what it means to operate regeneratively:
              </p>
            </div>

            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.num}
                  className="rounded-2xl border border-border overflow-hidden"
                >
                  <div className="p-5 md:p-7 space-y-3 bg-card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="w-5 h-5 text-accent" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-lg">{p.title}</h3>
                          <Badge
                            variant="secondary"
                            className="rounded-full text-[10px] font-mono"
                          >
                            {p.weight}
                          </Badge>
                        </div>
                        <p className="text-sm text-accent italic mt-1">
                          &ldquo;{p.question}&rdquo;
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {p.explanation}
                    </p>
                  </div>

                  <div className="border-t border-border bg-secondary/20 divide-y divide-border">
                    {p.indicators.map((ind) => (
                      <div key={ind.code} className="px-5 md:px-7 py-4 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold">
                            {ind.code}
                          </span>
                          <span className="text-[10px] text-muted-foreground/60 font-mono">
                            {ind.weight}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {ind.friendly}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Bands */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg">What the score means</h3>
              <div className="space-y-3">
                {GPS_BANDS.map((b, i) => (
                  <div
                    key={b.band}
                    className="flex items-start gap-3 rounded-xl bg-card border border-border p-4"
                  >
                    <span
                      className="w-4 h-4 rounded-sm shrink-0 mt-0.5"
                      style={{
                        backgroundColor: `hsl(${[90, 80, 60, 45, 40][i]} ${[40, 30, 20, 15, 8][i]}% ${[30, 38, 48, 55, 65][i]}%)`,
                      }}
                    />
                    <div>
                      <p className="text-sm font-semibold">
                        {b.band}{" "}
                        <span className="text-muted-foreground font-normal">
                          — {b.range}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {b.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">
                Do operators improve over time?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes — and we track it. After their first assessment, operators are
                reassessed periodically. We calculate a{" "}
                <strong className="text-foreground">
                  Direction of Performance Score
                </strong>{" "}
                that rewards improvement: the DPS can add up to 25 bonus points
                to the GPS — or subtract up to 10 if performance drops.
              </p>
            </div>
          </div>
        )}

        {/* ━━ DPI ━━ */}
        {activeTab === "dpi" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                The Destination Pressure Index
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                An operator&apos;s impact doesn&apos;t exist in a vacuum — it
                depends on <em>where</em> they operate. The{" "}
                <strong className="text-foreground">
                  Destination Pressure Index
                </strong>{" "}
                measures how much pressure tourism places on a specific
                territory.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Unlike the GPS (where higher is better), a higher DPI means{" "}
                <em>more pressure</em> — the destination needs more careful
                stewardship.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">What we measure</h3>
              {DPI_COMPONENTS.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.label}
                    className="rounded-xl border border-border p-5 space-y-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-accent" />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <h4 className="font-bold text-sm">{c.label}</h4>
                        <Badge
                          variant="secondary"
                          className="rounded-full text-[10px] font-mono"
                        >
                          {c.weight}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {c.friendly}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-accent/5 border border-accent/15 rounded-2xl p-5 md:p-7 space-y-3">
              <h3 className="font-bold">How pressure levels work</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We group destinations into three pressure levels:
                <strong className="text-foreground"> Low</strong> (absorbs
                tourism well),
                <strong className="text-foreground"> Moderate</strong> (some
                strain visible), and
                <strong className="text-foreground"> High</strong> (approaching
                or exceeding capacity).
              </p>
            </div>

            <Link
              href="/destinations"
              className="inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
            >
              See live destination data{" "}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* ━━ TIP ━━ */}
        {activeTab === "tip" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                The Traveler Impact Profile
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                Every trip you take becomes part of your story. The{" "}
                <strong className="text-foreground">
                  Traveler Impact Profile
                </strong>{" "}
                is a cumulative record of the choices you make — which operators
                you support, which activities you join, and what your visits
                actually contribute.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="rounded-xl border border-border p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-sm">
                  Before you book: your Choice Score
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When you book a verified operator, their GPS at that moment is
                  recorded. Choosing higher-rated operators builds a higher
                  cumulative Choice Score.
                </p>
              </div>
              <div className="rounded-xl border border-border p-5 space-y-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-bold text-sm">
                  After your trip: your Impact Report
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  After you travel, we show you what your stay actually
                  contributed — energy consumed vs. the regional average, money
                  that stayed local, and any regenerative activities you joined.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">
                How you earn impact points
              </h3>
              <div className="space-y-3">
                {[
                  { action: "Book a verified operator", detail: "Your Choice Score reflects the GPS of the operators you choose." },
                  { action: "Check in by scanning the operator's QR code", detail: "Confirms your visit and earns you base points." },
                  { action: "Join a regenerative activity", detail: "Guided nature walks, citizen science sessions, workshops — each has its own point value." },
                  { action: "Submit a biodiversity sighting", detail: "Photograph and log a species during a mission — contributing real data to conservation research." },
                ].map((a) => (
                  <div
                    key={a.action}
                    className="flex items-start gap-3 rounded-xl bg-card border border-border p-4"
                  >
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <span className="text-sm font-medium">{a.action}</span>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/15 rounded-2xl p-5 md:p-7 space-y-3">
              <h3 className="font-bold">This isn&apos;t gamification</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Points aren&apos;t a game — they&apos;re a measurement tool.
                Every point traces back to a verified action with real-world
                impact.
              </p>
            </div>
          </div>
        )}

        {/* ━━ Evidence ━━ */}
        {activeTab === "evidence" && (
          <div className="space-y-10">
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-bold">
                How we verify everything
              </h2>
              <p className="text-base text-muted-foreground leading-relaxed">
                A score is only as trustworthy as the data behind it. Every
                number in the Green Passport Score comes from evidence — and not
                all evidence is equal.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Evidence quality levels</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {EVIDENCE_TIERS.map((t) => (
                  <div
                    key={t.tier}
                    className="rounded-xl border border-border p-5 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{t.emoji}</span>
                      <h4 className="font-bold text-sm">{t.label}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {t.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/15 rounded-2xl p-5 md:p-7 space-y-3">
              <h3 className="font-bold">
                Why does evidence quality matter?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If an operator claims they recycle 80% of waste but can only
                provide a self-declaration, the score for that indicator is
                weighted lower. This isn&apos;t a penalty — it&apos;s an
                incentive to get better data.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-accent" />
                <h3 className="font-bold">Multi-layer verification</h3>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border p-4 space-y-1.5">
                  <h4 className="text-sm font-semibold">
                    Operator-to-operator verification
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Operators within the same territory validate each
                    other&apos;s claims — because your neighbours know whether
                    you actually source locally.
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 space-y-1.5">
                  <h4 className="text-sm font-semibold">
                    Traveler field confirmations
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Travelers who visit an operator can leave informal field
                    confirmations — aggregated signals create a powerful
                    grassroots validation layer.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/15 rounded-2xl p-5 md:p-7 space-y-3">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                <h3 className="font-bold">Open source by design</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Our scoring engine, methodology documentation, and rubric
                definitions are being developed with the intention of becoming
                fully open source. If you can&apos;t see how a score is
                calculated, you can&apos;t trust it.
              </p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
