export type BlogBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "comparison-table"; columns: { title: string; items: string[] }[] }
  | { type: "callout"; text: string }
  | { type: "divider" };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string; // ISO date string
  updatedAt?: string;
  category: string;
  tags: string[];
  readingTimeMinutes: number;
  coverImage?: string;
  author: {
    name: string;
    title?: string;
  };
  blocks: BlogBlock[];
}
