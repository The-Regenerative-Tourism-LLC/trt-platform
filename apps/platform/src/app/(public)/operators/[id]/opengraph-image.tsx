import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (from globals.css — no green)
const AMBER = "#A68C59";   // --amber hsl(40,30%,50%)
const TAN = "#C7BBAE";     // --tan   hsl(32,18%,73%)
const CREAM = "#F0E6D3";   // warm cream

interface Props {
  params: Promise<{ id: string }>;
}

export default async function OgImage({ params }: Props) {
  const { id } = await params;

  const operator = await prisma.operator
    .findUnique({
      where: { id },
      select: {
        tradingName: true,
        legalName: true,
        destinationRegion: true,
        scoreSnapshots: {
          where: { isPublished: true },
          orderBy: { computedAt: "desc" },
          take: 1,
          select: {
            gpsTotal: true,
            gpsBand: true,
          },
        },
      },
    })
    .catch(() => null);

  const name = operator?.tradingName ?? operator?.legalName ?? "Operator";
  const region = operator?.destinationRegion ?? "";
  const snapshot = operator?.scoreSnapshots?.[0];
  const gps = snapshot?.gpsTotal != null ? Number(snapshot.gpsTotal) : null;
  const band = snapshot?.gpsBand ?? null;

  // Band accent colours — on-brand only
  const bandColor: Record<string, string> = {
    PLATINUM: TAN,
    GOLD: "#D8AB4F",   // gps-gradient-mid warm gold
    SILVER: TAN,
    BRONZE: AMBER,
    PROVISIONAL: TAN,
  };
  const accentColor = band ? (bandColor[band] ?? AMBER) : AMBER;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #100d08 0%, #1a140c 60%, #221a10 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
          justifyContent: "space-between",
        }}
      >
        {/* Warm grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,248,235,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,248,235,0.025) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Top label */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
            <span style={{ color: AMBER, fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              The Regenerative Tourism · Verified Operator
            </span>
          </div>
        </div>

        {/* Operator name */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1, justifyContent: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: gps !== null ? 54 : 62,
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              maxWidth: 700,
            }}
          >
            {name}
          </h1>
          {region && (
            <p style={{ margin: 0, fontSize: 20, color: "rgba(240,230,211,0.45)", display: "flex", gap: 8 }}>
              <span>📍</span>
              <span>{region}</span>
            </p>
          )}
        </div>

        {/* Bottom: score + band + site */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          {gps !== null ? (
            <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{
                  fontSize: 13,
                  color: "rgba(240,230,211,0.4)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}>
                  GPS Score
                </span>
                <span style={{ fontSize: 80, fontWeight: 800, color: accentColor, lineHeight: 1 }}>
                  {Math.round(gps)}
                </span>
              </div>
              {band && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    background: `${accentColor}18`,
                    border: `1px solid ${accentColor}40`,
                    borderRadius: 8,
                    padding: "10px 22px",
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 700, color: accentColor, letterSpacing: "0.05em" }}>
                    {band}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div />
          )}

          <span style={{ fontSize: 14, color: "rgba(240,230,211,0.3)", letterSpacing: "0.05em" }}>
            greenpassport.travel
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
