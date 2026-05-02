import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { JsonLd, blogListingSchema } from "@/lib/seo/json-ld";
import { ArrowRight } from "lucide-react";

type Tab = "Blog" | "press" | "research";

const TABS: { id: Tab; label: string; description: string }[] = [
  {
    id: "Blog",
    label: "Blog",
    description: "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality.",
  },
  {
    id: "press",
    label: "Press & Coverage",
    description: "Media coverage, press releases, and announcements from The Regenerative Tourism team.",
  },
  {
    id: "research",
    label: "Scientific Research",
    description: "Peer-reviewed frameworks, academic foundations, and framework alignment documents underpinning the GPS methodology.",
  },
];

const RESEARCH_RESOURCES = [
  {
    badge: "Framework Alignment",
    title: "GSTC Criteria Mapping",
    description:
      "How the Green Passport Score methodology aligns with and extends GSTC criteria — converting qualitative requirements into quantitative, auditable metrics.",
    href: "/science/gstc",
    external: false,
  },
  {
    badge: "UN 2030 Agenda",
    title: "UN Sustainable Development Goals",
    description:
      "The three GPS pillars map directly and verifiably onto five SDGs. Tourism is the only sector explicitly named in SDG 8.9, 12.b, and 14.7.",
    href: "/science/sdgs",
    external: false,
  },
];

const TAB_METADATA: Record<Tab, { title: string; description: string; canonical: string }> = {
  Blog: {
    title: "Blog · Regenerative Tourism Journal",
    description:
      "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality — from The Regenerative Tourism team.",
    canonical: "/journal",
  },
  press: {
    title: "Press & Coverage · The Regenerative Tourism",
    description:
      "Media coverage, press releases, and announcements from The Regenerative Tourism team — the verified signal for regenerative tourism.",
    canonical: "/journal?tab=press",
  },
  research: {
    title: "Scientific Research · Green Passport Score Methodology",
    description:
      "Peer-reviewed frameworks, GSTC alignment, UN SDG mapping, and academic foundations underpinning the Green Passport Score methodology.",
    canonical: "/journal?tab=research",
  },
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}): Promise<Metadata> {
  const { tab } = await searchParams;
  const activeTab: Tab = (tab as Tab) ?? "Blog";
  const meta = TAB_METADATA[activeTab] ?? TAB_METADATA.Blog;

  return {
    title: meta.title,
    description: meta.description,
    alternates: { canonical: meta.canonical },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function JournalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab: Tab = (tab as Tab) ?? "Blog";

  const featured = allPosts[0];
  const rest = allPosts.slice(1);

  return (
    <>
      <JsonLd schema={blogListingSchema} />

      <div className="min-h-[60vh]">
        {/* Hero */}
        <section className="bg-[#1C1C1C] text-[#FDF5EA] py-20 md:py-28 px-5 md:px-6">
          <div className="container mx-auto max-w-7xl">
            <p className="font-hand text-xl text-[#FDF5EA]/40 mb-3">Journal</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] max-w-2xl">
              Regenerative Tourism{" "}
              <span className="text-[#C5BAA6]">Thinking</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/55 max-w-xl leading-relaxed">
              Perspectives on conscious travel, ecosystem care, and the science behind the
              measurement — from The Regenerative Tourism team.
            </p>
          </div>
        </section>

        {/* Tab bar */}
        <div className="sticky top-14 z-30 bg-background/90 backdrop-blur-xl border-b border-border">
          <div className="container mx-auto max-w-7xl px-5 md:px-6">
            <div className="flex h-12 gap-0 overflow-x-auto scrollbar-none">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={t.id === "Blog" ? "/journal" : `/journal?tab=${t.id}`}
                  className={`relative px-4 md:px-6 h-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 flex items-center ${
                    activeTab === t.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground/70"
                  }`}
                >
                  {t.label}
                  {activeTab === t.id && (
                    <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-foreground" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-14 md:py-20">

          {/* ── Blog tab ── */}
          {activeTab === "Blog" && (
            <div className="tab-panel">
              {featured && (
                <div className="mb-16">
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6 font-medium">
                    Latest
                  </p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group block rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="bg-gradient-to-br from-[#1C1C1C] to-[#2A2419] flex items-center justify-center p-12 min-h-[260px]">
                        <span className="inline-flex items-center gap-2 bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 text-[#C5BAA6] text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full">
                          {featured.category}
                        </span>
                      </div>
                      <div className="p-8 md:p-10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                            <time dateTime={featured.publishedAt}>
                              {formatDate(featured.publishedAt)}
                            </time>
                            <span>·</span>
                            <span>{featured.readingTimeMinutes} min read</span>
                          </div>
                          <h2 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight group-hover:text-primary transition-colors mb-4">
                            {featured.title}
                          </h2>
                          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                            {featured.excerpt}
                          </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {featured.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[11px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {rest.length > 0 && (
                <>
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6 font-medium">
                    More articles
                  </p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/journal/${post.slug}`}
                        className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="bg-gradient-to-br from-[#1C1C1C] to-[#2A2419] h-40 flex items-center justify-center">
                          <span className="inline-flex items-center gap-2 bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 text-[#C5BAA6] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                            {post.category}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                            <span>·</span>
                            <span>{post.readingTimeMinutes} min read</span>
                          </div>
                          <h3 className="font-bold leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-3">
                            {post.title}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {allPosts.length === 0 && (
                <div className="text-center py-24 text-muted-foreground">
                  No articles yet — check back soon.
                </div>
              )}
            </div>
          )}

          {/* ── Press tab ── */}
          {activeTab === "press" && (
            <div className="tab-panel">
              <div className="max-w-xl">
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6 font-medium">
                  Press & Coverage
                </p>
                <div className="text-center py-24 text-muted-foreground border border-dashed border-border rounded-2xl">
                  <p className="text-sm">No press coverage yet — check back soon.</p>
                  <p className="text-xs mt-2 text-muted-foreground/60">
                    Press inquiries:{" "}
                    <a href="mailto:press@theregenerativetourism.com" className="underline">
                      press@theregenerativetourism.com
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── Research tab ── */}
          {activeTab === "research" && (
            <div className="tab-panel max-w-2xl">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
                Scientific Research
              </p>
              <p className="text-sm text-muted-foreground mb-10 leading-relaxed">
                Peer-reviewed frameworks, GSTC alignment, UN SDG mapping, and the academic
                foundations underpinning the Green Passport Score methodology.
              </p>

              <div className="space-y-4">
                {RESEARCH_RESOURCES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="group block rounded-2xl border border-border bg-card px-6 py-5 hover:shadow-md transition-shadow space-y-2"
                  >
                    <span className="inline-flex items-center border border-border rounded-full px-2.5 py-0.5 text-[10px] text-muted-foreground mb-1">
                      {r.badge}
                    </span>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="font-semibold leading-snug group-hover:text-primary transition-colors">
                        {r.title}
                      </h2>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{r.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
