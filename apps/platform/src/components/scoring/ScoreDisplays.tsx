"use client";

import { cn } from "@/lib/utils";
import { GPS_BAND_CONFIG, DPS_BAND_CONFIG, PRESSURE_CONFIG } from "@/lib/constants";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

export function GPSBandBadge({ band }: { band: GreenPassportBand }) {
  const config = GPS_BAND_CONFIG[band];
  const variantClass = {
    regenerative_leader:   "badge-dark",
    regenerative_practice: "bg-success text-success-foreground border-success",
    advancing:             "badge-lime",
    developing:            "badge-pink",
    not_yet_published:     "bg-card text-card-foreground border-border",
  }[band];
  return (
    <span className={cn("badge", variantClass)}>{config.label}</span>
  );
}

export function DPSBandBadge({ band }: { band: DpsBand }) {
  const config = DPS_BAND_CONFIG[band];
  const variantClass = {
    accelerating: "badge-dark",
    progressing:  "bg-success text-success-foreground border-success",
    stable:       "badge-pink",
    regressing:   "badge-purple",
    critical:     "badge-purple",
  }[band];
  return (
    <span className={cn("badge", variantClass)}>
      {config.arrow} {config.label}
    </span>
  );
}

export function PressureBadge({ level }: { level: string }) {
  const config = PRESSURE_CONFIG[level] ?? PRESSURE_CONFIG["moderate"];
  const variantClass =
    level === "low"      ? "badge-green" :
    level === "moderate" ? "badge-lime"  :
                           "badge-purple";
  return (
    <span className={cn("badge", variantClass)}>{config.label}</span>
  );
}

export function GPSScoreDisplay({
  score,
  band,
  size = "default",
}: {
  score: number;
  band: GreenPassportBand;
  size?: "default" | "lg";
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className={cn("font-black tabular-nums", size === "lg" ? "type-h1" : "type-h3")}>
        {score}
      </span>
      <GPSBandBadge band={band} />
    </div>
  );
}

export function PillarBar({
  label,
  score,
  weight,
  colorClass,
}: {
  label: string;
  score: number;
  weight: number;
  colorClass: string;
}) {
  const weighted = Math.round(score * weight * 10) / 10;
  return (
    <div className="space-y-1">
      <div className="flex justify-between gap-2 type-xs">
        <span className="font-medium truncate">{label}</span>
        <span className="tabular-nums text-black shrink-0">
          {score}/100 · {Math.round(weight * 100)}% = {weighted}
        </span>
      </div>
      <div className="h-3 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("pillar-bar", colorClass)}
          style={{ width: `${score}%`, "--bar-width": `${score}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export function GPSCircle({
  score,
  band,
  size = 128,
}: {
  score: number;
  band: GreenPassportBand;
  size?: number;
}) {
  const r = size * 0.44;
  const circumference = 2 * Math.PI * r;

  /* Stroke colors from brand palette — CSS custom properties */
  const strokeColorMap: Record<GreenPassportBand, string> = {
    regenerative_leader:   "var(--brand-green-navy)",
    regenerative_practice: "var(--brand-green)",
    advancing:             "var(--brand-lime)",
    developing:            "var(--brand-pink)",
    not_yet_published:     "var(--brand-base)",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: "var(--brand-pink)" }}
          strokeWidth={size * 0.047}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          style={{ stroke: strokeColorMap[band], transition: "stroke-dashoffset 1s ease-out" }}
          strokeWidth={size * 0.047}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-black tabular-nums", size >= 128 ? "type-h5" : "type-xl")}>
          {score}
        </span>
        <span className="type-label text-black">GPS</span>
      </div>
    </div>
  );
}
