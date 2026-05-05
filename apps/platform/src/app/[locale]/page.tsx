import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Leaf, Check } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "The Regenerative Tourism",
};

const ACCENT_BG: Record<string, string> = {
  lime: "bg-accent",
  blue: "bg-primary",
  green: "bg-success",
  pink: "bg-muted",
};

const PLACEHOLDER_ACTIVITIES = [
  { id: 1, title: "Levada da Caldeirão Verde",     location: "Santana, Madeira",   gps: 82, image: "/assets/editorial-levada-trail.jpg",    accent: "lime",  type: "experience" as const },
  { id: 2, title: "Madeira Embroidery Workshop",   location: "Funchal, Madeira",   gps: 74, image: "/assets/editorial-craft-workshop.jpg",  accent: "blue",  type: "experience" as const },
  { id: 3, title: "Story of Passion Fruit in Madeira", location: "Madeira, Portugal", gps: 68, image: "/assets/editorial-local-hands.jpg", accent: "green", type: "experience" as const },
  { id: 4, title: "Eco-Friendly Private Tours",    location: "Madeira, Portugal",  gps: 79, image: "/assets/editorial-nature-tour.jpg",    accent: "blue",  type: "experience" as const },
  { id: 5, title: "Porto Santo Eco Hostel",        location: "Porto Santo",        gps: 61, image: "/assets/stay-pontadosol-madeira.jpg",  accent: "pink",  type: "stay"       as const, comingSoon: true },
  { id: 6, title: "Quinta Rural Stay",             location: "Madeira, Portugal",  gps: 85, image: "/assets/stay-rural-madeira.jpg",       accent: "lime",  type: "stay"       as const },
  { id: 7, title: "Marine Research Expedition",    location: "Madeira, Portugal",  gps: 91, image: "/assets/editorial-marine-research.jpg",accent: "blue",  type: "experience" as const },
];

function ActivityCard({ title, image, comingSoon, type, typeLabel }: {
  title: string; location: string; gps: number; image: string; accent: string;
  comingSoon?: boolean; type: "experience" | "stay"; typeLabel: string;
}) {
  return (
    <div className="relative shrink-0 w-[288px] aspect-[3/4] overflow-hidden  flex flex-col justify-between">
  <Image
    src={image}
    alt={title}
    fill
    className="object-cover z-0"
    sizes="288px"
  />
<div className="relative p-[16px] z-10 flex flex-col justify-between h-full  bg-black/20">
<p className="  type-h5 text-base">
    {title}
  </p>
  <div>
    <span
      className={`badge type-badge mt-2 ${
        type === "experience" ? "badge-lime" : "badge-green"
      }`}
    >
      {typeLabel}
    </span>
  </div>
</div>
  

  {/* {comingSoon && <span className="relative z-10 badge badge-grey">Soon</span>} */}

  
</div>
  );
}

function ScoreRings({ fp, lc, rg, total, size = 120 }: {
  fp: number; lc: number; rg: number; total: number; size?: number;
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
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={cx} cy={cy} r={r1} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r2} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r3} fill="none" style={{ stroke: "var(--brand-pink)" }} strokeWidth={sw} />
      <circle cx={cx} cy={cy} r={r1} fill="none" style={{ stroke: "var(--brand-green)" }} strokeWidth={sw} strokeDasharray={dash(r1, fp)} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r2} fill="none" style={{ stroke: "var(--brand-blue)" }} strokeWidth={sw} strokeDasharray={dash(r2, lc)} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r3} fill="none" style={{ stroke: "var(--brand-lime)" }} strokeWidth={sw} strokeDasharray={dash(r3, rg)} strokeLinecap="round" />
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" transform={`rotate(90,${cx},${cy})`} fontSize={size * 0.22} fontWeight="700" fill="currentColor">
        {total}
      </text>
    </svg>
  );
}

