import type { BlogPost } from "./types";
import tourismEthics from "./posts/tourism-ethics-rethinking-customer-first";

/** All published blog posts, newest first */
export const allPosts: BlogPost[] = [tourismEthics];

export function getPostBySlug(slug: string): BlogPost | undefined {
  return allPosts.find((p) => p.slug === slug);
}

export function getAllSlugs(): string[] {
  return allPosts.map((p) => p.slug);
}

export type { BlogPost };
