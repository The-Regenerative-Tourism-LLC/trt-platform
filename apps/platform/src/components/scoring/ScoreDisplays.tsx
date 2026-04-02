"use client";

/**
 * Score Display Components
 *
 * These components ONLY present ScoreSnapshot data received as props.
 * They do NOT compute, infer, or approximate scores.
 * All values displayed here originate from a persisted ScoreSnapshot.
 */

import { cn } from "@/lib/utils";
import { GPS_BAND_CONFIG, DPS_BAND_CONFIG, PRESSURE_CONFIG } from "@/lib/constants";
import type { GreenPassportBand, DpsBand } from "@/lib/engine/trt-scoring-engine/types";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className
      )}
    >
      {children}
    </span>
  );
}

export function GPSBandBadge({ band }: { band: GreenPassportBand }) {
  const config = GPS_BAND_CONFIG[band];
  const variantMap: Record<GreenPassportBand, string> = {
    regenerative_leader: "leader",
    regenerative_practice: "practice",
    advancing: "advancing",
    developing: "developing",
    not_yet_published: "unpublished",
  };
  return (
    <Badge
      className={cn(
        "border-transparent",
        band === "regenerative_leader" && "bg-band-leader text-green-foreground",
        band === "regenerative_practice" && "bg-band-practice text-teal-foreground",
        band === "advancing" && "bg-band-advancing text-secondary-foreground",
        band === "developing" && "bg-band-developing text-amber-foreground",
        band === "not_yet_published" && "bg-band-unpublished text-muted-foreground"
      )}
    >
      {config.label}
    </Badge>
  );
}

export function DPSBandBadge({ band }: { band: DpsBand }) {
  const config = DPS_BAND_CONFIG[band];
  return (
    <Badge
      className={cn(
        "border-transparent",
        band === "accelerating" && "bg-dps-accelerating text-green-foreground",
        band === "progressing" && "bg-dps-progressing text-teal-foreground",
        band === "stable" && "bg-dps-stable text-secondary-foreground",
        band === "regressing" && "bg-dps-regressing text-amber-foreground",
        band === "critical" && "bg-dps-critical text-destructive-foreground"
      )}
    >
      {config.arrow} {config.label}
    </Badge>
  );
}

export function PressureBadge({ level }: { level: string }) {
  const config = PRESSURE_CONFIG[level] ?? PRESSURE_CONFIG["moderate"];
  return (
    <Badge
      className={cn(
        "border-transparent",
        level === "low" && "bg-pressure-low text-green-foreground",
        level === "moderate" && "bg-pressure-moderate text-amber-foreground",
        level === "high" && "bg-pressure-high text-destructive-foreground"
      )}
    >
      {config.label}
    </Badge>
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
  const config = GPS_BAND_CONFIG[band];
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`${size === "lg" ? "score-number-lg" : "score-number"} animate-score-count`}>
        <span>{score}</span>
      </div>
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
      <div className="flex justify-between gap-2 text-xs sm:text-sm">
        <span className="font-medium truncate">{label}</span>
        <span className="data-mono text-muted-foreground shrink-0">
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
  const strokeColorMap: Record<GreenPassportBand, string> = {
    regenerative_leader: "hsl(var(--band-leader))",
    regenerative_practice: "hsl(var(--band-practice))",
    advancing: "hsl(var(--band-advancing))",
    developing: "hsl(var(--band-developing))",
    not_yet_published: "hsl(var(--band-unpublished))",
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-border"
          strokeWidth={size * 0.047}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColorMap[band]}
          strokeWidth={size * 0.047}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-black tabular-nums", size >= 128 ? "text-4xl" : "text-2xl")}>
          {score}
        </span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">GPS</span>
      </div>
    </div>
  );
}
