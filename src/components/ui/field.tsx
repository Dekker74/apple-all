import * as React from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="field-label flex items-center gap-1">
          {label}
          {required ? <span className="text-clay">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-danger">{error}</p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormSection({
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-6 md:grid-cols-[220px_1fr]", className)}>
      <div>
        {eyebrow ? <p className="eyebrow mb-2">{eyebrow}</p> : null}
        <h3 className="text-xl leading-tight">{title}</h3>
        {description ? <p className="mt-2 text-[12px] leading-relaxed text-muted">{description}</p> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
