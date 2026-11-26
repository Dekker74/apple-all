"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A compact section frame: one heading, one optional action, one content area. */
export function SectionPanel({
  id,
  title,
  note,
  action,
  children,
  className,
  bodyClassName,
}: {
  id?: string;
  title: React.ReactNode;
  note?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-white", className)} aria-labelledby={id}>
      <div className="flex flex-col gap-2 border-b border-line/80 px-5 py-3.5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 id={id} className="text-[13px] font-medium leading-[1.5] text-ink">
            {title}
          </h2>
          {note ? <p className="mt-1 text-[11.5px] leading-relaxed text-muted">{note}</p> : null}
        </div>
        {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
      </div>
      <div className={cn("min-w-0", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Large enough for one-handed use, with an explicit destination and hint. */
export function QuickActionTile({
  href,
  icon: Icon,
  label,
  hint,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[68px] items-center gap-3 rounded-xl border border-line bg-white px-3.5 py-2.5 transition-colors hover:border-sage/70 hover:bg-paper/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss"
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-mist text-forest">
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-ink">{label}</span>
        <span className="mt-0.5 block truncate text-[11.5px] text-muted">{hint}</span>
      </span>
      <ArrowUpRight className="size-3.5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none" />
    </Link>
  );
}

/** Horizontally scrollable status rail. Counts come from real orders only. */
export function PipelineRail({
  items,
  className,
}: {
  items: { label: string; count: number; value?: string }[];
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <div className="grid min-w-[720px] grid-cols-6 divide-x divide-line/70">
        {items.map((item, index) => (
          <div key={item.label} className="bg-white px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                <span className="sr-only">{index + 1}. </span>
                {item.label}
              </span>
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  item.count > 0 ? "bg-moss" : "bg-line",
                )}
                aria-hidden
              />
            </div>
            <p className="mt-2 font-display text-[22px] leading-none tabular-nums">{item.count}</p>
            <p className="mt-1 truncate font-mono text-[11px] text-muted">{item.value ?? "—"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Quiet, static-in-reduced-motion loading state used during real refreshes. */
export function WorkSkeleton({ rows, label }: { rows?: number; label: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2.5 p-4">
      <span className="sr-only">{label}</span>
      <div aria-hidden className="space-y-2.5 motion-safe:animate-pulse">
        {Array.from({ length: rows ?? 3 }).map((_, index) => (
          <div key={index} className="rounded-xl border border-line/70 bg-paper/70 p-3.5">
            <div className="h-2.5 w-2/5 rounded bg-line/70" />
            <div className="mt-2.5 h-2.5 w-4/5 rounded bg-line/50" />
            <div className="mt-2 h-2.5 w-3/5 rounded bg-line/40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatusCallout({
  icon: Icon,
  title,
  description,
  action,
  tone = "neutral",
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
  tone?: "neutral" | "focus" | "warning";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center",
        tone === "focus"
          ? "border-forest/20 bg-mist/60"
          : tone === "warning"
            ? "border-amber/25 bg-amber/[0.06]"
            : "border-line bg-white",
        className,
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg",
          tone === "focus" ? "bg-forest text-lime" : "bg-paper text-forest",
        )}
      >
        <Icon className="size-4" strokeWidth={1.8} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium leading-[1.5] text-ink">{title}</p>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </div>
  );
}
