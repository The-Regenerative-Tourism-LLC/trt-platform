import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Green Passport — The Regenerative Tourism Standard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand palette (from globals.css — no green)
// --amber: hsl(40,30%,50%) → #A68C59
// --tan: hsl(32,18%,73%) → #C7BBAE
// gps-gradient-start: hsl(8,63%,55%) → #D45744
// gps-gradient-mid: hsl(40,64%,58%) → #D8AB4F
// gps-regen: hsl(265,98%,75%) → #B581FE

const AMBER = "#A68C59";
const TAN = "#C7BBAE";
const CREAM = "#F0E6D3";
const FP_COLOR = "#D45744";   // footprint pillar — terracotta
const LC_COLOR = "#D8AB4F";   // local pillar — warm gold
const RG_COLOR = "#B581FE";   // regen pillar — violet

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          background: "linear-gradient(135deg, #100d08 0%, #1a140c 55%, #221a10 100%)",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
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

        {/* Top badge */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 80,
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: `rgba(166,140,89,0.12)`,
            border: `1px solid rgba(166,140,89,0.35)`,
            borderRadius: 100,
            padding: "8px 20px",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: AMBER,
            }}
          />
          <span
            style={{
              color: AMBER,
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Verified Regenerative Tourism
          </span>
        </div>

        {/* Score rings decoration — pillar colours */}
        <div
          style={{
            position: "absolute",
            right: 80,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 220,
            height: 220,
          }}
        >
          <svg width="220" height="220" viewBox="0 0 220 220">
            {/* Track rings */}
            <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,248,235,0.06)" strokeWidth="14" />
            <circle cx="110" cy="110" r="76" fill="none" stroke="rgba(255,248,235,0.06)" strokeWidth="12" />
            <circle cx="110" cy="110" r="54" fill="none" stroke="rgba(255,248,235,0.06)" strokeWidth="10" />

            {/* Footprint — terracotta */}
            <circle cx="110" cy="110" r="100" fill="none" stroke={FP_COLOR} strokeWidth="14"
              strokeDasharray="502 628" strokeLinecap="round"
              transform="rotate(-90 110 110)" />
            {/* Local — warm gold */}
            <circle cx="110" cy="110" r="76" fill="none" stroke={LC_COLOR} strokeWidth="12"
              strokeDasharray="336 480" strokeLinecap="round"
              transform="rotate(-90 110 110)" />
            {/* Regen — violet */}
            <circle cx="110" cy="110" r="54" fill="none" stroke={RG_COLOR} strokeWidth="10"
              strokeDasharray="254 339" strokeLinecap="round"
              transform="rotate(-90 110 110)" />

            <text x="110" y="106" textAnchor="middle" fill={CREAM} fontSize="28" fontWeight="700">82</text>
            <text x="110" y="126" textAnchor="middle" fill="rgba(240,230,211,0.45)" fontSize="11" letterSpacing="1">GPS</text>
          </svg>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 720 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 60,
              fontWeight: 700,
              color: CREAM,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Green{" "}
            <span style={{ color: AMBER }}>Passport</span>
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: 22,
              color: "rgba(240,230,211,0.6)",
              lineHeight: 1.5,
              maxWidth: 560,
            }}
          >
            The verified signal for regenerative tourism. GPS scores, DPI context, and auditable computation.
          </p>

          {/* Pillar pills */}
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            {[
              { label: "Footprint", color: FP_COLOR },
              { label: "Local Community", color: LC_COLOR },
              { label: "Regeneration", color: RG_COLOR },
            ].map(({ label, color }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "rgba(255,248,235,0.05)",
                  border: "1px solid rgba(255,248,235,0.1)",
                  borderRadius: 6,
                  padding: "6px 14px",
                }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
                <span style={{ color: "rgba(240,230,211,0.65)", fontSize: 13, fontWeight: 500 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
