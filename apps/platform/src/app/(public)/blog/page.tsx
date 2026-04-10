import type { Metadata } from "next";
import Link from "next/link";
import { allPosts } from "@/lib/blog";
import { JsonLd } from "@/lib/seo/json-ld";
import { blogListingSchema } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Blog · Regenerative Tourism Insights",
  description:
    "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality — from the Green Passport team.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog · Regenerative Tourism Insights",
    description:
      "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality.",
    url: "/blog",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog · Regenerative Tourism Insights",
    description:
      "Articles on regenerative tourism, sustainability, ethics of travel, and the future of conscious hospitality.",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
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
              <span className="text-[#C5BAA6]">Insights</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-white/55 max-w-xl leading-relaxed">
              Perspectives on conscious travel, ecosystem care, and the ethics of hospitality — from the Green Passport team.
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-5 md:px-6 py-14 md:py-20">
          {/* Featured post */}
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
                    <div className="text-center">
                      <span className="inline-flex items-center gap-2 bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 text-[#C5BAA6] text-xs font-semibold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
                        {featured.category}
                      </span>
                      <p className="font-hand text-5xl text-white/20 leading-none">
                        GP
                      </p>
                    </div>
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

          {/* Post grid */}
          {rest.length > 0 && (
            <>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-6 font-medium">
                More articles
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {rest.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="group block rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="bg-gradient-to-br from-[#1C1C1C] to-[#2A2419] h-40 flex items-center justify-center">
                      <span className="inline-flex items-center gap-2 bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 text-[#C5BAA6] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                        <time dateTime={post.publishedAt}>
                          {formatDate(post.publishedAt)}
                        </time>
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
      </div>
    </>
  );
}
