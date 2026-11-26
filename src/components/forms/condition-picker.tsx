"use client";

import { Check } from "lucide-react";
import { CONDITIONS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { MaterialCondition } from "@/types";
import { CONDITION_COPY } from "./form-copy";
import { InlineError } from "./inline-error";
import { useLocalCopy } from "./use-local-copy";

export function ConditionPicker({
  values,
  onChange,
  label,
  hint,
  error,
  id = "condition",
  required = true,
}: {
  values: MaterialCondition[];
  onChange: (values: MaterialCondition[]) => void;
  label: string;
  hint?: string;
  error?: string;
  id?: string;
  required?: boolean;
}) {
  const copy = useLocalCopy(CONDITION_COPY);
  const errorId = `${id}-error`;

  function toggle(value: MaterialCondition) {
    onChange(
      values.includes(value) ? values.filter((item) => item !== value) : [...values, value],
    );
  }

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
        {CONDITIONS.map((option) => {
          const checked = values.includes(option.value);
          const meta = copy[option.value];
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(option.value)}
              className={cn(
                "flex min-h-[88px] items-start gap-2.5 rounded-xl border p-3 text-left transition-colors motion-reduce:transition-none",
                checked
                  ? "border-forest bg-mist/50 ring-1 ring-forest"
                  : "border-line bg-white hover:border-sage",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded border",
                  checked ? "border-forest bg-forest text-paper" : "border-line bg-white",
                )}
              >
                {checked ? <Check className="size-3" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0">
                <span className="block text-[12.5px] font-medium text-ink">{meta.label}</span>
                <span className="mt-0.5 block text-[11.5px] leading-[1.45] text-muted">
                  {meta.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <InlineError id={errorId}>{error}</InlineError>
    </div>
  );
}
