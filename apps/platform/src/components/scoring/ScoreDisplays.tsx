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
  return (
    <Badge
      className={cn(
        "text-white",
        band === "regenerative_leader" && "bg-emerald-600",
        band === "regenerative_practice" && "bg-green-600",
        band === "advancing" && "bg-teal-600",
        band === "developing" && "bg-amber-600",
        band === "not_yet_published" && "bg-zinc-500"
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
        band === "accelerating" && "bg-emerald-100 text-emerald-800",
        band === "progressing" && "bg-teal-100 text-teal-800",
        band === "stable" && "bg-zinc-100 text-zinc-700",
        band === "regressing" && "bg-orange-100 text-orange-800",
        band === "critical" && "bg-red-100 text-red-800"
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
        level === "low" && "bg-emerald-100 text-emerald-800",
        level === "moderate" && "bg-amber-100 text-amber-800",
        level === "high" && "bg-red-100 text-red-800"
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
  const colorMap: Record<GreenPassportBand, string> = {
    regenerative_leader: "text-emerald-600",
    regenerative_practice: "text-green-600",
    advancing: "text-teal-600",
    developing: "text-amber-600",
    not_yet_published: "text-zinc-500",
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={cn(
          "font-bold tabular-nums",
          size === "lg" ? "text-6xl" : "text-4xl",
          colorMap[band]
        )}
      >
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
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {score}/100 · {Math.round(weight * 100)}% = {weighted}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-700", colorClass)}
          style={{ width: `${score}%` }}
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
  const colorMap: Record<GreenPassportBand, string> = {
    regenerative_leader: "stroke-emerald-500",
    regenerative_practice: "stroke-green-500",
    advancing: "stroke-teal-500",
    developing: "stroke-amber-500",
    not_yet_published: "stroke-zinc-400",
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
          className={colorMap[band]}
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
