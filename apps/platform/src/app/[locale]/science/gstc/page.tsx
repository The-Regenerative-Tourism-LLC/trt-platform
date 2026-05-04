import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { JsonLd } from "@/lib/seo/json-ld";
import { ArrowRight, ExternalLink, CheckCircle2 } from "lucide-react";
import { withLocalePath } from "@/i18n/pathname";

export const metadata: Metadata = {
  title: "GSTC Framework Alignment · Green Passport Score",
  description:
    "How the Green Passport Score methodology aligns with and extends the Global Sustainable Tourism Council (GSTC) criteria — converting qualitative requirements into quantitative, auditable metrics.",
  alternates: { canonical: "/science/gstc" },
  openGraph: {
    title: "GSTC Framework Alignment · Green Passport Score",
    description:
      "How GPS aligns with GSTC criteria — adding a quantitative layer and the regenerative contribution dimension that goes beyond compliance.",
    url: "/science/gstc",
  },
  twitter: {
    card: "summary_large_image",
    title: "GSTC Framework Alignment · Green Passport Score",
    description:
      "How GPS aligns with GSTC criteria — adding a quantitative layer and the regenerative contribution dimension that goes beyond compliance.",
  },
};

const gstcSchema = {
  "@context": "https://schema.org",
  "@type": "TechArticle",
  "@id": "https://www.theregenerativetourism.com/science/gstc",
  headline: "GSTC Framework Alignment — Green Passport Score",
  description:
    "Technical mapping of the Green Passport Score methodology against GSTC criteria, demonstrating alignment and regenerative extension.",
  url: "https://www.theregenerativetourism.com/science/gstc",
  author: { "@type": "Organization", name: "The Regenerative Tourism" },
  about: {
    "@type": "Thing",
    name: "Global Sustainable Tourism Council Criteria",
    sameAs: "https://www.gstcouncil.org",
  },
};

const CRITERIA = [
  {
    id: "A",
    title: "Sustainable Management",
    requirement: "Governance, strategy, monitoring, and continuous improvement policies.",
    implementation:
      "Assessment cycle governance with append-only score snapshots. Evidence verification through tiered system (T1 Primary 100% → T2 Secondary 75% → T3 Tertiary 50% → Proxy 25%). Direction of Performance Score (DPS) rewards continuous improvement: DPS-1 indicator delta + DPS-2 improvement breadth + DPS-3 contribution activation.",
  },
  {
    id: "B",
    title: "Socioeconomic Sustainability",
    requirement:
      "Contribution to local economic development through employment, procurement, and community support.",
    implementation:
      "Pillar 2 – Local Integration (30%): Employment (35% — local rate + quality index), Procurement (30% — local F&B + non-F&B sourcing %), Revenue Retention (20% — direct booking rate + local ownership %), Community (15% — engagement score 0–4). All measured from payroll, invoices, and booking systems.",
  },
  {
    id: "C",
    title: "Cultural Sustainability",
    requirement: "Preservation and promotion of cultural heritage, supporting local cultural activities.",
    implementation:
      "P3 Category Scope (40% of P3) includes cultural documentation and heritage preservation as a contribution category. Community engagement score (P2, indicator 20) evaluates local cultural programme support. Institutional partnerships with cultural organisations generate verified contribution records.",
  },
  {
    id: "D",
    title: "Environmental Sustainability",
    requirement: "Environmental management, energy, water, waste, biodiversity, and emissions.",
    implementation:
      "Pillar 1 — Operational Footprint (40%): Energy (30% — kWh/guest-night + renewable %), Water (25% — L/guest-night + recirculation bonus), Waste (20% — diversion rate), Carbon (10% — kg CO₂e/guest-night), Site & Land Use (10% — ecological assessment 0–4). Normalised via rubric bands per USALI 12th Edition EWW methodology.",
  },
];

const OUTER = "container mx-auto max-w-3xl px-6 md:px-10";

export default async function GstcPage() {
  const t = await getTranslations("public.science.gstc");
  const locale = await getLocale();
  const methodologyHref = withLocalePath("/methodology?tab=evidence", locale);

  return (
    <>
      <JsonLd schema={gstcSchema} />

      <div className="min-h-[60vh] bg-background">
        <div className={`${OUTER} py-16 md:py-24`}>

          {/* Badge + heading */}
          <div className="space-y-6 mb-14">
            <span className="inline-flex items-center border border-border rounded-full px-3 py-1 text-xs text-black">
              {t("badge")}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              {t("title")}
            </h1>
            <p className="text-base text-black leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {/* Criteria Mapping card */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden mb-6">
            <div className="px-6 md:px-8 py-5 border-b border-border">
              <p className="font-semibold text-base">{t("mappingTitle")}</p>
            </div>
            <div className="divide-y divide-border">
              {CRITERIA.map((c) => (
                <div key={c.id} className="px-6 md:px-8 py-6 space-y-4">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-black/50 shrink-0" />
                    <p className="font-semibold text-sm">
                      {c.id} — {c.title}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4 pl-6">
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-black/60">
                        {t("requirement")}
                      </p>
                      <p className="text-sm text-black leading-relaxed">
                        {c.requirement}
                      </p>
                    </div>
                    <div className="space-y-1.5 rounded-xl bg-secondary/40 border border-border/60 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-black/60">
                        {t("implementation")}
                      </p>
                      <p className="text-sm text-black leading-relaxed">
                        {c.implementation}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Beyond Compliance card */}
          <div className="rounded-2xl border border-border bg-card px-6 md:px-8 py-6 space-y-4 mb-12">
            <p className="font-semibold text-base">{t("beyondTitle")}</p>
            <p className="text-sm text-black leading-relaxed">
              While GSTC sets the floor for sustainable tourism, Pillar 3 (Regenerative
              Contribution, 30%) extends the framework into active regeneration — measuring whether
              operators are actively restoring ecosystems, strengthening communities, and building
              resilience. As Mang &amp; Reed (2012) establish: regenerative development is defined
              not by reduced damage but by positive contribution to the regenerative capacity of a
              living system.
            </p>
            <p className="text-sm text-black leading-relaxed">
              The Direction of Performance Score further extends GSTC by providing a structured
              incentive for continuous improvement — rewarding trajectory, not just current position.
            </p>
          </div>

          {/* Footer links */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <a
              href="https://www.gstcouncil.org"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-black hover:text-foreground transition-colors"
            >
              {t("visit")} <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <Link
              href={methodologyHref}
              className="inline-flex items-center gap-1.5 text-black hover:text-foreground transition-colors"
            >
              {t("fullMethodology")} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
