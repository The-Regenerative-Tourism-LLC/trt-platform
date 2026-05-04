"use client";

import { useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LookbookCta } from "@/components/sections/LookbookCta";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

/* ─── Data ──────────────────────────────────────────────────── */

const ACADEMIC_REFS = [
  { author: "Bellato et al. (2022)",      note: "Resource flows → Economic circulation → Ecological contribution" },
  { author: "Mang & Reed (2012)",         note: "From extractive → sustainable → regenerative engagement" },
  { author: "Carol Sanford (2017)",       note: "Responsible → Embedded → Regenerative capacity-building" },
  { author: "GSTC Criteria (2024)",       note: "Environmental → Socioeconomic → Cultural stewardship" },
  { author: "Lavaredas et al. (2025)",    note: "SDG priorities validated through bibliometric analysis" },
  { author: "Butler (1980)",              note: "Tourism Area Life Cycle — the foundational model for destination carrying capacity and overtourism dynamics. Theoretical basis for the Destination Pressure Index." },
  { author: "Archer & Fletcher (1996)",   note: "Tourism multiplier effects — the standard framework for measuring how much tourism revenue stays in the local economy versus leaking out. Basis for the Economic Leakage indicator." },
  { author: "GRI Standards (2023)",       note: "Global Reporting Initiative — the most widely used framework for sustainability reporting. Aligns the GPS evidence tier system with established corporate disclosure practice." },
  { author: "Dickinson et al. (2010)",    note: "Slow travel and conscious tourism — academic framework for responsible traveler behavior and its measurable contribution to destination wellbeing." },
  { author: "Wahl (2016)",                note: "Designing Regenerative Cultures — philosophical and systems framework behind the concept of additionality: not just reducing harm, but actively creating new capacity." },
];

/* GPS band colors mapped to palette */
const GPS_BAND_COLORS = [
  "bg-dark",       /* Regenerative Leader — green-navy */
  "bg-success",    /* Regenerative Practice — green */
  "bg-accent",     /* Advancing — lime */
  "bg-muted",      /* Developing — pink */
  "bg-background border border-border", /* Not Yet Published — base */
];

type TabId = "gps" | "dpi" | "tip" | "evidence";

const CONTAINER = "container mx-auto max-w-page px-5 md:px-6";

/* ─── Scroll reveal ──────────────────────────────────────────── */

function useScrollReveal(activeTab: string) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    let observer: IntersectionObserver;
    const timer = setTimeout(() => {
      observer = new IntersectionObserver(
        (entries) => { entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }); },
        { threshold: 0.07, rootMargin: "0px 0px -40px 0px" }
      );
      wrapper.querySelectorAll(".reveal").forEach((el) => {
        el.classList.remove("visible");
        observer.observe(el);
      });
    }, 60);
    return () => { clearTimeout(timer); observer?.disconnect(); };
  }, [activeTab]);
  return wrapperRef;
}

/* ─── Component ─────────────────────────────────────────────── */

