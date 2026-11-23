import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[12px] font-medium leading-4 tracking-[0.01em] whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-transparent bg-forest text-paper",
        outline: "border-line bg-transparent text-muted",
        muted: "border-line bg-sand/70 text-muted",
        lime: "border-lime bg-lime text-forest",
        strong: "border-forest bg-forest text-paper",
        review: "border-amber/30 bg-amber/10 text-amber",
        success: "border-sage/40 bg-mist text-forest",
        warning: "border-amber/30 bg-amber/10 text-amber",
        danger: "border-danger/20 bg-danger/10 text-danger",
        sky: "border-sky/30 bg-sky/10 text-sky",
        white: "border-white/25 bg-white/10 text-paper",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
