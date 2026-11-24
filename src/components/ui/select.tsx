import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  placeholder?: string;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        className={cn(
          "flex h-10 w-full appearance-none items-center rounded-xl border border-line bg-white py-0 pl-3.5 pr-9 text-[16px] leading-none text-ink sm:text-[15px] transition-colors hover:border-sage/70 focus-visible:border-moss disabled:cursor-not-allowed disabled:opacity-50",
          !props.value && props.defaultValue === undefined && "text-muted",
          className,
        )}
        {...props}
      >
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted"
      />
    </div>
  ),
);
Select.displayName = "Select";

export { Select };
