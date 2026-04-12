import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getPostBySlug, getAllSlugs } from "@/lib/blog";
import type { BlogBlock } from "@/lib/blog/types";
import { JsonLd, buildArticleSchema } from "@/lib/seo/json-ld";
import { ArrowLeft } from "lucide-react";

const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://www.theregenerativetourism.com";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    keywords: post.tags,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      url: `/blog/${slug}`,
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt ?? post.publishedAt,
      tags: post.tags,
      images: [
        {
          url: `/blog/${slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: [`/blog/${slug}/opengraph-image`],
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

function BlockRenderer({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case "paragraph":
      return (
        <p className="text-base md:text-[1.0625rem] leading-[1.8] text-foreground/85">
          {block.text}
        </p>
      );

    case "heading":
      if (block.level === 2) {
        return (
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight leading-tight mt-14 mb-4 first:mt-0">
            {block.text}
          </h2>
        );
      }
      return (
        <h3 className="text-lg md:text-xl font-semibold tracking-tight leading-snug mt-8 mb-3">
          {block.text}
        </h3>
      );

    case "list":
      if (block.ordered) {
        return (
          <ol className="list-decimal list-outside pl-5 space-y-2">
            {block.items.map((item, i) => (
              <li
                key={i}
                className="text-base md:text-[1.0625rem] leading-[1.75] text-foreground/85 pl-1"
              >
                {item}
              </li>
            ))}
          </ol>
        );
      }
      return (
        <ul className="list-disc list-outside pl-5 space-y-2">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="text-base md:text-[1.0625rem] leading-[1.75] text-foreground/85 pl-1"
            >
              {item}
            </li>
          ))}
        </ul>
      );

    case "callout":
      return (
        <blockquote className="my-8 border-l-4 border-amber-500 pl-5 py-1">
          <p className="text-lg md:text-xl font-medium leading-relaxed text-foreground/90 italic">
            {block.text}
          </p>
        </blockquote>
      );

    case "comparison-table":
      return (
        <div className="overflow-x-auto my-8 -mx-5 md:mx-0">
          <table className="w-full border-collapse text-sm min-w-[480px]">
            <thead>
              <tr>
                {block.columns.map((col) => (
                  <th
                    key={col.title}
                    className="text-left px-4 py-3 bg-[#1C1C1C] text-[#FDF5EA] font-semibold tracking-tight border border-[#1C1C1C]/60 first:rounded-tl-lg last:rounded-tr-lg"
                  >
                    {col.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({
                length: Math.max(...block.columns.map((c) => c.items.length)),
              }).map((_, rowIdx) => (
                <tr key={rowIdx} className="odd:bg-secondary/40">
                  {block.columns.map((col) => (
                    <td
                      key={col.title}
                      className="px-4 py-3 border border-border text-foreground/80 align-top"
                    >
                      {col.items[rowIdx] ?? ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "divider":
      return <hr className="border-border my-10" />;

    default:
      return null;
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const articleSchema = buildArticleSchema({
    title: post.title,
    description: post.excerpt,
    publishedAt: post.publishedAt,
    updatedAt: post.updatedAt,
    slug: post.slug,
    tags: post.tags,
  });

  return (
    <>
      <JsonLd schema={articleSchema} />

      {/* Article header */}
      <div className="bg-[#1C1C1C] text-[#FDF5EA]">
        <div className="container mx-auto max-w-4xl px-5 md:px-6 py-14 md:py-20">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs text-white/40 hover:text-white/70 transition-colors mb-8 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Blog
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 text-[#C5BAA6] text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
              {post.category}
            </span>
            <span className="text-xs text-white/30">
              {post.readingTimeMinutes} min read
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1] max-w-3xl mb-6">
            {post.title}
          </h1>

          <p className="text-base md:text-lg text-white/55 max-w-2xl leading-relaxed mb-8">
            {post.excerpt}
          </p>

          <div className="flex items-center gap-3 pt-6 border-t border-white/10">
            <div className="w-8 h-8 rounded-full bg-[#C5BAA6]/20 border border-[#C5BAA6]/40 flex items-center justify-center text-[#C5BAA6] text-xs font-bold">
              GP
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">
                {post.author.name}
              </p>
              {post.author.title && (
                <p className="text-xs text-white/35">{post.author.title}</p>
              )}
            </div>
            <span className="ml-auto text-xs text-white/30">
              <time dateTime={post.publishedAt}>
                {formatDate(post.publishedAt)}
              </time>
            </span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <article className="container mx-auto max-w-3xl px-5 md:px-6 py-14 md:py-20">
        <div className="space-y-5">
          {post.blocks.map((block, i) => (
            <BlockRenderer key={i} block={block} />
          ))}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-14 pt-8 border-t border-border">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3 font-medium">
              Tags
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-secondary text-muted-foreground px-3 py-1.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-14 rounded-2xl bg-[#1C1C1C] text-[#FDF5EA] p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="font-bold text-lg leading-snug mb-1">
              Is your operation truly regenerative?
            </p>
            <p className="text-sm text-[#FDF5EA]/55 max-w-sm leading-relaxed">
              Apply for a Green Passport Score and make your impact visible to conscious travelers worldwide.
            </p>
          </div>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center shrink-0 rounded-lg bg-[#C5BAA6] hover:bg-[#B8AA97] text-[#1C1C1C] font-semibold text-sm px-6 h-11 transition-colors"
          >
            Get Certified
          </Link>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to all articles
          </Link>
        </div>
      </article>
    </>
  );
}
