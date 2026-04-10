import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/blog";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const AMBER = "#A68C59";
const CREAM = "#F0E6D3";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function BlogOgImage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  const title = post?.title ?? "Green Passport Journal";
  const category = post?.category ?? "Regenerative Tourism";
  const readingTime = post?.readingTimeMinutes;
  const date = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #100d08 0%, #1a140c 55%, #221a10 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        {/* Grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,248,235,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,248,235,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top: brand + category badge */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(166,140,89,0.1)",
              border: "1px solid rgba(166,140,89,0.3)",
              borderRadius: 100,
              padding: "6px 18px",
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: AMBER }} />
            <span
              style={{
                color: AMBER,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Green Passport · Journal
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "rgba(245,158,11,0.12)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 100,
              padding: "6px 16px",
            }}
          >
            <span
              style={{
                color: "#F59E0B",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {category}
            </span>
          </div>
        </div>

        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, justifyContent: "center", paddingTop: 32, paddingBottom: 32 }}>
          <h1
            style={{
              margin: 0,
              fontSize: title.length > 60 ? 44 : 52,
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: 900,
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom: meta + site */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            {date && (
              <span style={{ fontSize: 14, color: "rgba(240,230,211,0.45)" }}>
                {date}
              </span>
            )}
            {readingTime && (
              <>
                <span style={{ fontSize: 14, color: "rgba(240,230,211,0.2)" }}>·</span>
                <span style={{ fontSize: 14, color: "rgba(240,230,211,0.45)" }}>
                  {readingTime} min read
                </span>
              </>
            )}
          </div>
          <span style={{ fontSize: 14, color: "rgba(240,230,211,0.3)", letterSpacing: "0.05em" }}>
            greenpassport.travel
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
