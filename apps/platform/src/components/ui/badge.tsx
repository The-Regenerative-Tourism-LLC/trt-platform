import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default:     "bg-primary text-primary-foreground border-primary",
        secondary:   "badge-pink",
        destructive: "badge-purple",
        outline:     "bg-transparent text-foreground border-border",
        success:     "badge-green",
        /* GPS band variants */
        leader:      "badge-dark",
        practice:    "bg-success text-success-foreground border-success",
        advancing:   "badge-lime",
        developing:  "badge-pink",
        unpublished: "bg-card text-card-foreground border-border",
        /* DPS variants */
        accelerating: "badge-dark",
        progressing:  "bg-success text-success-foreground border-success",
        stable:       "badge-pink",
        regressing:   "badge-purple",
        critical:     "badge-purple",
        /* Pressure variants */
        "pressure-low":      "badge-green",
        "pressure-moderate": "badge-lime",
        "pressure-high":     "badge-purple",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
