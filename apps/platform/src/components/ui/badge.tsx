import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        leader: "border-transparent bg-band-leader text-green-foreground",
        practice: "border-transparent bg-band-practice text-teal-foreground",
        advancing: "border-transparent bg-band-advancing text-secondary-foreground",
        developing: "border-transparent bg-band-developing text-amber-foreground",
        unpublished: "border-transparent bg-band-unpublished text-muted-foreground",
        accelerating: "border-transparent bg-dps-accelerating text-green-foreground",
        progressing: "border-transparent bg-dps-progressing text-teal-foreground",
        stable: "border-transparent bg-dps-stable text-secondary-foreground",
        regressing: "border-transparent bg-dps-regressing text-amber-foreground",
        critical: "border-transparent bg-dps-critical text-destructive-foreground",
        "pressure-low": "border-transparent bg-pressure-low text-green-foreground",
        "pressure-moderate": "border-transparent bg-pressure-moderate text-amber-foreground",
        "pressure-high": "border-transparent bg-pressure-high text-destructive-foreground",
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
