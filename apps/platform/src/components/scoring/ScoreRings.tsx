"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ScoreRingsProps {
  footprint: number;
  local: number;
  regen: number;
  total?: number;
  peerLabel?: string;
  size?: number;
  className?: string;
  hideLegend?: boolean;
}

const RING_COLORS = {
  footprint: "hsl(var(--gps-footprint))",
  local: "hsl(var(--gps-local))",
  regen: "hsl(var(--gps-regen))",
};

const LEGEND_ITEMS = [
  { key: "footprint", color: RING_COLORS.footprint, label: "Footprint" },
  { key: "local", color: RING_COLORS.local, label: "Local" },
  { key: "regen", color: RING_COLORS.regen, label: "Regen" },
] as const;

export const ScoreRings = React.forwardRef<HTMLElement, ScoreRingsProps>(
  function ScoreRings(
    {
      footprint,
      local,
      regen,
      total,
      peerLabel,
      size = 140,
      className,
      hideLegend = false,
    },
    ref
  ) {
    const gps =
      total ?? Math.round(footprint * 0.4 + local * 0.3 + regen * 0.3);
    const center = size / 2;
    const strokeWidth = Math.max(2.5, Math.min(size * 0.05, 8));
    const gap = strokeWidth * 1.6;
    const outerR = center - strokeWidth / 2 - 1;
    const midR = outerR - gap;
    const innerR = midR - gap;
    const minR = size * 0.1;

    const rings = [
      {
        score: footprint,
        color: RING_COLORS.footprint,
        label: "Footprint",
        r: Math.max(outerR, minR),
      },
      {
        score: local,
        color: RING_COLORS.local,
        label: "Local",
        r: Math.max(midR, minR * 0.75),
      },
      {
        score: regen,
        color: RING_COLORS.regen,
        label: "Regen",
        r: Math.max(innerR, minR * 0.5),
      },
    ];

    const isCompact = size <= 64;
    const showPeer = !isCompact && !!peerLabel && size >= 100;
    const scoreFontSize = Math.max(12, Math.min(size * 0.22, 40));
    const peerFontSize = Math.max(8, Math.min(size * 0.065, 11));

    return (
      <figure
        ref={ref as React.Ref<HTMLElement>}
        className={cn("flex flex-col items-center shrink-0", className)}
        role="img"
        aria-label={`Green Passport Score ${gps}. Footprint ${Math.round(footprint)}, local ${Math.round(local)}, regenerative ${Math.round(regen)}${peerLabel ? `. ${peerLabel}.` : "."}`}
      >
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="-rotate-90"
            aria-hidden="true"
          >
            {rings.map((ring) => {
              const circ = 2 * Math.PI * ring.r;
              const offset = circ * (1 - ring.score / 100);
              return (
                <g key={ring.label}>
                  <circle
                    cx={center}
                    cy={center}
                    r={ring.r}
                    fill="none"
                    stroke="hsl(var(--border))"
                    strokeWidth={strokeWidth}
                    opacity={0.35}
                  />
                  <circle
                    cx={center}
                    cy={center}
                    r={ring.r}
                    fill="none"
                    stroke={ring.color}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circ}
                    strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
                  />
                </g>
              );
            })}
          </svg>

          <div
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
            style={{
              padding:
                size - innerR * 2 > 0
                  ? (size - innerR * 2) / 2
                  : strokeWidth * 3,
            }}
          >
            <span
              className="font-black tabular-nums leading-none text-foreground"
              style={{ fontSize: scoreFontSize }}
            >
              {gps}
            </span>
            {showPeer && (
              <span
                className="mt-0.5 text-center leading-tight text-muted-foreground overflow-hidden line-clamp-2"
                style={{ fontSize: peerFontSize, maxWidth: "100%" }}
              >
                {peerLabel}
              </span>
            )}
          </div>
        </div>

        {!hideLegend && !isCompact && (
          <figcaption className="mt-2 flex items-center justify-center gap-x-2.5 gap-y-1 flex-wrap">
            {LEGEND_ITEMS.map((item) => (
              <div key={item.key} className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                  aria-hidden="true"
                />
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </figcaption>
        )}
      </figure>
    );
  }
);

export const ScoreRingsMini = React.forwardRef<
  HTMLElement,
  Omit<ScoreRingsProps, "peerLabel" | "size" | "hideLegend"> & {
    className?: string;
  }
>(function ScoreRingsMini({ footprint, local, regen, total, className }, ref) {
  return (
    <ScoreRings
      ref={ref}
      footprint={footprint}
      local={local}
      regen={regen}
      total={total}
      size={44}
      hideLegend
      className={className}
    />
  );
});
