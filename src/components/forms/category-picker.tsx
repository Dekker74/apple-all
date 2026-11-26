"use client";

import { Check } from "lucide-react";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MaterialCategory } from "@/types";
import { CategoryIcon } from "@/components/material/category-icon";
import { CATEGORY_COPY } from "./form-copy";
import { InlineError } from "./inline-error";
import { useLocalCopy } from "./use-local-copy";

export function CategoryPicker({
  value,
  onChange,
  label,
  hint,
  error,
  id = "category",
  required = true,
}: {
  value: MaterialCategory | "";
  onChange: (value: MaterialCategory) => void;
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  required?: boolean;
}) {
  const copy = useLocalCopy(CATEGORY_COPY);
  const errorId = `${id}-error`;

  return (
    <div>
      <p className="field-label">
        {label}
        {required ? <span className="ml-1 text-clay">*</span> : null}
      </p>
      {hint ? <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
      <div
        role="group"
        aria-label={label}
        aria-describedby={error ? errorId : undefined}
        className="mt-2.5 grid gap-2 sm:grid-cols-3"
      >
        {CATEGORIES.map((category) => {
          const selected = value === category.value;
          const meta = copy[category.value];
          return (
            <button
              key={category.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(category.value)}
              className={cn(
                "flex min-h-[104px] flex-col rounded-xl border p-3 text-left transition-colors motion-reduce:transition-none",
                selected
                  ? "border-forest bg-mist/50 ring-1 ring-forest"
                  : "border-line bg-white hover:border-sage",
              )}
            >
              <span className="flex items-center justify-between">
                <CategoryIcon category={category.value} size="sm" />
                {selected ? <Check className="size-4 text-forest" strokeWidth={3} /> : null}
              </span>
              <span className="mt-2 text-[13px] font-medium text-ink">{meta.short}</span>
              <span className="mt-0.5 text-[11.5px] leading-[1.45] text-muted">
                {meta.blurb}
              </span>
            </button>
          );
        })}
      </div>
      <InlineError id={errorId}>{error}</InlineError>
    </div>
  );
}
