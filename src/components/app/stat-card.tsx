import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** KPI tile with a label/value pair and a real supporting figure only. */
export function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border border-line bg-white px-4 py-4 sm:px-5",
        className,
      )}
    >
      <dl className="min-w-0">
        <dt className="flex items-start justify-between gap-2 font-mono text-[11px] uppercase tracking-[0.13em] text-muted">
          <span className="min-w-0 truncate">{label}</span>
          {Icon ? <Icon className="size-3.5 shrink-0 text-muted/70" strokeWidth={1.8} aria-hidden /> : null}
        </dt>
        <dd className="mt-3 truncate font-display text-[30px] leading-none tracking-tight tabular-nums sm:text-[32px]">
          {value}
        </dd>
        {sub ? (
          <dd className="mt-2.5 truncate text-[11.5px] leading-relaxed text-muted">{sub}</dd>
        ) : null}
      </dl>
    </div>
  );
}
