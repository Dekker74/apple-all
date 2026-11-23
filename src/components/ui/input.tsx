import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border border-line bg-white px-3.5 py-2 text-[16px] text-ink sm:text-[15px] shadow-[inset_0_1px_1px_rgba(11,27,20,0.03)] transition-colors placeholder:text-muted/60 hover:border-sage/70 focus-visible:border-moss disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
