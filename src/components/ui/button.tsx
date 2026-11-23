import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-[13px] font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:pointer-events-none disabled:opacity-45 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.985]",
  {
    variants: {
      variant: {
        default:
          "bg-moss text-white shadow-none hover:bg-[#224634]",
        accent:
          "bg-mint text-moss shadow-none hover:bg-[#bcdcc2]",
        outline:
          "border border-line bg-white text-ink hover:border-moss hover:bg-mint",
        subtle: "bg-sand text-moss hover:bg-mist",
        ghost: "text-ink hover:bg-mint",
        destructive: "bg-danger text-white hover:bg-[#8f2f27]",
        link: "text-moss underline decoration-mint underline-offset-4 hover:decoration-moss",
      },
      size: {
        sm: "h-8 px-3.5 text-[12px]",
        default: "h-10 px-5",
        lg: "h-12 px-6 text-sm",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
