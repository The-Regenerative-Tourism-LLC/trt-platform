import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { JsonLd, blogListingSchema } from "@/lib/seo/json-ld";
import { ArrowRight } from "lucide-react";

type Tab = "Blog" | "press" | "research";

const TABS: { id: Tab; label: string }[] = [
  { id: "Blog",     label: "Blog" },
  { id: "press",    label: "Press & Coverage" },
  { id: "research", label: "Scientific Research" },
];

const RESEARCH_RESOURCES = [
  {
    badge: "Framework Alignment",
    title: "GSTC Criteria Mapping",
    description:
      "How the Green Passport Score methodology aligns with and extends GSTC criteria — converting qualitative requirements into quantitative, auditable metrics.",
    href: "/science/gstc",
  },
  {
    badge: "UN 2030 Agenda",
    title: "UN Sustainable Development Goals",
    description:
      "The three GPS pillars map directly and verifiably onto five SDGs. Tourism is the only sector explicitly named in SDG 8.9, 12.b, and 14.7.",
    href: "/science/sdgs",
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
    openGraph: { title: meta.title, description: meta.description, url: meta.canonical },
    twitter: { card: "summary_large_image", title: meta.title, description: meta.description },
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
        <section className="section section-dark">
          <div className="container-section">
            <p className="type-label text-pink italic mb-3">Journal</p>
            <h1 className="type-h1 text-dark-foreground max-w-2xl">
              Regenerative Tourism{" "}
              <span className="text-lime">Thinking</span>
            </h1>
            <p className="type-m text-pink max-w-xl mt-5">
              Perspectives on conscious travel, ecosystem care, and the science behind the
              measurement — from The Regenerative Tourism team.
            </p>
          </div>
        </section>

        {/* Tab bar — solid background */}
        <div className="sticky top-14 z-30 bg-background border-b border-border">
          <div className="container-section">
            <div className="flex h-12 gap-0 overflow-x-auto scrollbar-none">
              {TABS.map((t) => (
                <Link
                  key={t.id}
                  href={t.id === "Blog" ? "/journal" : `/journal?tab=${t.id}`}
                  className={`relative px-4 md:px-6 h-full type-s font-medium transition-colors whitespace-nowrap shrink-0 flex items-center ${
                    activeTab === t.id
                      ? "text-foreground"
                      : "text-black hover:text-foreground"
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

        <div className="container-section py-14 md:py-20">

          {/* ── Blog tab ── */}
          {activeTab === "Blog" && (
            <div className="tab-panel">
              {featured && (
                <div className="mb-16">
                  <p className="type-label text-black mb-6">Latest</p>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="group block border border-border bg-card overflow-hidden card-interactive"
                  >
                    <div className="grid md:grid-cols-2 gap-0">
                      <div className="bg-dark flex items-center justify-center p-12 min-h-[260px]">
                        <span className="badge badge-lime">
                          {featured.category}
                        </span>
                      </div>
                      <div className="p-8 md:p-10 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-3 type-xs text-black mb-4">
                            <time dateTime={featured.publishedAt}>
                              {formatDate(featured.publishedAt)}
                            </time>
                            <span>·</span>
                            <span>{featured.readingTimeMinutes} min read</span>
                          </div>
                          <h2 className="type-h4 group-hover:text-primary transition-colors mb-4">
                            {featured.title}
                          </h2>
                          <p className="type-s text-black line-clamp-3">
                            {featured.excerpt}
                          </p>
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          {featured.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="badge badge-pink">
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
                  <p className="type-label text-black mb-6">More articles</p>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {rest.map((post) => (
                      <Link
                        key={post.slug}
                        href={`/journal/${post.slug}`}
                        className="group block border border-border bg-card overflow-hidden card-interactive"
                      >
                        <div className="bg-dark h-40 flex items-center justify-center">
                          <span className="badge badge-lime">
                            {post.category}
                          </span>
                        </div>
                        <div className="p-6">
                          <div className="flex items-center gap-2 type-xs text-black mb-3">
                            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
                            <span>·</span>
                            <span>{post.readingTimeMinutes} min read</span>
                          </div>
                          <h3 className="type-h5 group-hover:text-primary transition-colors line-clamp-3">
                            {post.title}
                          </h3>
                          <p className="mt-2 type-s text-black line-clamp-2">
                            {post.excerpt}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}

              {allPosts.length === 0 && (
                <div className="text-center py-24 text-black">
                  No articles yet — check back soon.
                </div>
              )}
            </div>
          )}

          {/* ── Press tab ── */}
          {activeTab === "press" && (
            <div className="tab-panel">
              <div className="max-w-xl">
                <p className="type-label text-black mb-6">Press & Coverage</p>
                <div className="text-center py-24 text-black card-dashed">
                  <p className="type-s">No press coverage yet — check back soon.</p>
                  <p className="type-xs mt-2 text-black">
                    Press inquiries:{" "}
                    <a href="mailto:press@theregenerativetourism.com" className="underline hover:text-foreground transition-colors">
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
              <p className="type-label text-black mb-2">Scientific Research</p>
              <p className="type-s text-black mb-10">
                Peer-reviewed frameworks, GSTC alignment, UN SDG mapping, and the academic
                foundations underpinning the Green Passport Score methodology.
              </p>

              <div className="space-y-4">
                {RESEARCH_RESOURCES.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="group block card card-interactive px-6 py-5 space-y-2"
                  >
                    <span className="badge badge-pink mb-1">
                      {r.badge}
                    </span>
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="type-h5 group-hover:text-primary transition-colors">
                        {r.title}
                      </h2>
                      <ArrowRight className="w-4 h-4 text-black shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <p className="type-s text-black">{r.description}</p>
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
