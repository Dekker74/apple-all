"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormStepper({
  steps,
  active,
  onSelect,
  ariaLabel,
  className,
}: {
  steps: string[];
  active: number;
  onSelect: (index: number) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <nav aria-label={ariaLabel} className={cn("w-full", className)}>
      <ol className="flex min-w-max gap-2 overflow-x-auto pb-1">
        {steps.map((label, index) => {
          const done = index < active;
          const current = index === active;
          return (
            <li key={label} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(index)}
                disabled={index > active}
                aria-current={current ? "step" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl border px-3 py-2 text-left transition-colors motion-reduce:transition-none",
                  current
                    ? "border-forest bg-white shadow-soft"
                    : done
                      ? "border-line bg-white/70 hover:border-sage"
                      : "border-line/70 bg-transparent opacity-60",
                )}
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[11px]",
                    done
                      ? "border-forest bg-forest text-paper"
                      : current
                        ? "border-forest text-forest"
                        : "border-line text-muted",
                  )}
                >
                  {done ? <Check className="size-3" strokeWidth={3} /> : index + 1}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-[12px]",
                    current ? "font-medium text-ink" : "text-muted",
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
