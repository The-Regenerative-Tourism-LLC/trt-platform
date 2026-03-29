"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type Tier = "regenerative" | "advancing" | "developing" | "getting-started";

export function getTier(score: number): Tier {
  if (score >= 70) return "regenerative";
  if (score >= 50) return "advancing";
  if (score >= 30) return "developing";
  return "getting-started";
}

const TIER_CONFIG: Record<
  Tier,
  { label: string; fg: string; bg: string; border: string }
> = {
  regenerative: {
    label: "Regenerative Practice",
    fg: "hsl(var(--tier-regenerative))",
    bg: "hsl(var(--tier-regenerative-bg))",
    border: "hsl(var(--tier-regenerative) / 0.18)",
  },
  advancing: {
    label: "Advancing",
    fg: "hsl(var(--tier-advancing))",
    bg: "hsl(var(--tier-advancing-bg))",
    border: "hsl(var(--tier-advancing) / 0.18)",
  },
  developing: {
    label: "Developing",
    fg: "hsl(var(--tier-developing))",
    bg: "hsl(var(--tier-developing-bg))",
    border: "hsl(var(--tier-developing) / 0.18)",
  },
  "getting-started": {
    label: "Getting Started",
    fg: "hsl(var(--tier-getting-started))",
    bg: "hsl(var(--tier-getting-started-bg))",
    border: "hsl(var(--border))",
  },
};

interface TierBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const TierBadge = React.forwardRef<HTMLSpanElement, TierBadgeProps>(
  function TierBadge({ score, size = "md", className, ...props }, ref) {
    const tier = getTier(score);
    const config = TIER_CONFIG[tier];
    const sizeClasses = {
      sm: "min-h-6 px-2.5 text-[10px]",
      md: "min-h-7 px-3 text-[11px]",
      lg: "min-h-8 px-3.5 text-xs",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full border font-semibold whitespace-nowrap",
          sizeClasses[size],
          className
        )}
        style={{
          backgroundColor: config.bg,
          color: config.fg,
          borderColor: config.border,
        }}
        aria-label={`${config.label}, score ${Math.round(score)}`}
        {...props}
      >
        {config.label}
      </span>
    );
  }
);

export { TIER_CONFIG };