export function MethodologyClient() {
  const tM = useTranslations("public.methodology");
  const searchParams = useSearchParams();
  const router      = useRouter();
  const activeTab   = (searchParams.get("tab") as TabId) || "gps";
  const wrapperRef  = useScrollReveal(activeTab);
  const setTab = (tab: TabId) => router.push(`/methodology?tab=${tab}`);

  const TABS_T = [
    { id: "gps"      as TabId, label: tM("tabs.gps") },
    { id: "dpi"      as TabId, label: tM("tabs.dpi") },
    { id: "tip"      as TabId, label: tM("tabs.tip") },
    { id: "evidence" as TabId, label: tM("tabs.evidence") },
  ];

  const PILLARS_T = [
    {
      num: tM("pillars.p1.num"), title: tM("pillars.p1.title"),
      weight: tM("pillars.p1.weight"), question: tM("pillars.p1.question"),
      explanation: tM("pillars.p1.explanation"),
      indicators: [
        { code: tM("pillars.p1.indicators.energy.code"), weight: tM("pillars.p1.indicators.energy.weight"), desc: tM("pillars.p1.indicators.energy.desc") },
        { code: tM("pillars.p1.indicators.water.code"), weight: tM("pillars.p1.indicators.water.weight"), desc: tM("pillars.p1.indicators.water.desc") },
        { code: tM("pillars.p1.indicators.waste.code"), weight: tM("pillars.p1.indicators.waste.weight"), desc: tM("pillars.p1.indicators.waste.desc") },
        { code: tM("pillars.p1.indicators.carbon.code"), weight: tM("pillars.p1.indicators.carbon.weight"), desc: tM("pillars.p1.indicators.carbon.desc") },
        { code: tM("pillars.p1.indicators.site.code"), weight: tM("pillars.p1.indicators.site.weight"), desc: tM("pillars.p1.indicators.site.desc") },
      ],
    },
    {
      num: tM("pillars.p2.num"), title: tM("pillars.p2.title"),
      weight: tM("pillars.p2.weight"), question: tM("pillars.p2.question"),
      explanation: tM("pillars.p2.explanation"),
      indicators: [
        { code: tM("pillars.p2.indicators.employment.code"), weight: tM("pillars.p2.indicators.employment.weight"), desc: tM("pillars.p2.indicators.employment.desc") },
        { code: tM("pillars.p2.indicators.procurement.code"), weight: tM("pillars.p2.indicators.procurement.weight"), desc: tM("pillars.p2.indicators.procurement.desc") },
        { code: tM("pillars.p2.indicators.revenue.code"), weight: tM("pillars.p2.indicators.revenue.weight"), desc: tM("pillars.p2.indicators.revenue.desc") },
        { code: tM("pillars.p2.indicators.community.code"), weight: tM("pillars.p2.indicators.community.weight"), desc: tM("pillars.p2.indicators.community.desc") },
      ],
    },
    {
      num: tM("pillars.p3.num"), title: tM("pillars.p3.title"),
      weight: tM("pillars.p3.weight"), question: tM("pillars.p3.question"),
      explanation: tM("pillars.p3.explanation"),
      indicators: [
        { code: tM("pillars.p3.indicators.scope.code"), weight: tM("pillars.p3.indicators.scope.weight"), desc: tM("pillars.p3.indicators.scope.desc") },
        { code: tM("pillars.p3.indicators.traceability.code"), weight: tM("pillars.p3.indicators.traceability.weight"), desc: tM("pillars.p3.indicators.traceability.desc") },
        { code: tM("pillars.p3.indicators.additionality.code"), weight: tM("pillars.p3.indicators.additionality.weight"), desc: tM("pillars.p3.indicators.additionality.desc") },
        { code: tM("pillars.p3.indicators.continuity.code"), weight: tM("pillars.p3.indicators.continuity.weight"), desc: tM("pillars.p3.indicators.continuity.desc") },
      ],
    },
  ];

  const GPS_BANDS_T = [
    { band: tM("gpsBands.regenerativeLeader.band"), range: tM("gpsBands.regenerativeLeader.range") },
    { band: tM("gpsBands.regenerativePractice.band"), range: tM("gpsBands.regenerativePractice.range") },
    { band: tM("gpsBands.advancing.band"), range: tM("gpsBands.advancing.range") },
    { band: tM("gpsBands.developing.band"), range: tM("gpsBands.developing.range") },
    { band: tM("gpsBands.notYetPublished.band"), range: tM("gpsBands.notYetPublished.range") },
  ];

  const DPI_COMPONENTS_T = [
    { label: tM("dpiComponents.touristIntensity.label"), weight: tM("dpiComponents.touristIntensity.weight"), friendly: tM("dpiComponents.touristIntensity.friendly") },
    { label: tM("dpiComponents.ecologicalSensitivity.label"), weight: tM("dpiComponents.ecologicalSensitivity.weight"), friendly: tM("dpiComponents.ecologicalSensitivity.friendly") },
    { label: tM("dpiComponents.economicLeakage.label"), weight: tM("dpiComponents.economicLeakage.weight"), friendly: tM("dpiComponents.economicLeakage.friendly") },
    { label: tM("dpiComponents.regenPerformance.label"), weight: tM("dpiComponents.regenPerformance.weight"), friendly: tM("dpiComponents.regenPerformance.friendly") },
  ];

  const EVIDENCE_TIERS_T = [
    { num: tM("evidenceTiers.t1.num"), label: tM("evidenceTiers.t1.label"), desc: tM("evidenceTiers.t1.desc") },
    { num: tM("evidenceTiers.t2.num"), label: tM("evidenceTiers.t2.label"), desc: tM("evidenceTiers.t2.desc") },
    { num: tM("evidenceTiers.t3.num"), label: tM("evidenceTiers.t3.label"), desc: tM("evidenceTiers.t3.desc") },
    { num: tM("evidenceTiers.proxy.num"), label: tM("evidenceTiers.proxy.label"), desc: tM("evidenceTiers.proxy.desc") },
  ];

  return (
    <>
      {/* ══ Hero — image overlay, opacity allowed ═════════════ */}
      <section className="relative overflow-hidden">
        <Image src="/assets/methodology-hero.jpg" alt="Methodology" fill className="object-cover object-center" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/65 to-black/85" />
        <div className={`relative z-10 ${CONTAINER} py-20 md:py-32`}>
          <div className="grid md:grid-cols-[3fr_2fr] gap-10 md:gap-16 items-end">
            <div className="space-y-4">
              <p className="type-label text-pink italic">{tM("hero.eyebrow")}</p>
              <h1 className="type-h1 text-dark-foreground">
                {tM("hero.title").split("\n").map((line, i) => (
                  <span key={i}>{i > 0 && <br />}{line}</span>
                ))}
              </h1>
            </div>
            <div className="md:pb-2">
              <p className="type-m text-pink max-w-[300px]">
                {tM("hero.description")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══ Tab bar — solid background, no opacity ════════════ */}
      <div className="sticky top-14 z-30 bg-background border-b border-border">
        <div className={CONTAINER}>
          <div className="flex h-12 gap-0 overflow-x-auto scrollbar-none">
            {TABS_T.map((tabItem) => (
              <button
                key={tabItem.id}
                onClick={() => setTab(tabItem.id)}
                className={`relative px-4 md:px-6 h-full type-s font-medium transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tabItem.id ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tabItem.label}
                {activeTab === tabItem.id && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-foreground" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Content wrapper ═══════════════════════════════════ */}
      <div ref={wrapperRef}>

        {/* ── GPS tab ─────────────────────────────────────── */}
        {activeTab === "gps" && (
          <div className="tab-panel">
            <div className={`${CONTAINER} py-12 md:py-16`}>
              <div className="space-y-14">

                {/* Intro */}
                <div className="reveal space-y-3">
                  <p className="type-label text-muted-foreground italic">The Green Passport Score</p>
                  <h2 className="type-h2">
                    Every operator receives a single score from 0 to 100
                  </h2>
                  <p className="type-m text-muted-foreground">
                    Three pillars. Three questions. One number that travels with you at the moment of booking.
                  </p>
                </div>

                {/* Pillar cards */}
                <div className="space-y-5">
                  {PILLARS_T.map((p, pi) => (
                    <div
                      key={p.num}
                      className="reveal card overflow-hidden"
                      style={{ transitionDelay: `${pi * 80}ms` }}
                    >
                      <div className="px-6 md:px-8 pt-6 pb-5 space-y-3">
                        <div className="flex items-baseline justify-between">
                          <span className="type-label text-muted-foreground tabular-nums">
                            {p.num}
                          </span>
                          <span className="type-label text-muted-foreground tabular-nums">
                            {p.weight}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="type-h4">{p.title}</h3>
                          <p className="type-m text-muted-foreground italic">
                            &ldquo;{p.question}&rdquo;
                          </p>
                        </div>
                        <p className="type-m text-muted-foreground">{p.explanation}</p>
                      </div>
                      <div className="border-t border-border divide-y divide-border">
                        {p.indicators.map((ind) => (
                          <div key={ind.code} className="px-6 md:px-8 py-3.5 flex items-start gap-6">
                            <div className="flex-1 space-y-0.5">
                              <p className="type-s font-semibold">{ind.code}</p>
                              <p className="type-s text-muted-foreground">{ind.desc}</p>
                            </div>
                            <span className="type-label text-muted-foreground tabular-nums shrink-0 pt-0.5">
                              {ind.weight}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* How the weights work */}
                <div className="reveal card px-6 md:px-8 py-6 space-y-3">
                  <p className="type-s font-semibold">How the weights work</p>
                  <p className="type-m text-muted-foreground">
                    Operational Footprint accounts for 40 % because it covers the most measurable
                    universal impact of any tourism business. Local Integration and Regenerative
                    Contribution each account for 30 %. The final score is a weighted average across
                    all three pillars — one number that captures the full picture.
                  </p>
                </div>

                {/* Performance band */}
                <div className="reveal space-y-6 max-w-xl">
                  <div className="space-y-2">
                    <p className="type-label text-muted-foreground italic">Performance band</p>
                    <h3 className="type-h3">What the score means</h3>
                    <p className="type-m text-muted-foreground">
                      Every operator is placed into a performance band. These make it easy to
                      understand, at a glance, where an operator stands.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {GPS_BANDS_T.map((b, i) => (
                      <div
                        key={b.band}
                        className="flex items-center gap-3 card card-muted px-5 py-3.5"
                        style={{ transitionDelay: `${i * 55}ms` }}
                      >
                        <span className={`w-3 h-3 rounded-[3px] shrink-0 ${GPS_BAND_COLORS[i]}`} />
                        <p className="type-s font-semibold flex-1">
                          {b.band}
                          <span className="text-muted-foreground font-normal ml-2">— {b.range}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="card card-muted px-5 py-3.5 space-y-1">
                    <p className="type-s font-semibold">Forward Commitment</p>
                    <p className="type-m text-muted-foreground">
                      Operators who are not yet published can still use a Forward Commitment tool to
                      declare their improvement targets. The Progress Modifier can add up to 10
                      points — or subtract up to 8 if performance drops.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Direction of Performance — full-width dark section */}
            <section className="section section-dark">
              <div className={CONTAINER}>
                <div className="reveal space-y-5">
                  <p className="type-label text-pink italic">Direction of Performance</p>
                  <h3 className="type-h2 text-dark-foreground">
                    Do operators improve
                    <br />
                    over time?
                  </h3>
                  <p className="type-m text-pink">
                    After their first assessment, operators are reassessed periodically. We calculate
                    a Direction of Performance Score that rewards short-term improvements. The
                    Progress Modifier can add up to 10 points — or subtract up to 8 if performance
                    drops.
                  </p>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── DPI tab ─────────────────────────────────────── */}
        {activeTab === "dpi" && (
          <div className="tab-panel">
            <div className={`${CONTAINER} py-12 md:py-16`}>
              <div className="space-y-14">

                <div className="reveal space-y-4">
                  <p className="type-label text-muted-foreground italic">Destination Pressure Index</p>
                  <h2 className="type-h2">
                    Where you operate
                    <br />
                    changes everything
                  </h2>
                  <p className="type-m text-muted-foreground max-w-sm">
                    A hotel on a fragile island faces different pressures than one in a continental
                    city. The DPI measures how much pressure tourism places on a specific territory.
                    Unlike the GPS — a higher DPI means more pressure.
                  </p>
                </div>

                <div className="reveal space-y-5">
                  <p className="type-label text-muted-foreground italic">What we measure</p>
                  <h3 className="type-h3">
                    Four factors from verified public data
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    {DPI_COMPONENTS_T.map((c, i) => (
                      <div
                        key={c.label}
                        className="reveal card p-5 space-y-2"
                        style={{ transitionDelay: `${i * 70}ms` }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h4 className="type-s font-semibold">{c.label}</h4>
                          <span className="type-label text-muted-foreground tabular-nums shrink-0">{c.weight}</span>
                        </div>
                        <p className="type-m text-muted-foreground">{c.friendly}</p>
                      </div>
                    ))}
                  </div>

                  <div className="reveal card p-5 space-y-2">
                    <h4 className="type-s font-semibold">Pressure levels</h4>
                    <p className="type-m text-muted-foreground max-w-sm">
                      Destinations are grouped into three levels: Low (absorbs tourism well),
                      Moderate (strain is visible), and High (approaching or exceeding capacity).
                      This context helps travelers understand the stakes — and helps operators see how
                      their score fits the bigger picture.
                    </p>
                  </div>
                </div>

                <Link href="/destinations" className="reveal inline-flex items-center gap-1.5 type-m text-muted-foreground hover:text-foreground transition-colors">
                  See live destination data <ArrowRight className="w-3.5 h-3.5" />
                </Link>

              </div>
            </div>
          </div>
        )}

        {/* ── TIP tab ─────────────────────────────────────── */}
        {activeTab === "tip" && (
          <div className="tab-panel">
            <div className={`${CONTAINER} py-12 md:py-16`}>
              <div className="space-y-14">

                <div className="reveal space-y-4">
                  <p className="type-label text-muted-foreground italic">The travel record</p>
                  <h2 className="type-h2">
                    Every trip becomes part of your record
                  </h2>
                  <p className="type-m text-muted-foreground max-w-xs">
                    Every choice you make when you travel has an impact. For the first time, that
                    impact has a record.
                  </p>
                </div>

                <div className="reveal space-y-5">
                  <p className="type-label text-muted-foreground italic">How it works</p>
                  <h3 className="type-h3">Before and after your trip</h3>
                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    {[
                      { num: "01", title: "Before you book", desc: "When you book a verified operator, their GPS at that moment is recorded. Choosing higher-rated operators builds a higher contribution record — reflecting the quality of your travel decisions." },
                      { num: "02", title: "After your trip",  desc: "We show you what your stay contributed — energy consumed vs. regional average, money that stayed local, and any regenerative activities you participated in." },
                    ].map((card, i) => (
                      <div
                        key={card.title}
                        className="reveal card p-5 space-y-3"
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <span className="type-label text-muted-foreground tabular-nums">{card.num}</span>
                        <h3 className="type-s font-semibold">{card.title}</h3>
                        <p className="type-m text-muted-foreground">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="reveal space-y-2">
                    <p className="type-label text-muted-foreground italic">Actions, not likes</p>
                    <h3 className="type-h3">How your record grows</h3>
                  </div>
                  <div className="space-y-3">
                    {[
                      { action: "Book a verified stay or experience",       detail: "Every booking with a verified operator goes directly into your record. No extra steps — your choice already counts." },
                      { action: "Check in on site",                         detail: "Scan the QR code when you arrive. Confirms your visit and unlocks your post-trip impact report." },
                      { action: "Join a regenerative activity",             detail: "Nature walks, cultural workshops, local experiences — each one traceable to a real contribution." },
                      { action: "Submit a biodiversity sighting (optional)", detail: "If you join a citizen science mission — photograph and log a species, contributing real data to ongoing field research." },
                    ].map((a, i) => (
                      <div
                        key={a.action}
                        className="reveal card p-5 space-y-1.5"
                        style={{ transitionDelay: `${i * 60}ms` }}
                      >
                        <p className="type-s font-semibold">{a.action}</p>
                        <p className="type-m text-muted-foreground">{a.detail}</p>
                      </div>
                    ))}

                    <div className="reveal card p-5 space-y-1.5">
                      <p className="type-s font-semibold">Real impact, real record.</p>
                      <p className="type-m text-muted-foreground max-w-sm">
                        Every entry in your record traces back to a verified action with real-world
                        impact. What you actually did — not a reward for scrolling.
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ── Evidence tab ────────────────────────────────── */}
        {activeTab === "evidence" && (
          <div className="tab-panel">
            <div className={`${CONTAINER} py-12 md:py-16`}>
              <div className="space-y-14">

                <div className="reveal space-y-4">
                  <p className="type-label text-muted-foreground italic">Verification</p>
                  <h2 className="type-h2">
                    A score is only as trustworthy as the data behind it
                  </h2>
                  <p className="type-m text-muted-foreground max-w-sm">
                    Not all evidence is equal. We grade every piece by quality — and quality directly
                    affects your score. The more you prove, the more your score reflects.
                  </p>
                </div>

                <div className="reveal space-y-5">
                  <p className="type-label text-muted-foreground italic">Evidence quality</p>
                  <h3 className="type-h3">Four levels of evidence</h3>
                  <div className="grid sm:grid-cols-2 gap-3 mt-6">
                    {EVIDENCE_TIERS_T.map((tier, i) => (
                      <div
                        key={tier.label}
                        className="reveal card p-5 space-y-2"
                        style={{ transitionDelay: `${i * 70}ms` }}
                      >
                        <span className="type-label text-muted-foreground tabular-nums">{tier.num}</span>
                        <h4 className="type-s font-semibold">{tier.label}</h4>
                        <p className="type-m text-muted-foreground">{tier.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="reveal card p-5 space-y-2">
                    <p className="type-s font-semibold">Why does quality matter?</p>
                    <p className="type-m text-muted-foreground max-w-lg">
                      The more you prove, the more your score reflects. An operator who claims 80%
                      waste diversion but only has a self-declaration will score lower than one who
                      submits utility invoices. It&apos;s not a penalty — it&apos;s an incentive for transparency.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="reveal space-y-2">
                    <p className="type-label text-muted-foreground italic">Beyond documents</p>
                    <h3 className="type-h3">Multi-layer verification</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { title: "Operator-to-operator", desc: "Operators within the same territory can validate each other's claims — a ground-level check that no document audit can replace." },
                      { title: "Traveler field confirmations", desc: "Travelers can leave field confirmations — \"I saw solar panels on the roof\", \"staff were local.\" Aggregated signals create a grassroots validation layer." },
                    ].map((card, i) => (
                      <div
                        key={card.title}
                        className="reveal card p-5 space-y-2"
                        style={{ transitionDelay: `${i * 80}ms` }}
                      >
                        <p className="type-s font-semibold">{card.title}</p>
                        <p className="type-m text-muted-foreground">{card.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-5">
                  <div className="reveal space-y-2">
                    <p className="type-label text-muted-foreground italic">Scientific foundations</p>
                    <h3 className="type-h3">
                      Academic foundations, one convergent model
                    </h3>
                    <p className="type-m text-muted-foreground max-w-lg">
                      The GPS wasn&apos;t built from scratch. It converges five independent research
                      traditions that independently arrived at the same three-domain structure —
                      environmental, social, and regenerative.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {ACADEMIC_REFS.map((ref, i) => (
                      <div
                        key={ref.author}
                        className="reveal card px-5 py-3.5 flex items-start gap-4"
                        style={{ transitionDelay: `${i * 40}ms` }}
                      >
                        <p className="type-s font-semibold shrink-0 w-44">{ref.author}</p>
                        <p className="type-s text-muted-foreground">{ref.note}</p>
                      </div>
                    ))}
                  </div>

                  <div className="reveal card p-5 space-y-2">
                    <p className="type-s font-semibold">Open source by design</p>
                    <p className="type-m text-muted-foreground">
                      Measurement infrastructure for regenerative tourism should belong to everyone
                      — not locked behind a certification body.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <Link href="/science/gstc" className="flex items-center gap-2 type-m text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        GSTC Criteria Mapping
                      </Link>
                      <Link href="/science/sdgs" className="flex items-center gap-2 type-m text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                        UN SDGs Alignment
                      </Link>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* ══ LookbookCTA — outside all tabs ═══════════════ */}
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

      </div>
    </>
  );
}
