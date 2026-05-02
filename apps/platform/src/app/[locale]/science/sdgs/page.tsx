import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/lib/seo/json-ld";
import { ExternalLink } from "lucide-react";
import { withLocalePath } from "@/i18n/pathname";

export const metadata: Metadata = {
  title: "UN SDGs Alignment · Green Passport Score",
  description:
    "How the three pillars of the Green Passport Score framework map directly and verifiably onto five UN Sustainable Development Goals — SDG 8.9, SDG 12.b, SDG 14.7, SDG 15, and SDG 17.",
  alternates: { canonical: "/science/sdgs" },
  openGraph: {
    title: "UN SDGs Alignment · Green Passport Score",
    description:
      "Tourism is the only economic sector explicitly named in three UN SDGs. The GPS pillars map directly and verifiably onto five SDGs.",
    url: "/science/sdgs",
  },
  twitter: {
    card: "summary_large_image",
    title: "UN SDGs Alignment · Green Passport Score",
    description:
      "Tourism is the only economic sector explicitly named in three UN SDGs. The GPS pillars map directly and verifiably onto five SDGs.",
  },
};

const sdgsSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "https://www.theregenerativetourism.com/science/sdgs",
  headline: "UN Sustainable Development Goals Alignment — Green Passport Score",
  description:
    "Technical mapping of the Green Passport Score framework against the five UN Sustainable Development Goals most relevant to tourism.",
  url: "https://www.theregenerativetourism.com/science/sdgs",
  author: { "@type": "Organization", name: "The Regenerative Tourism" },
  about: {
    "@type": "Thing",
    name: "UN Sustainable Development Goals",
    sameAs: "https://sdgs.un.org",
  },
};

const SDGS = [
  {
    num: 8,
    title: "Decent Work & Economic Growth",
    target: "Target 8.9",
    pillar: "P2",
    desc: "Devise and implement policies to promote sustainable tourism that creates jobs and promotes local culture and products — the legislative mandate for local economic integration.",
  },
  {
    num: 12,
    title: "Responsible Consumption & Production",
    target: "Target 12.b",
    pillar: "P1",
    desc: "Develop tools to monitor sustainable development impacts for sustainable tourism — supports the measurement infrastructure of the Operational Footprint pillar.",
  },
  {
    num: 14,
    title: "Life Below Water",
    target: "Target 14.7",
    pillar: "P3",
    desc: "Increase economic benefits from the sustainable use of marine resources through sustainable tourism — validates marine contribution pathways and MARE partnership.",
  },
  {
    num: 15,
    title: "Life on Land",
    target: "Target 15.1/15.5",
    pillar: "P3",
    desc: "Protect, restore and promote sustainable use of terrestrial ecosystems; halt biodiversity loss — applies to operators funding habitat recovery or biodiversity research.",
  },
  {
    num: 17,
    title: "Partnerships for the Goals",
    target: "Target 17.17",
    pillar: "P3",
    desc: "Encourage multi-stakeholder partnerships — validates institutional research and conservation partnerships as an SDG delivery mechanism for tourism operators.",
  },
];

export default async function SdgsPage() {
  const t = await getTranslations("public.science.sdgs");
  const locale = await getLocale();
  const methodologyHref = withLocalePath("/methodology?tab=evidence", locale);

  return (
    <>
      <JsonLd schema={sdgsSchema} />

      <div className="min-h-[60vh] bg-background">
        <div className="container mx-auto max-w-3xl px-6 md:px-10 py-16 md:py-24">

          {/* Badge + heading */}
          <div className="space-y-6 mb-14">
            <span className="inline-flex items-center border border-border rounded-full px-3 py-1 text-xs text-muted-foreground">
              {t("badge")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              {t("title")}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Research quote */}
          <div className="rounded-2xl border border-border bg-card px-6 md:px-8 py-6 mb-6">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Lavaredas et al. (2025) confirm in their bibliometric review of tourism SDG research
              (2015–2023) that SDG 8, SDG 12, and SDG 17 are the three most cited SDGs in tourism
              scholarship — validating the priority weighting of Local Integration and Regenerative
              Contribution in this framework. Critically, the same review identifies SDG 14 and the
              social dimensions of tourism as systematically underresearched. This framework directly
              addresses that gap.
            </p>
          </div>

          {/* SDG cards */}
          <div className="space-y-3 mb-12">
            {SDGS.map((sdg) => (
              <div
                key={sdg.num}
                className="rounded-2xl border border-border bg-card px-6 md:px-8 py-5 flex items-start gap-5"
              >
                <div className="w-10 h-10 rounded-xl border border-border bg-secondary/40 flex items-center justify-center shrink-0 text-base font-bold">
                  {sdg.num}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-sm">{sdg.title}</p>
                    <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      {sdg.target}
                    </span>
                    <span className="text-[10px] border border-border rounded-full px-2 py-0.5 text-muted-foreground">
                      {sdg.pillar}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{sdg.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Footer link */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a
              href="https://sdgs.un.org/goals"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("visit")} <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href={methodologyHref}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("fullMethodology")}
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