export default async function LandingPage() {
  const t = await getTranslations("home");
  const tCommon = await getTranslations("common");
  const tPricing = await getTranslations("public.pricing");

  const activityLabels = {
    experience: t("activityType.experience"),
    stay: t("activityType.stay"),
  };

  const faqItems = [
    { question: t("faq.items.whatIs.question"), answer: t("faq.items.whatIs.answer") },
    { question: t("faq.items.greenPassport.question"), answer: t("faq.items.greenPassport.answer") },
    { question: t("faq.items.different.question"), answer: t("faq.items.different.answer") },
    { question: t("faq.items.verification.question"), answer: t("faq.items.verification.answer") },
    { question: t("faq.items.lowScore.question"), answer: t("faq.items.lowScore.answer") },
    { question: t("faq.items.join.question"), answer: t("faq.items.join.answer") },
  ];

  const mid = Math.ceil(faqItems.length / 2);
  const faqLeft = faqItems.slice(0, mid);
  const faqRight = faqItems.slice(mid);

  const pillars = [
    { title: t("meetTheScore.pillars.footprint.title"), desc: t("meetTheScore.pillars.footprint.desc") },
    { title: t("meetTheScore.pillars.local.title"), desc: t("meetTheScore.pillars.local.desc") },
    { title: t("meetTheScore.pillars.regen.title"), desc: t("meetTheScore.pillars.regen.desc") },
  ];

  const steps = [
    { num: t("howItWorks.steps.assessment.num"), title: t("howItWorks.steps.assessment.title"), desc: t("howItWorks.steps.assessment.desc") },
    { num: t("howItWorks.steps.verify.num"), title: t("howItWorks.steps.verify.title"), desc: t("howItWorks.steps.verify.desc") },
    { num: t("howItWorks.steps.live.num"), title: t("howItWorks.steps.live.title"), desc: t("howItWorks.steps.live.desc") },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />

      {/* ═══ 1. HERO ═══ */}
      <section className="pb-0 bg-background">
        <div className="section flex flex-col w-full gap-[64px]">
          <div className="container-section w-full flex justify-between">
            <div><p className="type-xl text-blue-50-transparency">[ 32.7607° N, 16.9595° W ]</p></div>
            <div><p className="type-xl text-blue-50-transparency">[ 32.7607° N, 16.9595° W ]</p></div>
          </div>
          <div className="container-section">
            <div className="max-w-[950px] m-auto flex flex-col items-center justify-center gap-[20px]">
              <div className="flex flex-col justify-center items-center gap-[16px]">
                <p className="type-m text-blue">{t("hero.mark")}</p>
                <h1 className="type-h1 text-center whitespace-pre-line">
                  {t("hero.heading")}
                </h1>
              </div>
              <p className="type-m text-center max-w-[552px]">
                {t("hero.bodyShort")}
              </p>
              <Link href="/signup" className="btn btn-primary">
                {tCommon("joinAsOperator")}
              </Link>
            </div>
          </div>
        </div>

        {/* Activity cards strip */}
        <div className="">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex gap-3 pb-4">
              {PLACEHOLDER_ACTIVITIES.map((a) => (
                <ActivityCard key={a.id} {...a} typeLabel={activityLabels[a.type]} />
              ))}
            </div>
          </div>
        </div>

        {/* Featured in */}
        <div className="section">
          <div className="container-section pt-6 pb-6">
            <div className="flex items-center justify-center gap-10 flex-wrap">
              <span className="type-label text-black shrink-0">Featured in</span>
              {/* Área alvo: 3600px² — cada logo redimensionado proporcionalmente */}
              <a href="https://retreat.startupmadeira.eu/finalists-2026/" target="_blank" rel="noopener noreferrer" className="shrink-0 flex items-center gap-2">
                <Image src="/assets/madeira-startup-retreat.png" alt="Madeira Startup Retreat" width={106} height={34} className="object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
                <span className="type-label text-black">Cohort 2026</span>
              </a>
              <a href="https://www.clarin.com/viajes/viajar-cuidar-destino-innovador-proyecto-jovenes-argentinos-brasileno-llego-europa_0_fexstVhMcf.html" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Image src="/assets/clarin-logo.svg" alt="Clarín" width={95} height={38} className="object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
              </a>
              <a href="https://www.canal12misiones.com/noticias-de-misiones/turismo/misioneros-finalistas-concurso-portugal" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Image src="/assets/canal12-logo.png" alt="Canal 12 Misiones" width={106} height={34} className="object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
              </a>
              <a href="https://www.instagram.com/reel/DUGuXlpjtDp/" target="_blank" rel="noopener noreferrer" className="shrink-0">
                <Image src="/assets/silicon-misiones-logo.png" alt="Silicon Misiones" width={101} height={36} className="object-contain grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 2. WHAT IS GENERANT? ═══ */}
      <section className="section section-dark">
        <div className="container-section">
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-10 md:gap-16 items-center">
            <div className="reveal">
              <p className="type-label text-pink italic mb-4">{t("whatIsGenerant.label")}</p>
              <h2 className="type-h2 text-dark-foreground mb-6">{t("whatIsGenerant.heading")}</h2>
              <p className="type-m text-dark-foreground/70 mb-8">{t("whatIsGenerant.body")}</p>
              <ul className="space-y-3 mb-10">
                {([
                  t("whatIsGenerant.item1"),
                  t("whatIsGenerant.item2"),
                  t("whatIsGenerant.item3"),
                  t("whatIsGenerant.item4"),
                ] as string[]).map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-accent flex items-center justify-center mt-0.5">
                      <Check className="w-3 h-3 text-accent-foreground" />
                    </span>
                    <span className="type-s text-dark-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary">
                {t("whatIsGenerant.cta")}
              </Link>
            </div>

            <div className="reveal">
              <div className="overflow-hidden aspect-[3/4] max-h-[480px]">
                <Image
                  src="/assets/madeira-nature.jpg"
                  alt="Mountain stream and wildflowers in Madeira"
                  width={600}
                  height={800}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="type-s text-dark-foreground/50 italic text-right mt-3">
                {t("manifesto.imageCaption")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 3. BUILT ON WHAT'S REAL ═══ */}
      <section className="section border-t border-border">
        <div className="container-section">
          <div className="reveal mb-12">
            <h2 className="type-h2 text-foreground">{t("builtOnReal.heading")}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {pillars.map((pillar, i) => (
              <div key={i} className="card card-muted card-interactive space-y-4 h-full reveal">
                <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="type-h5 text-foreground">{pillar.title}</h3>
                <p className="type-m text-black">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 4. THE GENERANT MARK ═══ */}
      <section className="section border-t border-border">
        <div className="container-section">
          <div className="text-center reveal">
            <p className="type-label text-black italic mb-6">{t("generantMark.label")}</p>

            <div className="flex items-center justify-center mb-8">
              <div className="relative">
                <ScoreRings fp={78} lc={71} rg={65} total={74} size={220} />
              </div>
            </div>

            <h2 className="type-h2 text-foreground max-w-[600px] mx-auto mb-6 whitespace-pre-line">
              {t("generantMark.heading")}
            </h2>

            <Link href="/signup" className="btn btn-primary">
              {t("generantMark.cta")}
            </Link>
          </div>

          {/* Score legend */}
          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
            {[
              { label: t("meetTheScore.pillars.footprint.title"), color: "var(--brand-green)" },
              { label: t("meetTheScore.pillars.local.title"), color: "var(--brand-blue)" },
              { label: t("meetTheScore.pillars.regen.title"), color: "var(--brand-lime)" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ background: item.color }} />
                <span className="type-s text-black">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 5. YOUR WORK IS REAL ═══ */}
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
              <p className="type-label text-black italic mb-3">{t("yourWorkIsReal.label")}</p>
              <h2 className="type-h2 text-foreground mb-12 whitespace-pre-line">
                {t("yourWorkIsReal.heading")}
              </h2>
            </div>

            <div className="space-y-0">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-6 py-7 border-t border-border reveal">
                  <span className="type-h2 text-foreground leading-none min-w-[60px]">{step.num}</span>
                  <div className="flex-1">
                    <span className="type-h5 text-foreground block mb-1">{step.title}</span>
                    <p className="type-m text-black">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 reveal">
              <Link href="/signup" className="btn btn-dark">
                {t("yourWorkIsReal.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 6. EVERY DESTINATION HAS A STORY ═══ */}
      <section className="section section-muted">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
            <div className="reveal">
              <p className="type-label text-black italic mb-4">{t("everyDestination.label")}</p>
              <h2 className="type-h2 text-foreground whitespace-pre-line mb-6">
                {t("everyDestination.heading")}
              </h2>
              <p className="type-m text-black mt-2 whitespace-pre-line">
                {t("everyDestination.body")}
              </p>
              <Link href="/destinations" className="btn btn-dark mt-8">
                {t("everyDestination.cta")}
              </Link>
            </div>

            <div className="reveal">
              <div className="card">
                <p className="type-label text-black mb-4">DPI · Madeira</p>
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
                      <span className="type-label text-black block">{m.label}</span>
                      <span className="type-s font-semibold tabular-nums text-foreground">{m.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card card-muted mt-4 flex flex-col gap-4">
                <h3 className="type-h5 text-foreground">{t("forwardCommitment.heading").split("\n")[0]}</h3>
                <p className="type-m text-black">{t("forwardCommitment.body")}</p>
                <Link href="/signup" className="btn btn-dark self-start">
                  {tCommon("joinUs")}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 7. FOUNDING COHORT ═══ */}
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
            <p className="type-label text-pink italic">{t("foundingCohort.eyebrow")}</p>
            <h2 className="type-h1 text-dark-foreground mt-4 max-w-text mx-auto whitespace-pre-line">
              {t("foundingCohort.heading")}
            </h2>
            <div className="mt-8">
              <Link href="/signup" className="btn btn-primary">
                {tCommon("joinUs")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 8. PRICING ═══ */}
      <section className="section border-t border-border">
        <div className="container-section">
          <div className="text-center reveal mb-12">
            <p className="type-label text-black italic mb-4">{t("pricingSection.label")}</p>
            <h2 className="type-h2 text-foreground whitespace-pre-line">
              {t("pricingSection.heading")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-start">
            {/* Free */}
            <div className="card space-y-6 reveal">
              <div>
                <span className="badge badge-surface mb-3">{tPricing("free.badge")}</span>
                <div className="flex items-end gap-1 mt-4">
                  <span className="type-h1 text-foreground">Free</span>
                </div>
                <p className="type-s text-black mt-2">{tPricing("free.subtitle")}</p>
              </div>
              <ul className="space-y-2">
                {(["one","two","three","four","five"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 type-s text-black">
                    <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {tPricing(`free.features.${k}`)}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-dark w-full text-center">
                {tPricing("free.cta")}
              </Link>
            </div>

            {/* Founder */}
            <div className="card card-dark space-y-6 reveal relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent" />
              <div>
                <span className="badge badge-lime mb-3">{tPricing("founder.badge")}</span>
                <div className="flex items-end gap-1 mt-4">
                  <span className="type-h1 text-dark-foreground">29</span>
                  <span className="type-m text-dark-foreground/60 mb-2">/mo</span>
                </div>
                <p className="type-s text-dark-foreground/70 mt-2">{tPricing("founder.subtitle")}</p>
                <p className="type-xs text-pink mt-1">{tPricing("founder.notice")}</p>
              </div>
              <ul className="space-y-2">
                {(["one","two","three","four","five","six","seven"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 type-s text-dark-foreground">
                    <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    {tPricing(`founder.features.${k}`)}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-primary w-full text-center">
                {tPricing("founder.cta")}
              </Link>
            </div>

            {/* Standard */}
            <div className="card space-y-6 reveal">
              <div>
                <span className="badge badge-surface mb-3">{tPricing("standard.badge")}</span>
                <div className="flex items-end gap-1 mt-4">
                  <span className="type-h1 text-foreground">60</span>
                  <span className="type-m text-black mb-2">/mo</span>
                </div>
                <p className="type-s text-black mt-2">{tPricing("standard.subtitle")}</p>
              </div>
              <ul className="space-y-2">
                {(["one","two","three","four","five","six"] as const).map((k) => (
                  <li key={k} className="flex items-start gap-2 type-s text-black">
                    <Check className="w-4 h-4 text-foreground shrink-0 mt-0.5" />
                    {tPricing(`standard.features.${k}`)}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="btn btn-dark w-full text-center">
                {tPricing("standard.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ 9. FAQ ═══ */}
      <section className="section section-dark">
        <div className="container-section space-y-10">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="type-label text-pink italic mb-3">{t("faq.eyebrow")}</p>
              <h2 className="type-h2 text-dark-foreground">{t("faq.heading")}</h2>
            </div>
            <a href="mailto:hello@theregenerativetourism.com" className="btn btn-primary shrink-0">
              {tCommon("contactUs")}
            </a>
          </div>

          <div className="grid md:grid-cols-2 gap-x-12">
            <div>
              {faqLeft.map((item, i) => (
                <details key={i} className="group border-t border-pink">
                  <summary className="flex items-center justify-between w-full py-5 type-s font-semibold cursor-pointer list-none gap-4 text-dark-foreground">
                    <span>{item.question}</span>
                    <span className="shrink-0 type-xl text-pink transition-transform duration-200 group-open:rotate-45">+</span>
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
                    <span className="shrink-0 type-xl text-pink transition-transform duration-200 group-open:rotate-45">+</span>
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
